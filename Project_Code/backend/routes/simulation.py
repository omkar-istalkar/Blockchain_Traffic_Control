# routes/simulation.py
import threading
import time
import xml.etree.ElementTree as ET
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from threading import Lock
from math import fsum
import os

router = APIRouter()

# ---------------- CONFIG (change these paths for your system) ----------------
SUMO_CLI_PATH = r"D:\BE_Project\project\sumo-1.23.1\bin\sumo.exe"
SUMO_GUI_PATH = r"D:\BE_Project\project\sumo-1.23.1\bin\sumo-gui.exe"

# SUMO config (keep your existing .sumocfg path)
SUMO_CONFIG_FILE = r"D:\BE_Project\TrafficControlProject\backend\sumo\networks\network1.sumocfg"

# Network folder & net filename (keep these names)
SUMO_NETWORK_FOLDER = r"D:\BE_Project\TrafficControlProject\backend\sumo\networks"
NET_XML = "network1.net.xml"

# Background image that we serve (the file you uploaded in this session)
BG_IMAGE_PATH = None

# ---------------- Auto-select SUMO executable ----------------
if os.path.isfile(SUMO_CLI_PATH):
    SUMO_CMD = [SUMO_CLI_PATH, "-c", SUMO_CONFIG_FILE]
elif os.path.isfile(SUMO_GUI_PATH):
    SUMO_CMD = [SUMO_GUI_PATH, "-c", SUMO_CONFIG_FILE]
else:
    SUMO_CMD = ["sumo", "-c", SUMO_CONFIG_FILE]

# ---------------- traci availability ----------------
try:
    import traci
    TRACI_AVAILABLE = True
except Exception:
    traci = None
    TRACI_AVAILABLE = False

# ---------------- shared state and locks ----------------
_running_lock = Lock()
_running_flag = {"value": False}

_latest_lock = Lock()
latest_data: Dict[str, Any] = {
    "step": 0,
    "vehicles": [],
    "traffic_lights": [],
    "running": False,
    "time": 0.0
}

# ---------------- XML parse helpers ----------------
def _parse_shape(shape_str):
    pts = []
    if not shape_str:
        return pts
    for token in shape_str.strip().split():
        if "," in token:
            try:
                x_s, y_s = token.split(",")
                pts.append([float(x_s), float(y_s)])
            except Exception:
                continue
    return pts

def _compute_midpoint(shape_pts):
    if not shape_pts:
        return None
    sx = sy = 0.0
    n = 0
    for (x,y) in shape_pts:
        sx += x; sy += y; n += 1
    if n == 0:
        return None
    return [sx / n, sy / n]

def parse_net_xml_detailed(net_path: str):
    """
    Return:
    { edges: [ {id, from, to, shape:[[x,y],...], lanes:[{id, shape, length, speed, midpoint}] } ],
      junctions: [ {id, x, y, type}, ... ]
    }
    """
    try:
        tree = ET.parse(net_path)
        root = tree.getroot()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse net xml: {e}")

    edges_out = []
    for edge in root.findall(".//edge"):
        eid = edge.get("id")
        from_node = edge.get("from")
        to_node = edge.get("to")
        shape = edge.get("shape")
        lanes_list = []
        for lane in edge.findall("lane"):
            lane_shape = _parse_shape(lane.get("shape")) if lane.get("shape") else []
            midpoint = _compute_midpoint(lane_shape)
            lanes_list.append({
                "id": lane.get("id"),
                "length": float(lane.get("length")) if lane.get("length") else None,
                "speed": float(lane.get("speed")) if lane.get("speed") else None,
                "shape": lane_shape,
                "midpoint": midpoint
            })
            if not shape and lane.get("shape"):
                shape = lane.get("shape")
        edge_shape_pts = _parse_shape(shape) if shape else []
        edges_out.append({
            "id": eid,
            "from": from_node,
            "to": to_node,
            "shape": edge_shape_pts,
            "lanes": lanes_list
        })

    # junctions
    junctions_out = []
    for j in root.findall(".//junction"):
        jid = j.get("id")
        xpos = j.get("x")
        ypos = j.get("y")
        if xpos is None or ypos is None:
            continue
        try:
            junctions_out.append({"id": jid, "x": float(xpos), "y": float(ypos), "type": j.get("type")})
        except:
            continue

    return {"edges": edges_out, "junctions": junctions_out}

# ---------------- SUMO runner ----------------
def run_sumo():
    global latest_data
    if not TRACI_AVAILABLE:
        with _latest_lock:
            latest_data["running"] = False
            latest_data["error"] = "traci not available"
        return

    with _running_lock:
        _running_flag["value"] = True

    try:
        try:
            traci.start(SUMO_CMD)
            print("✅ SUMO started")
        except Exception as e:
            with _latest_lock:
                latest_data["running"] = False
                latest_data["error"] = f"traci.start failed: {e}"
            print("traci.start failed:", e)
            with _running_lock:
                _running_flag["value"] = False
            return

        step = 0
        while True:
            with _running_lock:
                if not _running_flag["value"]:
                    break

            try:
                traci.simulationStep()
            except Exception as e:
                print("traci.simulationStep failed:", e)
                break

            vehicles_list = []
            try:
                for vid in traci.vehicle.getIDList():
                    try:
                        px, py = traci.vehicle.getPosition(vid)
                        vehicles_list.append({
                            "id": vid,
                            "x": px,
                            "y": py,
                            "angle": traci.vehicle.getAngle(vid),
                            "speed": traci.vehicle.getSpeed(vid),
                            "lane": traci.vehicle.getLaneID(vid),
                            "edge": traci.vehicle.getRoadID(vid)
                        })
                    except Exception:
                        continue
            except Exception:
                vehicles_list = []

            tls_list = []
            try:
                for tid in traci.trafficlight.getIDList():
                    try:
                        state = traci.trafficlight.getRedYellowGreenState(tid)
                        phase = traci.trafficlight.getPhase(tid)
                        try:
                            controlled = traci.trafficlight.getControlledLanes(tid)
                        except Exception:
                            controlled = []
                        tls_list.append({
                            "id": tid,
                            "state": state,
                            "phaseIndex": phase,
                            "controlledLanes": controlled
                        })
                    except Exception:
                        continue
            except Exception:
                tls_list = []

            with _latest_lock:
                latest_data["step"] = step
                latest_data["vehicles"] = vehicles_list
                latest_data["traffic_lights"] = tls_list
                latest_data["running"] = True
                try:
                    latest_data["time"] = float(traci.simulation.getTime())
                except Exception:
                    latest_data["time"] = 0.0

            step += 1
            time.sleep(0.01)

    finally:
        try:
            if TRACI_AVAILABLE:
                traci.close()
        except Exception:
            pass
        with _running_lock:
            _running_flag["value"] = False
        with _latest_lock:
            latest_data["running"] = False
        print("⏹️ SUMO runner stopped")

# ---------------- API endpoints ----------------
@router.post("/start")
def start_simulation():
    with _running_lock:
        if _running_flag["value"]:
            return {"message": "SUMO already running"}
        t = threading.Thread(target=run_sumo, daemon=True)
        t.start()
    return {"message": "SUMO starting"}

@router.post("/stop")
def stop_simulation():
    with _running_lock:
        if not _running_flag["value"]:
            return {"message": "SUMO not running"}
        _running_flag["value"] = False
    return {"message": "Stopping SUMO"}

@router.get("/current")
def get_current():
    with _latest_lock:
        return {
            "step": latest_data.get("step", 0),
            "vehicle_count": len(latest_data.get("vehicles", [])),
            "running": latest_data.get("running", False),
            "time": latest_data.get("time", 0.0)
        }

@router.get("/positions")
def get_positions():
    with _latest_lock:
        return {
            "step": latest_data.get("step", 0),
            "time": latest_data.get("time", 0.0),
            "vehicles": list(latest_data.get("vehicles", [])),
            "traffic_lights": list(latest_data.get("traffic_lights", [])),
            "running": latest_data.get("running", False)
        }

@router.get("/network")
def get_network():
    net_path = f"{SUMO_NETWORK_FOLDER}/{NET_XML}"
    return parse_net_xml_detailed(net_path)

@router.get("/background")
def get_background_image():
    try:
        return FileResponse(BG_IMAGE_PATH, media_type="image/png", filename="sumo_background.png")
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Background not found: {e}")

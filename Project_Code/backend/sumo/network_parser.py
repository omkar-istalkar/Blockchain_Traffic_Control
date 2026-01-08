# backend/network_parser.py
import xml.etree.ElementTree as ET
import json

# Path to your SUMO network (.net.xml)
NET_XML_PATH = r"D:\BE_Project\TrafficControlProject\backend\sumo\networks\network1.net.xml"

def parse_netfile(path=NET_XML_PATH):
    """
    Parse SUMO .net.xml to extract lane geometries and junctions.
    Returns dictionary: {"lanes":[{id, shape:[[x,y],...] , length}], "junctions":[{id,x,y}...]}
    """
    tree = ET.parse(path)
    root = tree.getroot()
    ns = ""  # SUMO xml usually has no namespace; adjust if your file uses namespaces.

    lanes = []
    junctions = []
    # lanes appear as <lane id="edge_0_0" index="0" shape="x1,y1 x2,y2 ..." speed="13.9"/>
    for lane in root.findall(".//lane"):
        lid = lane.get("id")
        shape_attr = lane.get("shape")
        length = lane.get("length")
        if shape_attr:
            coords = []
            for pair in shape_attr.strip().split():
                x_s, y_s = pair.split(",")
                coords.append([float(x_s), float(y_s)])
            lanes.append({"id": lid, "shape": coords, "length": float(length) if length else None})

    # junctions
    for j in root.findall(".//junction"):
        jid = j.get("id")
        x = j.get("x")
        y = j.get("y")
        if jid is not None and x is not None and y is not None:
            junctions.append({"id": jid, "x": float(x), "y": float(y)})

    return {"lanes": lanes, "junctions": junctions}

if __name__ == "__main__":
    data = parse_netfile()
    print(f"Parsed lanes: {len(data['lanes'])}, junctions: {len(data['junctions'])}")
    # optionally write to file
    with open("network_snapshot.json", "w") as f:
        json.dump(data, f)
    print("Wrote network_snapshot.json")

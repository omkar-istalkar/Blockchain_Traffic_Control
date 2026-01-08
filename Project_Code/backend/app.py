from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from routes import signals, dashboard, simulation
from blockchain.blockchain import (
    get_all_nodes,
    set_active_node,
    get_active_node,
    add_log,
    get_all_logs
)

app = FastAPI(title="Traffic Control Backend")

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Existing Routers
# -----------------------------
app.include_router(signals.router, prefix="/signals", tags=["Traffic Signals"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(simulation.router, prefix="/simulation", tags=["Simulation"])

# -----------------------------
# Blockchain Schemas
# -----------------------------
class NodeSelectRequest(BaseModel):
    nodeId: int

class LogRequest(BaseModel):
    event: str
    intersection: str

# -----------------------------
# Blockchain APIs (FastAPI)
# -----------------------------

@app.get("/blockchain/nodes")
def blockchain_nodes():
    return get_all_nodes()


@app.post("/blockchain/select-node")
def blockchain_select_node(data: NodeSelectRequest):
    set_active_node(data.nodeId)
    return {
        "status": "Node selected",
        "activeNode": get_active_node()
    }


@app.get("/blockchain/active-node")
def blockchain_active_node():
    return get_active_node()


@app.post("/blockchain/log")
def blockchain_log_event(data: LogRequest):
    tx = add_log(data.event, data.intersection)
    return {"txHash": tx}


@app.get("/blockchain/logs")
def blockchain_logs():
    return get_all_logs()


@app.get("/")
def root():
    return {"message": "Traffic Control Backend is running"}

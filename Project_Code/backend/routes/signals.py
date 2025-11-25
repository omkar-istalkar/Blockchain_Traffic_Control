# routes/signals.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from threading import Lock

router = APIRouter()

_signal_lock = Lock()
current_signal = {"signal_id": "TL1", "state": "GREEN", "time_remaining": 25, "vehicle_count": 10}

class SignalChangeRequest(BaseModel):
    state: Literal["GREEN", "YELLOW", "RED"]

@router.post("/change/{signal_id}")
def change_signal(signal_id: str, payload: SignalChangeRequest):
    # In your system you might log to blockchain here. For now return a mock tx hash.
    tx_hash = f"tx_{signal_id}_{payload.state}"
    with _signal_lock:
        current_signal["signal_id"] = signal_id
        current_signal["state"] = payload.state
        current_signal["time_remaining"] = 30
    return {"message": f"Signal {signal_id} changed to {payload.state}", "tx_hash": tx_hash}

@router.get("/current")
def get_current_signal():
    with _signal_lock:
        return dict(current_signal)

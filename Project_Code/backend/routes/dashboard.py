from fastapi import APIRouter
from blockchain.blockchain import get_all_logs

router = APIRouter()

@router.get("/events")
def get_events():
    events = get_all_events()
    return {"events": events}

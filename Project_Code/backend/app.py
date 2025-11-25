from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import signals, dashboard, simulation

app = FastAPI(title="Traffic Control Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev, allow all; later restrict to ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
app.include_router(signals.router, prefix="/signals", tags=["Traffic Signals"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(simulation.router, prefix="/simulation", tags=["Simulation"])

@app.get("/")
def root():
    return {"message": "Traffic Control Backend is running"}

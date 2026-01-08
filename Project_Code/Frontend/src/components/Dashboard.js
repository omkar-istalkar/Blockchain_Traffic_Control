import React, { useEffect, useState, useRef } from "react";
import SumoCanvas from "./SumoCanvas";
import BlockchainLogs from "./BlockchainLogs";
import SignalNodeSelector from "./SignalNodeSelector";

const API_BASE = "http://localhost:8000";

export default function Dashboard() {
  // simulation / SUMO state
  const [simStatusText, setSimStatusText] = useState("Unknown");
  const [latestData, setLatestData] = useState({ signal: "-", vehicles: 0, step: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const pollRef = useRef(null);

  // graph
  const [graphType, setGraphType] = useState("speed");

  // blockchain events
  const [events, setEvents] = useState([]);
  const [selectedNode, setSelectedNode] = useState("All");

  // signal change form
  const [signalId, setSignalId] = useState("TL1");
  const [signalState, setSignalState] = useState("GREEN");
  const [signalResponse, setSignalResponse] = useState(null);

  useEffect(() => {
    // initial fetches
    fetchSimCurrent();
    fetchEvents();

    // start polling simulation current data every 1s
    startPolling();

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling helpers
  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(fetchSimCurrent, 1000);
  };
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // API calls
  const fetchSimCurrent = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/current`);
      if (!res.ok) throw new Error("Failed to fetch simulation current");
      const data = await res.json();
      setLatestData(data);
      setSimStatusText(data.signal ?? "Unknown");
      // If step > 0 assume running
      setIsRunning(Boolean(data.step > 0));
    } catch (err) {
      // keep existing state but mark status
      setSimStatusText("Unavailable");
      setIsRunning(false);
    }
  };

  const startSimulation = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/start`, { method: "POST" });
      const j = await res.json();
      setSignalResponse(j.message || "Started");
      setIsRunning(true);
      // quick refresh
      setTimeout(fetchSimCurrent, 500);
    } catch (err) {
      setSignalResponse("Start failed");
    }
  };

  const stopSimulation = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/stop`, { method: "POST" });
      const j = await res.json();
      setSignalResponse(j.message || "Stopped");
      setIsRunning(false);
      // quick refresh
      setTimeout(fetchSimCurrent, 500);
    } catch (err) {
      setSignalResponse("Stop failed");
    }
  };

  const fetchEvents = async (node = null) => {
    try {
      // dashboard.events returns { events: [...] }
      const res = await fetch(`${API_BASE}/dashboard/events`);
      const j = await res.json();
      if (j && Array.isArray(j.events)) {
        if (node && node !== "All") {
          setEvents(j.events.filter((e) => e.node === node || e.from === node || e.to === node));
        } else {
          setEvents(j.events);
        }
      } else {
        setEvents([]);
      }
    } catch (err) {
      setEvents([]);
    }
  };

  // helpers
  const humanTime = (val) => (val == null ? "-" : String(val));

  return (
    <div className="dashboard-root">
      {/* SECTION 1 - Header */}
      <header className="header">
        <div className="header-left">
          {/* <img
            src="/mnt/data/a4f788c0-6b34-449f-8623-d17fbb184863.png"
            alt="logo"
            className="logo"
          /> */}
          <div>
            <h1>Decentralized Traffic Control</h1>
            <div className="sub">Frontend Dashboard</div>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="grid">
        {/* SECTION 2 - Controls */}
        <section className="card controls">
          <h3>Simulation Controls</h3>
          <div className="controls-row">
            <button className="btn start" onClick={startSimulation}>
              Start Simulation
            </button>
            <button className="btn stop" onClick={stopSimulation}>
              Stop Simulation
            </button>
          </div>
          {signalResponse && <div className="small-info">Last response: {signalResponse}</div>}
        </section>

        {/* SECTION 4 - SUMO GUI display (live status area) */}
        <section className="card sumo">
          <h3>Live SUMO / Simulation Feed</h3>

          {/* <div className="sumo-grid">
            <div className="sumo-box">
              <div className="sumo-label">Current TL State</div>
              <div className="sumo-value">{latestData.signal}</div>
            </div>

            <div className="sumo-box">
              <div className="sumo-label">Vehicles on edge</div>
              <div className="sumo-value">{latestData.vehicles}</div>
            </div>

            <div className="sumo-box">
              <div className="sumo-label">Simulation Step</div>
              <div className="sumo-value">{latestData.step}</div>
            </div>
          </div> */}

          <SumoCanvas width={650} height={450} pollMs={400} />

          <div className="sumo-footer">
            <small>Polling live state from <code>/simulation/current</code> every 1s</small>
          </div>
        </section>

        {/* SECTION 3 - Graph placeholder */}
        <section className="card graph">
          <div className="graph-header">
            <select value={graphType} onChange={(e) => setGraphType(e.target.value)}>
              <option value="speed">Speed Graph</option>
              <option value="density">Traffic Density</option>
              <option value="delay">Signal Delay</option>
            </select>
            <button className="btn small" onClick={() => alert("Graph component not implemented yet")}>Preview</button>
          </div>

          <div className="graph-area">
            <p>Graph placeholder for: <strong>{graphType}</strong></p>
            <p style={{ opacity: 0.8 }}>Integrate Chart.js or Recharts here and call APIs to populate data.</p>
          </div>
        </section>

        {/* SECTION 5 - Blockchain transactions */}
        <section className="card blockchain">
          <h3>Blockchain Transactions</h3>

          <SignalNodeSelector/>



          {/* <div className="block-top">
            <label>
              Filter Node:
              <select value={selectedNode} onChange={(e) => { setSelectedNode(e.target.value); fetchEvents(e.target.value); }}>
                <option>All</option>
                <option>Node 1</option>
                <option>Node 2</option>
                <option>Node 3</option>
              </select>
            </label>
            <button className="btn small" onClick={() => fetchEvents(selectedNode)}>Refresh</button>
          </div>

          <div className="events-list">
            {events.length === 0 && <div className="muted">No transactions found.</div>}
            {events.map((ev, idx) => (
              <div className="event-row" key={idx}>
                <div className="event-type">{ev.type ?? ev.event ?? "TX"}</div>
                <div className="event-payload">{ev.payload ?? ev.data ?? JSON.stringify(ev)}</div>
                <div className="event-meta">{ev.tx_hash ?? ev.hash ?? ""} • {ev.timestamp ?? ""}</div>
              </div>
            ))}
          </div> */}



        </section>
      </main>
    </div>
  );
}

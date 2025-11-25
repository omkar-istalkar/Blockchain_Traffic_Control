// src/components/SumoCanvas.js
import React, { useRef, useEffect, useState } from "react";

const API_BASE = "http://localhost:8000";
const POLL_MS = 200;

function computeBBox(edges) {
  let minx=Infinity, miny=Infinity, maxx=-Infinity, maxy=-Infinity;
  (edges || []).forEach(e => {
    (e.shape || []).forEach(([x,y]) => {
      if (x < minx) minx = x;
      if (y < miny) miny = y;
      if (x > maxx) maxx = x;
      if (y > maxy) maxy = y;
    });
    (e.lanes || []).forEach(l => {
      (l.shape || []).forEach(([x,y]) => {
        if (x < minx) minx = x;
        if (y < miny) miny = y;
        if (x > maxx) maxx = x;
        if (y > maxy) maxy = y;
      });
    });
  });
  if (!isFinite(minx)) {
    minx = 0; miny = 0; maxx = 100; maxy = 100;
  }
  const padX = (maxx - minx) * 0.06 || 5;
  const padY = (maxy - miny) * 0.06 || 5;
  return { minx: minx - padX, miny: miny - padY, maxx: maxx + padX, maxy: maxy + padY };
}

function worldToScreen([x,y], bbox, width, height) {
  const { minx, miny, maxx, maxy } = bbox;
  const sx = (x - minx) / (maxx - minx || 1);
  const sy = 1 - (y - miny) / (maxy - miny || 1);
  return [sx * width, sy * height];
}

export default function SumoCanvas({ width=900, height=600, pollMs=POLL_MS }) {
  const canvasRef = useRef(null);
  const [network, setNetwork] = useState({ edges: [], junctions: [] });
  const bboxRef = useRef({ minx:0, miny:0, maxx:100, maxy:100 });
  const prevRef = useRef({ vehicles: {}, timestamp: Date.now(), step: 0 });
  const latestRef = useRef({ vehicles: {}, raw: null, timestamp: Date.now(), step: 0 });
  const staticCanvasRef = useRef(null); // offscreen cache

  // fetch network and draw static background into offscreen canvas
  useEffect(() => {
    fetch(`${API_BASE}/simulation/network`).then(r => r.json()).then(data => {
      setNetwork(data);
      const bbox = computeBBox(data.edges || []);
      bboxRef.current = bbox;
      // prepare offscreen canvas cache
      const off = document.createElement("canvas");
      off.width = width;
      off.height = height;
      const ctx = off.getContext("2d");
      // draw static background on offscreen
      ctx.fillStyle = "#f7f7f7";
      ctx.fillRect(0,0,width,height);

      // road base
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      (data.edges || []).forEach(edge => {
        const pts = edge.shape || [];
        if (pts.length < 2) return;
        ctx.beginPath();
        pts.forEach((p, idx) => {
          const [sx, sy] = worldToScreen(p, bbox, width, height);
          if (idx === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.lineWidth = 14;
        ctx.strokeStyle = "#444";
        ctx.stroke();
        ctx.lineWidth = 16;
        ctx.strokeStyle = "#555";
        ctx.stroke();
      });

      // lane centerlines dashed
      ctx.lineWidth = 1.2;
      ctx.setLineDash([8,6]);
      (data.edges || []).forEach(edge => {
        (edge.lanes || []).forEach(lane => {
          const lpts = lane.shape || [];
          if (lpts.length < 2) return;
          ctx.beginPath();
          lpts.forEach((p, idx) => {
            const [sx, sy] = worldToScreen(p, bbox, width, height);
            if (idx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
          });
          ctx.strokeStyle = "rgba(255,255,255,0.22)";
          ctx.stroke();
        });
      });
      ctx.setLineDash([]);

      // junction circles
      (data.junctions || []).forEach(j => {
        const [sx, sy] = worldToScreen([j.x, j.y], bbox, width, height);
        ctx.beginPath();
        ctx.fillStyle = "rgba(0,0,0,0.06)";
        ctx.arc(sx, sy, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 1; ctx.stroke();
      });

      staticCanvasRef.current = off;
    }).catch(err => console.warn("Failed to load network", err));
  }, [width, height]);

  // poll positions
  useEffect(() => {
    let mounted = true;
    const fetchPos = async () => {
      try {
        const res = await fetch(`${API_BASE}/simulation/positions`);
        if (!res.ok) throw new Error("positions fetch failed");
        const j = await res.json();
        if (!mounted) return;
        const now = Date.now();
        const vmap = {};
        (j.vehicles || []).forEach(v => vmap[v.id] = v);
        prevRef.current = latestRef.current;
        latestRef.current = { vehicles: vmap, raw: j, timestamp: now, step: j.step || 0 };
      } catch (e) {
        // ignore transient errors
      }
    };
    fetchPos();
    const id = setInterval(fetchPos, pollMs);
    return () => { mounted = false; clearInterval(id); };
  }, [pollMs]);

  // draw loop: blit staticCanvas + dynamic overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = null;
    function draw() {
      // draw static background from offscreen cache if present
      if (staticCanvasRef.current) {
        ctx.clearRect(0,0,width,height);
        ctx.drawImage(staticCanvasRef.current, 0, 0, width, height);
      } else {
        // fallback fill
        ctx.fillStyle = "#f7f7f7"; ctx.fillRect(0,0,width,height);
      }

      // interpolation
      const prev = prevRef.current;
      const latest = latestRef.current;
      const t0 = prev.timestamp || latest.timestamp;
      const t1 = latest.timestamp || t0;
      let frac = 1;
      if (t1 > t0) frac = Math.min(1, (Date.now() - t0) / Math.max(1, t1 - t0));

      // vehicles
      const ids = new Set([...Object.keys(prev.vehicles || {}), ...Object.keys(latest.vehicles || {})]);
      ids.forEach(id => {
        const a = prev.vehicles[id];
        const b = latest.vehicles[id];
        let x=0,y=0,angle=0,speed=0;
        if (a && b) {
          x = a.x + (b.x - a.x) * frac;
          y = a.y + (b.y - a.y) * frac;
          angle = a.angle + (b.angle - a.angle) * frac;
          speed = b.speed ?? a.speed ?? 0;
        } else if (b && !a) {
          x = b.x; y = b.y; angle = b.angle; speed = b.speed || 0;
        } else if (a && !b) {
          x = a.x; y = a.y; angle = a.angle; speed = a.speed || 0;
        } else return;

        const [sx, sy] = worldToScreen([x,y], bboxRef.current, width, height);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate((-angle * Math.PI) / 180);
        const speedNorm = Math.min(1, (speed / 15));
        const r = Math.floor(255 * (1 - speedNorm));
        const g = Math.floor(120 + 130 * speedNorm);
        ctx.fillStyle = `rgb(${r},${g},40)`;
        ctx.strokeStyle = "#222"; ctx.lineWidth = 0.6;
        const vw = 7, vh = 13;
        ctx.fillRect(-vw/2, -vh/2, vw, vh);
        ctx.strokeRect(-vw/2, -vh/2, vw, vh);
        ctx.restore();
      });

      // traffic lights from latest snapshot
      const tls = (latest.raw && latest.raw.traffic_lights) || [];
      tls.forEach(t => {
        let pos = null;
        if (t.controlledLanes && t.controlledLanes.length > 0) {
          for (const ln of t.controlledLanes) {
            for (const e of (network.edges || [])) {
              const found = (e.lanes || []).find(l => l.id === ln);
              if (found && found.midpoint) { pos = found.midpoint; break; }
            }
            if (pos) break;
          }
        }
        if (!pos) {
          if (network.junctions && network.junctions.length>0) pos = [network.junctions[0].x, network.junctions[0].y];
          else pos = [bboxRef.current.minx + 5, bboxRef.current.maxy - 5];
        }

        const [sx, sy] = worldToScreen(pos, bboxRef.current, width, height);
        const s = (t.state || "").toLowerCase();
        let color = "#666";
        if (s.includes("g")) color = "green";
        else if (s.includes("y")) color = "yellow";
        else if (s.includes("r")) color = "red";
        ctx.beginPath(); ctx.fillStyle = color; ctx.arc(sx, sy, 7, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#111"; ctx.lineWidth = 1; ctx.stroke();
      });

      ctx.fillStyle = "#111"; ctx.font = "12px sans-serif";
      ctx.fillText(`Step: ${latest.step} Vehicles: ${Object.keys(latest.vehicles || {}).length}`, 10, 16);

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [network, width, height]);

  return <canvas ref={canvasRef} style={{ border: "1px solid #ddd", width: `${width}px`, height: `${height}px` }} />;
}

# Code regarding "Traffic Controll Module" will be placed here
---

# 📂 `traffic_control/README.md` (Member 2 – Traffic Control)

```markdown
# 🚦 Adaptive Traffic Signal Control (Member 2)

## 🎯 Objective
Use SUMO + TraCI to simulate traffic and create **adaptive green corridors** for emergency vehicles based on detection alerts.

---

## 📌 Tasks
1. Model intersections in SUMO (`network.net.xml`, `network.sumocfg`).  
2. Write `traffic_controller.py` to:  
   - Monitor normal traffic flow.  
   - Receive alerts from the detection system.  
   - Adapt traffic light timing dynamically.  
   - Create green corridors for emergency vehicles.  
3. Provide APIs for sharing signal states with the dashboard.  

---

## 📥 Input
- Alert JSON from **Detection Module**, format:  
```json
{
  "vehicleType": "ambulance",
  "confidence": 0.95,
  "timestamp": "2025-09-12T12:30:00Z"
}

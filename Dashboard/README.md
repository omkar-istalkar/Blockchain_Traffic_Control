# Code regarding "Dashboard Module" will be placed here

---

# 📂 `dashboard/README.md` (Member 4 – Dashboard)

```markdown
# 📊 Frontend Dashboard (Member 4)

## 🎯 Objective
Build a **React + Flask dashboard** to visualize traffic signals, detections, and blockchain logs in real time.

---

## 📌 Tasks
1. **Backend (Flask)**:  
   - Expose APIs for detection alerts, traffic signals, and blockchain logs.  
   - Act as middleware between all modules.  

2. **Frontend (React)**:  
   - Show traffic signal states (from SUMO).  
   - Display emergency vehicle detections.  
   - Show blockchain transaction logs.  
   - Provide a user-friendly admin interface.  

---

## 📥 Input
- Detection alerts from **Detection module**.  
- Signal states from **Traffic Control module**.  
- Logs from **Blockchain module**.  

---

## 📤 Output
- A web-based dashboard with:  
  - ✅ Map of intersections & signal states.  
  - ✅ Emergency vehicle detection alerts.  
  - ✅ Blockchain logs of events.  
  - ✅ Real-time updates.  

---

## ✅ Deliverables
- `backend/` → Flask APIs.  
- `frontend/` → React dashboard.  
- UI components and dashboard screenshots.  

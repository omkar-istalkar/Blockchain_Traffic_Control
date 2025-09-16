# Code regarding "Detection Module" will be placed in this folder

# 🚨 Emergency Vehicle Detection (Member 1)

## 🎯 Objective
Detect ambulances, fire trucks, or police cars using a trained computer vision model (YOLOv5 + OpenCV), and send alerts to the backend system.

---

## 📌 Tasks
1. Train or fine-tune YOLOv5 for emergency vehicle detection.  
2. Write a script (`detection.py`) to:  
   - Open camera/video feed.  
   - Detect emergency vehicles in real time.  
   - Draw bounding boxes with labels.  
   - Send alert data (JSON format) to the backend API.  
3. Maintain a `requirements.txt` file listing dependencies.  
4. Commit work only inside the `detection/` folder and the `detection` branch.

---

## 📥 Input
- Video feed or camera stream.  

---

## 📤 Output Expected by Next Member
- Alert JSON sent to backend, format:  
```json
{
  "vehicleType": "ambulance",
  "confidence": 0.95,
  "timestamp": "2025-09-12T12:30:00Z"
}

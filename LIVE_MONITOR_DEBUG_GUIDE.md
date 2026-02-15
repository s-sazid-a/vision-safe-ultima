# 🔧 LIVE MONITOR DEBUG & TROUBLESHOOTING GUIDE

## 🚨 Issue: No Detection, No Bounding Boxes, Confidence = 0

### Quick Diagnosis Checklist

```
[ ] Backend running at http://localhost:8000?
[ ] Frontend running at http://localhost:5173?
[ ] Browser console shows WebSocket connection messages?
[ ] Models loaded successfully? (Check backend logs)
[ ] Camera/file selected in UI?
```

---

## 🔍 DEBUGGING STEPS

### Step 1: Check Backend Health
```bash
# Terminal - Backend should show this on startup
✓ Configuration validation passed
✓ Device: cuda (or cpu)
✓ ML Service initialized successfully
✓ Health Check: http://localhost:8000/health
```

**Action**: Go to http://localhost:8000/health in browser  
**Expected Response**:
```json
{
  "status": "healthy",
  "ml_service_ready": true,
  "device": "cuda"
}
```

**If FAILS**: Models not loading
```bash
cd vision_safe_ultima_backend_v2.0
ls models/
# Should show: safe_detector.pt  unsafe_detector.pt  model_metadata.json
```

---

### Step 2: Check Browser Console (F12)

**Look for these messages**:
```javascript
✅ [CAM-1] WebSocket Connected to ws://localhost:8000/ws/stream
✅ [CAM-1] Risk: LOW (0%)
✅ Frame: Safe=0, Unsafe=0, ...
```

**If you see errors**:
```
❌ [CAM-1] WebSocket error
→ Backend not running or CORS issue
```

---

### Step 3: Check WebSocket Connection

In browser console, run:
```javascript
// Test WebSocket connection
const ws = new WebSocket('ws://localhost:8000/ws/stream');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (e) => console.log('❌ WebSocket error:', e);
ws.onmessage = (e) => console.log('📨 Message:', JSON.parse(e.data));
```

---

### Step 4: Verify Backend is Processing Frames

**Backend Console Should Show**:
```
📺 Processing frame 0, size: 123456 bytes
Frame 0: Safe=0, Unsafe=0, Risk=LOW, Inference=45.2ms
```

**If NOT showing**: Frames not being sent from frontend

---

### Step 5: Check Frontend Canvas & Video

```javascript
// Browser Console
const video = document.querySelector('video');
const canvas = document.querySelector('canvas');

console.log('Video dimensions:', video.videoWidth, video.videoHeight);
console.log('Canvas dimensions:', canvas.width, canvas.height);
console.log('Video playing:', video.paused === false);
console.log('Video readyState:', video.readyState); // Should be 4
```

**Expected**:
- Video readyState: 4
- Canvas dimensions: 640x480 (same as video)
- Video playing: true

---

## 🛠️ FIXES FOR COMMON ISSUES

### Issue 1: "WebSocket Connection Failed"
```
❌ Connection failed - check if backend is running
```

**Solution**:
```bash
# Terminal 1: Start Backend
cd vision_safe_ultima_backend_v2.0
python main.py

# Should show:
# Starting Vision Safe Ultima Backend...
# 🌐 Server: 0.0.0.0:8000
# ✅ Uvicorn running on http://0.0.0.0:8000
```

---

### Issue 2: "No Detections / Confidence = 0"
```
Confidence: 0%
Risk: LOW
Detections: []
```

**Checklist**:
1. ✅ Backend running?
   ```bash
   curl http://localhost:8000/health
   ```

2. ✅ Models present?
   ```bash
   ls -la vision_safe_ultima_backend_v2.0/models/
   ```

3. ✅ Camera/Video selected?
   - Click a camera card
   - Select "Webcam" or "File"

4. ✅ Video playing?
   ```javascript
   const video = document.querySelector('video');
   console.log('Playing:', !video.paused);
   ```

5. ✅ Check backend logs for errors:
   ```
   Frame 0: Processing error - ...
   Frame 0: Failed to decode image data
   ```

---

### Issue 3: "Models Not Found"
```
❌ Safe model not found: /path/to/models/safe_detector.pt
```

**Solution**:
```bash
cd vision_safe_ultima_backend_v2.0
# Download or create test models
python -m pip install torch ultralytics
# Models will auto-download on first inference
```

---

### Issue 4: "CUDA Out of Memory"
```
❌ RuntimeError: CUDA out of memory
```

**Solution**:
```bash
# Force CPU mode
cd vision_safe_ultima_backend_v2.0
# Edit .env:
ML_DEVICE=cpu

# Restart backend
python main.py
```

---

### Issue 5: "Bounding Boxes Not Showing"
Canvas exists but no boxes drawn

**Check**:
```javascript
// Browser Console
const canvas = document.querySelector('canvas');
console.log('Canvas context:', canvas.getContext('2d'));
console.log('Canvas visible:', canvas.offsetParent !== null);

// Check if drawing
setInterval(() => {
  console.log('Canvas data:', canvas.getContext('2d').getImageData(0, 0, 10, 10));
}, 100);
```

**Fix**: Ensure canvas has detections:
1. Backend must send detections
2. Frontend must receive via WebSocket
3. Canvas must draw them

Check browser console for detection data being received.

---

## 📊 REAL-TIME STATS AGGREGATION

### Active Cameras
```
Shows: 1/4
Meaning: 1 camera connected and active (streaming)
```

**What counts as "active"**:
- WebSocket connected ✅
- Video playing ✅
- Status: "active" (not connecting/offline)

---

### Current Risk
```
Priority: CRITICAL > HIGH > LOW
```

**Logic**:
```javascript
if (any camera has CRITICAL) → CRITICAL
else if (any camera has HIGH) → HIGH
else → LOW
```

**Example**:
- Cam 1: LOW
- Cam 2: HIGH
- Cam 3: LOW
- Cam 4: CRITICAL
→ Display: **CRITICAL** ✅

---

### System Confidence
```
Shows: 42.5%
Meaning: Average of all camera confidence scores
```

**Calculation**:
```
(Cam1_score + Cam2_score + Cam3_score + Cam4_score) / 4
= (0.1 + 0.5 + 0.2 + 0.3) / 4
= 0.275 = 27.5%
```

---

## 🚀 VERIFICATION STEPS

### 1. Start Fresh
```bash
# Kill existing processes
pkill -f "python main.py"
pkill -f "npm run dev"

# Terminal 1: Backend
cd vision_safe_ultima_backend_v2.0
python main.py

# Terminal 2: Frontend
cd vision_safe_ultima_webapp_v2.0
npm run dev
```

### 2. Open Dashboard
```
http://localhost:5173/dashboard/live-monitor
```

### 3. Check Stats
- Active Cameras: Should show 0/4 initially
- Current Risk: Should show LOW
- System Confidence: Should show 0%

### 4. Connect Camera
- Click any camera card
- Select "Webcam"
- Allow camera permission
- Wait for WebSocket connection (should see green "Live" badge)

### 5. Verify Detection
- Backend console: Should show `Processing frame X`
- Frontend console: Should show `[CAM-1] Risk: ...`
- Canvas: Should draw bounding boxes around people/objects
- Stats: Should update in real-time

---

## 📝 BACKEND LOG ANALYSIS

### Good Logs (Everything Working)
```
✅ Configuration validation passed
✅ Device: cuda
✅ ML Service initialized successfully
✅ Client connected to WebSocket
📺 Processing frame 0, size: 123456 bytes
Frame 0: Safe=1, Unsafe=0, Risk=LOW, Inference=45.2ms
```

### Bad Logs (Problems)
```
❌ ML SERVICE FAILED TO INITIALIZE!
→ Models not found or load error

❌ CONFIG ERROR: Safe model not found
→ Missing models/safe_detector.pt

Frame 0: Failed to decode image data
→ Invalid frame sent from frontend

Frame 0: Processing error
→ Model inference failed
```

---

## 🔧 FIXES APPLIED IN v2.0

### VideoInput.tsx Updates
✅ Canvas dimensions match video (640x480)  
✅ Frame sent to backend with proper encoding  
✅ Detections rendered with bounding boxes  
✅ Colors: Green=Safe, Red=Unsafe  
✅ Labels show class and confidence  

### LiveMonitor.tsx
✅ Aggregates stats from all 4 cameras  
✅ "Active Cameras" counts connected streams  
✅ "Current Risk" shows highest priority (CRITICAL > HIGH > LOW)  
✅ "System Confidence" shows average score  
✅ Real-time updates  

### Backend (main.py)
✅ WebSocket receives frames  
✅ Sends detections in correct JSON format  
✅ Returns risk level for each frame  
✅ Proper error handling  

---

## ✅ SUCCESS INDICATORS

When everything works:
```
1. ✅ Browser console shows [CAM-1] WebSocket Connected
2. ✅ Backend logs show Frame X processing
3. ✅ Canvas shows bounding boxes
4. ✅ Active Cameras shows 1/4
5. ✅ Current Risk shows detected level
6. ✅ System Confidence shows score > 0
7. ✅ Stats update in real-time
```

---

## 📞 QUICK TEST

### Test Backend
```bash
python -c "
from app.services.ml_service import ml_service
print('ML Service Ready:', ml_service.is_ready())
"
```

### Test Frontend WebSocket
```javascript
// Browser Console
fetch('http://localhost:8000/health').then(r => r.json()).then(console.log)
```

### Full System Test
```javascript
// Browser Console - Run on http://localhost:5173/dashboard/live-monitor
document.querySelectorAll('video').length  // Should show camera count
document.querySelectorAll('canvas').length // Should match video count
```

---

**Status**: All fixes applied ✅  
**Next**: Test with actual camera/video  
**Expected**: Full detection pipeline working  

---

Generated: February 11, 2026

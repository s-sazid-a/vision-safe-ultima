# Vision Safe Ultima v2.0

**Real-time AI-powered Safety Monitoring System**

A production-ready web application for real-time safety monitoring using computer vision and machine learning. Detects hazardous situations, unauthorized access, and dangerous objects in live video feeds.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (optional)

### Local Development

#### Backend Setup
```bash
cd vision_safe_ultima_backend_v2.0

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Run server
python main.py
# Or with uvicorn reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
Health check: `http://localhost:8000/health`

#### Frontend Setup
```bash
cd vision_safe_ultima_webapp_v2.0

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Docker Deployment
```bash
# Build and run everything
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop everything
docker-compose down
```

Backend: `http://localhost:8000`
Frontend: `http://localhost`

---

## 📋 Configuration

### Environment Variables

#### Backend (.env)
```
API_HOST=0.0.0.0
API_PORT=8000
DEBUG_MODE=false
LOG_LEVEL=INFO

# ML Model settings
ML_DEVICE=auto              # auto, cuda, or cpu
ML_CONF_THRESHOLD=0.5       # 0.0-1.0
ML_IOU_THRESHOLD=0.45       # 0.0-1.0
ML_ENABLE_TEMPORAL_SMOOTHING=true
ML_SMOOTHING_WINDOW=5

# URLs
FRONTEND_URL=http://localhost:5173
FRONTEND_PROD_URL=https://yourdomain.com

# Supabase
SUPABASE_URL=your_url
SUPABASE_KEY=your_key

# Performance
FRAME_SKIP=1                # Process every Nth frame
MAX_FRAME_SIZE=640          # Resize larger frames
WEBSOCKET_TIMEOUT=30        # Seconds
```

#### Frontend (.env)
```
VITE_WS_URL=ws://localhost:8000/ws/stream
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## 🏗️ Architecture

### Backend Stack
- **FastAPI** - Modern web framework
- **YOLOv8** - Real-time object detection models
- **OpenCV** - Image processing
- **PyTorch** - Deep learning framework
- **WebSocket** - Real-time communication

### Frontend Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend database

### ML Models
- **safe_detector.pt** - Detects safe activities (walking, sitting, standing, yoga)
- **unsafe_detector.pt** - Detects hazards (fire, vehicles)

---

## 🎯 Features

### Core Features
✅ Real-time video stream processing  
✅ Multi-camera support  
✅ AI-powered object detection  
✅ Risk assessment and alerting  
✅ Detection history logging  
✅ User authentication  

### Risk Levels
- **LOW** - No hazards detected
- **HIGH** - Unauthorized access or dangerous objects
- **CRITICAL** - Immediate danger (fire, etc.)

### Detectable Objects

**Safe Activities:**
- Person walking
- Person sitting
- Person standing
- Person in yoga pose

**Unsafe Objects:**
- Fire (CRITICAL)
- Vehicles (HIGH)
- Motorbikes (HIGH)

---

## 🔧 API Endpoints

### Health Check
```
GET /health
```
Returns system status and ML service readiness.

### WebSocket Stream
```
ws://localhost:8000/ws/stream
```
Real-time video frame processing. Send JPEG-encoded frames, receive detection results.

**Response Format:**
```json
{
  "safe": {
    "detections": [
      {
        "label": "person_walking",
        "confidence": 0.95,
        "bbox": [x1, y1, x2, y2]
      }
    ]
  },
  "unsafe": {
    "detections": [...]
  },
  "risk": {
    "level": "LOW",
    "score": 0.1,
    "factors": []
  },
  "inference_time_ms": 45.3
}
```

---

## 🚀 Performance Optimization

### Hardware Acceleration
- **CUDA/GPU Support**: Automatically detected and enabled (30-50x faster)
- **CPU Fallback**: Graceful degradation for environments without GPU

### Frame Optimization
- Frame skipping: Process every Nth frame
- Dynamic resizing: Resize large frames for faster processing
- Temporal smoothing: Reduce flickering and false positives

### Benchmarks
- **GPU (NVIDIA T4)**: ~15-20 FPS @ 640x480
- **CPU (4-core)**: ~1-3 FPS @ 640x480

**Optimization Tips:**
```env
# For faster inference
ML_DEVICE=cuda              # Use GPU if available
FRAME_SKIP=2                # Process every 2nd frame
MAX_FRAME_SIZE=416          # Smaller input size

# For better accuracy
ML_CONF_THRESHOLD=0.5       # Stricter threshold
ML_ENABLE_TEMPORAL_SMOOTHING=true
ML_SMOOTHING_WINDOW=5       # Larger window
```

---

## 🔒 Security

### Implemented
✅ CORS whitelist (only configured origins)  
✅ Input validation (Pydantic models)  
✅ Secure WebSocket communication  
✅ Environment variable protection  
✅ Supabase authentication  

### Production Recommendations
- Use HTTPS/WSS in production
- Restrict CORS to your domain only
- Enable database row-level security
- Use firewall rules for API access
- Implement rate limiting
- Add request signing for critical endpoints

---

## 🐛 Troubleshooting

### Issue: Backend won't start
```bash
# Check Python version
python --version  # Should be 3.10+

# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"

# Check models exist
ls vision_safe_ultima_backend_v2.0/models/

# View detailed logs
DEBUG_MODE=true python main.py
```

### Issue: Frontend can't connect to backend
```bash
# Check backend is running
curl http://localhost:8000/health

# Check WebSocket URL in frontend .env
cat vision_safe_ultima_webapp_v2.0/.env | grep VITE_WS_URL

# Check CORS settings
curl -H "Origin: http://localhost:5173" http://localhost:8000/
```

### Issue: Slow inference
```bash
# Check if GPU is being used
python -c "import torch; print(f'GPU Available: {torch.cuda.is_available()}')"

# Try frame skipping
FRAME_SKIP=2 python main.py

# Check input frame size
curl http://localhost:8000/config  # Requires DEBUG_MODE=true
```

---

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:5173/
```

### Logs
```bash
# Backend logs (development)
tail -f backend.log

# Frontend browser console
F12 > Console tab

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🔄 Development Workflow

### Adding New Detection Classes
1. Train YOLOv8 model with new classes
2. Replace model files in `models/`
3. Update class names in `config.py`
4. Restart backend

### Updating Frontend UI
```bash
cd vision_safe_ultima_webapp_v2.0
npm run build
# Test at http://localhost:5173
```

### Database Schema Changes
Update in Supabase console, then sync `AuthContext.tsx` types.

---

## 📦 Dependencies

### Backend
- fastapi==0.109.2
- ultralytics==8.0.228
- torch==2.0.1
- opencv-python-headless==4.8.1.78
- numpy==1.24.3
- pydantic==2.4.2

### Frontend
- react==19.2.0
- typescript==5.9.3
- vite==7.2.4
- tailwindcss==3.4.17

See `requirements.txt` and `package.json` for full dependencies.

---

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run tests and linting
4. Submit pull request

---

## 📝 License

Vision Safe Ultima v2.0 - All Rights Reserved

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review logs with DEBUG_MODE enabled
3. Check GitHub issues
4. Contact development team

---

**Last Updated**: February 11, 2026  
**Version**: 2.0.0  
**Status**: Production Ready ✅

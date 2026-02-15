# DEPLOYMENT & TESTING GUIDE

## 🚀 Production Deployment

### Pre-Deployment Checklist
- [ ] All environment variables configured
- [ ] Models downloaded and in correct location
- [ ] Database migrations run
- [ ] Secrets stored securely (not in git)
- [ ] CORS configured for production domain
- [ ] SSL/HTTPS certificates obtained
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented

### Backend Deployment (Docker)
```bash
# Build image
docker build -f Dockerfile.backend -t vision-safe-backend:2.0 .

# Run container
docker run -d \
  --name vision-safe-backend \
  -p 8000:8000 \
  --env-file .env.prod \
  --restart unless-stopped \
  -v /path/to/models:/app/models:ro \
  vision-safe-backend:2.0

# Health check
curl http://localhost:8000/health
```

### Frontend Deployment (Docker)
```bash
# Build image
docker build -f Dockerfile.frontend -t vision-safe-frontend:2.0 .

# Run container
docker run -d \
  --name vision-safe-frontend \
  -p 80:80 \
  --restart unless-stopped \
  vision-safe-frontend:2.0
```

### Full Stack Deployment (Docker Compose)
```bash
# Create production env files
cp .env.example .env.prod
# Edit .env.prod with production values

# Deploy
docker-compose -f docker-compose.yml up -d

# Check status
docker-compose ps
docker-compose logs -f

# Shutdown
docker-compose down
```

### Kubernetes Deployment (Optional)
```bash
# Create namespace
kubectl create namespace vision-safe

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml -n vision-safe

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml -n vision-safe

# Check status
kubectl get pods -n vision-safe
```

---

## 🧪 Testing

### Unit Tests

#### Backend
```bash
# Install pytest
pip install pytest pytest-cov

# Run tests
pytest tests/ -v

# Coverage report
pytest tests/ --cov=app --cov-report=html
```

#### Frontend
```bash
# Install testing dependencies
npm install --save-dev vitest @testing-library/react

# Run tests
npm test

# Coverage
npm run test:coverage
```

### Integration Tests
```bash
# Backend integration tests
pytest tests/integration/ -v -s

# Frontend integration tests
npm run test:integration
```

### Performance Testing
```bash
# Load test the backend
pip install locust

# Create locustfile.py
# Run load test
locust -f locustfile.py --host=http://localhost:8000
```

### Manual Testing Checklist

#### Backend
- [ ] Health endpoint responds
- [ ] WebSocket accepts connections
- [ ] Frames are processed
- [ ] Risk detection works
- [ ] Error handling works
- [ ] CORS is enforced

#### Frontend
- [ ] App loads
- [ ] Camera/webcam works
- [ ] WebSocket connects
- [ ] Detections render
- [ ] Risk level displays
- [ ] Database logging works

---

## 📊 Monitoring & Logging

### Application Metrics
```bash
# Backend metrics
curl http://localhost:8000/metrics

# Export Prometheus metrics
curl http://localhost:8000/metrics?format=prometheus
```

### Log Aggregation
```bash
# Centralized logging with ELK stack
docker-compose -f docker-compose.logging.yml up -d
# Access Kibana: http://localhost:5601
```

### Performance Monitoring
```bash
# Monitor GPU usage
nvidia-smi -l 1

# Monitor system resources
htop

# Monitor Python processes
ps aux | grep python
```

---

## 🔍 Debugging

### Backend Debugging
```bash
# Enable debug mode
DEBUG_MODE=true python main.py

# Check configuration
curl http://localhost:8000/config

# View detailed logs
tail -f backend.log

# Attach debugger
python -m pdb main.py
```

### Frontend Debugging
```bash
# Browser DevTools (F12)
# Check Console for errors
# Check Network for requests

# Vue Devtools browser extension
# React DevTools browser extension

# Build without minification
npm run dev
```

### Database Debugging
```bash
# Connect to Supabase CLI
supabase status

# View real-time logs
supabase functions list

# Run migrations
supabase db pull
supabase db push
```

---

## 🔐 Security Testing

### CORS Testing
```bash
curl -H "Origin: http://unauthorized.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:8000/ws/stream -v
# Should return 403
```

### Input Validation
```bash
# Test invalid frame data
curl -X POST http://localhost:8000/ws/stream \
     -H "Content-Type: application/octet-stream" \
     -d "invalid data"

# Test malicious payloads
# Should return 422
```

### API Security
```bash
# Test rate limiting
for i in {1..1000}; do curl http://localhost:8000/health; done

# Test authentication
curl http://localhost:8000/protected -H "Authorization: Bearer invalid_token"
# Should return 401
```

---

## 📝 Performance Benchmarking

### Inference Speed
```python
import time
import cv2
from app.services.vision_safe_inference import VisionSafeInference

inference = VisionSafeInference(
    safe_model_path="models/safe_detector.pt",
    unsafe_model_path="models/unsafe_detector.pt",
    device='cuda'
)

# Load test image
image = cv2.imread('test.jpg')

# Benchmark
start = time.time()
for _ in range(100):
    result = inference.predict(image)
end = time.time()

avg_time = (end - start) / 100
print(f"Avg inference time: {avg_time*1000:.2f}ms")
print(f"FPS: {1/avg_time:.2f}")
```

### Memory Usage
```bash
# Monitor memory during inference
watch -n 1 nvidia-smi

# Python memory profiling
pip install memory-profiler
python -m memory_profiler main.py
```

---

## 📋 Health Checks

### Backend
```bash
# Endpoint check
curl http://localhost:8000/

# Health endpoint
curl http://localhost:8000/health

# Configuration check
curl http://localhost:8000/config
```

### Frontend
```bash
# Page load
curl -I http://localhost:5173/

# Bundle size
npm run build
du -sh dist/
```

### Database
```bash
# Connection test
python -c "from services.database import dbService; print(dbService.healthCheck())"

# Query test
SELECT COUNT(*) FROM detection_logs;
```

---

## 🔄 Troubleshooting Commands

```bash
# View recent logs
docker-compose logs --tail=100 backend

# Enter container shell
docker-compose exec backend /bin/bash

# Check environment variables
docker-compose exec backend env | grep ML

# Restart service
docker-compose restart backend

# Full system restart
docker-compose down
docker-compose up -d

# Clear cache
docker system prune -a

# View resource usage
docker stats
```

---

## 📚 Reference

- **Docker Docs**: https://docs.docker.com/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **YOLO Docs**: https://docs.ultralytics.com/
- **Supabase Docs**: https://supabase.com/docs

---

**Last Updated**: February 11, 2026

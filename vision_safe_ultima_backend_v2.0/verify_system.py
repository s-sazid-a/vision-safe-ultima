#!/usr/bin/env python3
"""
Vision Safe Ultima - System Verification & Diagnostics
Checks all components and generates a detailed status report
"""
import os
import sys
from pathlib import Path

def check_backend_structure():
    """Check if backend files exist"""
    print("\n📁 BACKEND FILE STRUCTURE")
    print("-" * 50)
    
    backend_dir = Path("vision_safe_ultima_backend_v2.0")
    required_files = {
        "main.py": "FastAPI entry point",
        "config.py": "Configuration management",
        "requirements.txt": "Python dependencies",
        ".env.example": "Environment template",
        "app/models.py": "Pydantic models",
        "app/services/ml_service.py": "ML inference service",
        "app/services/risk_engine.py": "Risk assessment",
        "app/services/vision_safe_inference.py": "YOLO inference",
        "models/safe_detector.pt": "Safe model (YOLOv8)",
        "models/unsafe_detector.pt": "Unsafe model (YOLOv8)",
    }
    
    all_exist = True
    for file_path, description in required_files.items():
        full_path = backend_dir / file_path
        exists = full_path.exists()
        status = "✅" if exists else "❌"
        print(f"{status} {file_path:40} {description}")
        if not exists:
            all_exist = False
    
    return all_exist

def check_frontend_structure():
    """Check if frontend files exist"""
    print("\n🌐 FRONTEND FILE STRUCTURE")
    print("-" * 50)
    
    frontend_dir = Path("vision_safe_ultima_webapp_v2.0")
    required_files = {
        "package.json": "Dependencies & scripts",
        "src/App.tsx": "Main app component",
        "src/pages/Dashboard.tsx": "Dashboard page",
        "src/components/dashboard/VideoInput.tsx": "Video component",
        "src/components/dashboard/LiveMonitor.tsx": "Live monitor component",
        ".env.example": "Environment template",
    }
    
    all_exist = True
    for file_path, description in required_files.items():
        full_path = frontend_dir / file_path
        exists = full_path.exists()
        status = "✅" if exists else "❌"
        print(f"{status} {file_path:40} {description}")
        if not exists:
            all_exist = False
    
    return all_exist

def check_environment_files():
    """Check for .env files"""
    print("\n🔐 ENVIRONMENT CONFIGURATION")
    print("-" * 50)
    
    env_files = {
        "vision_safe_ultima_backend_v2.0/.env": "Backend config (sensitive)",
        "vision_safe_ultima_backend_v2.0/.env.example": "Backend template",
        "vision_safe_ultima_webapp_v2.0/.env": "Frontend config (sensitive)",
        "vision_safe_ultima_webapp_v2.0/.env.example": "Frontend template",
    }
    
    for env_file, description in env_files.items():
        exists = Path(env_file).exists()
        status = "✅" if exists else "❌"
        print(f"{status} {env_file:50} {description}")

def check_python_packages():
    """Check if required Python packages are installed"""
    print("\n📦 PYTHON DEPENDENCIES")
    print("-" * 50)
    
    required_packages = {
        "fastapi": "Web framework",
        "uvicorn": "ASGI server",
        "torch": "PyTorch (ML)",
        "cv2": "OpenCV (image processing)",
        "numpy": "NumPy (arrays)",
        "pydantic": "Data validation",
        "python-dotenv": "Environment variables",
    }
    
    all_installed = True
    for package, description in required_packages.items():
        try:
            __import__(package)
            print(f"✅ {package:20} {description}")
        except ImportError:
            print(f"❌ {package:20} {description} [NOT INSTALLED]")
            all_installed = False
    
    return all_installed

def check_node_packages():
    """Check if node_modules exists"""
    print("\n📦 NODE.JS DEPENDENCIES")
    print("-" * 50)
    
    node_modules = Path("vision_safe_ultima_webapp_v2.0/node_modules")
    if node_modules.exists():
        print("✅ node_modules             Frontend dependencies installed")
        return True
    else:
        print("❌ node_modules             Frontend dependencies NOT installed")
        print("   Run: cd vision_safe_ultima_webapp_v2.0 && npm install")
        return False

def check_models():
    """Check if ML models exist"""
    print("\n🤖 ML MODELS")
    print("-" * 50)
    
    models_dir = Path("vision_safe_ultima_backend_v2.0/models")
    required_models = {
        "safe_detector.pt": "Person activity detection",
        "unsafe_detector.pt": "Hazard detection",
    }
    
    all_exist = True
    for model_file, description in required_models.items():
        model_path = models_dir / model_file
        if model_path.exists():
            size_mb = model_path.stat().st_size / (1024 * 1024)
            print(f"✅ {model_file:30} {description} ({size_mb:.1f}MB)")
        else:
            print(f"❌ {model_file:30} {description} [MISSING]")
            all_exist = False
    
    return all_exist

def check_ports():
    """Check if ports are available"""
    print("\n🔌 PORT AVAILABILITY")
    print("-" * 50)
    
    import socket
    ports = {
        8000: "Backend API",
        5173: "Frontend (Vite)",
        5000: "Alternative backend",
    }
    
    available_ports = []
    for port, service in ports.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        
        if result != 0:
            print(f"✅ Port {port:5} {service:25} [Available]")
            available_ports.append(port)
        else:
            print(f"⚠️  Port {port:5} {service:25} [In Use]")
    
    return 8000 in available_ports

def generate_startup_command():
    """Generate startup commands"""
    print("\n🚀 STARTUP COMMANDS")
    print("-" * 50)
    
    if sys.platform == "win32":
        print("Windows (PowerShell/CMD):")
        print("\n# Terminal 1: Backend")
        print("cd vision_safe_ultima_backend_v2.0")
        print("python main.py")
        print("\n# Terminal 2: Frontend")
        print("cd vision_safe_ultima_webapp_v2.0")
        print("npm run dev")
        print("\nOr use: .\\start_development.bat")
    else:
        print("Linux/Mac (Bash/Zsh):")
        print("\n# Terminal 1: Backend")
        print("cd vision_safe_ultima_backend_v2.0")
        print("python main.py")
        print("\n# Terminal 2: Frontend")
        print("cd vision_safe_ultima_webapp_v2.0")
        print("npm run dev")

def generate_access_urls():
    """Generate access URLs"""
    print("\n🌐 ACCESS URLS")
    print("-" * 50)
    
    print("Frontend: http://localhost:5173")
    print("Dashboard: http://localhost:5173/dashboard/live-monitor")
    print("Backend API: http://localhost:8000")
    print("Health Check: http://localhost:8000/health")
    print("API Docs: http://localhost:8000/docs")
    print("ReDoc: http://localhost:8000/redoc")

def main():
    """Run all checks"""
    print("\n" + "="*60)
    print("🔍 VISION SAFE ULTIMA v2.0 - SYSTEM VERIFICATION")
    print("="*60)
    
    results = {
        "Backend Structure": check_backend_structure(),
        "Frontend Structure": check_frontend_structure(),
        "Python Packages": check_python_packages(),
        "Node Packages": check_node_packages(),
        "ML Models": check_models(),
        "Port Availability": check_ports(),
    }
    
    check_environment_files()
    generate_startup_command()
    generate_access_urls()
    
    # Summary
    print("\n" + "="*60)
    print("📊 VERIFICATION SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for check_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {check_name}")
    
    print(f"\nResult: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 SYSTEM READY - Start with: python main.py (backend)")
        print("   Then: npm run dev (frontend)")
        return 0
    else:
        print("\n⚠️  Some checks failed - See above for details")
        return 1

if __name__ == "__main__":
    sys.exit(main())

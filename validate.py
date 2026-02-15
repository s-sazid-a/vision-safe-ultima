#!/usr/bin/env python3
"""
Vision Safe Ultima - Project Validation Script
Checks all configurations, dependencies, and files for correctness
"""
import os
import sys
from pathlib import Path
import subprocess
import json

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_section(title):
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"{title}")
    print(f"{'='*60}{Colors.RESET}")

def check_mark(condition, message):
    status = f"{Colors.GREEN}✓{Colors.RESET}" if condition else f"{Colors.RED}✗{Colors.RESET}"
    print(f"{status} {message}")
    return condition

def warning(message):
    print(f"{Colors.YELLOW}⚠{Colors.RESET} {message}")

def error(message):
    print(f"{Colors.RED}✗{Colors.RESET} {message}")

def validate_python_environment():
    """Check Python version and dependencies"""
    print_section("Python Environment")
    
    # Check Python version
    version = sys.version_info
    python_ok = check_mark(
        version.major == 3 and version.minor >= 10,
        f"Python version: {version.major}.{version.minor}.{version.micro}"
    )
    
    # Check virtual environment
    in_venv = check_mark(
        hasattr(sys, 'real_prefix') or hasattr(sys, 'base_prefix') != sys.prefix,
        "Running in virtual environment"
    )
    
    return python_ok and in_venv

def validate_backend_structure():
    """Check backend files and structure"""
    print_section("Backend Structure")
    
    backend_path = Path("vision_safe_ultima_backend_v2.0")
    files_ok = True
    
    required_files = [
        "main.py",
        "config.py",
        "requirements.txt",
        ".env",
        ".env.example",
        "app/models.py",
        "app/services/ml_service.py",
        "app/services/vision_safe_inference.py",
        "app/services/risk_engine.py",
    ]
    
    for file in required_files:
        file_path = backend_path / file
        exists = file_path.exists()
        check_mark(exists, f"{file}")
        files_ok = files_ok and exists
    
    # Check models
    models_path = backend_path / "models"
    check_mark(models_path.exists(), "Models directory exists")
    
    if models_path.exists():
        safe_model = check_mark(
            (models_path / "safe_detector.pt").exists(),
            "safe_detector.pt exists"
        )
        unsafe_model = check_mark(
            (models_path / "unsafe_detector.pt").exists(),
            "unsafe_detector.pt exists"
        )
        files_ok = files_ok and safe_model and unsafe_model
    
    return files_ok

def validate_frontend_structure():
    """Check frontend files and structure"""
    print_section("Frontend Structure")
    
    frontend_path = Path("vision_safe_ultima_webapp_v2.0")
    files_ok = True
    
    required_files = [
        "package.json",
        "vite.config.ts",
        "tsconfig.json",
        ".env",
        ".env.example",
        "src/App.tsx",
        "src/main.tsx",
        "src/components/dashboard/VideoInput.tsx",
        "src/components/layout/ErrorBoundary.tsx",
        "src/services/database.ts",
    ]
    
    for file in required_files:
        file_path = frontend_path / file
        exists = file_path.exists()
        check_mark(exists, f"{file}")
        files_ok = files_ok and exists
    
    return files_ok

def validate_configuration():
    """Check configuration files"""
    print_section("Configuration Files")
    
    config_ok = True
    
    # Backend config
    backend_config = check_mark(
        Path("vision_safe_ultima_backend_v2.0/config.py").exists(),
        "Backend config.py exists"
    )
    config_ok = config_ok and backend_config
    
    # Environment files
    backend_env = check_mark(
        Path("vision_safe_ultima_backend_v2.0/.env").exists(),
        "Backend .env exists"
    )
    backend_env_example = check_mark(
        Path("vision_safe_ultima_backend_v2.0/.env.example").exists(),
        "Backend .env.example exists"
    )
    
    frontend_env = check_mark(
        Path("vision_safe_ultima_webapp_v2.0/.env").exists(),
        "Frontend .env exists"
    )
    frontend_env_example = check_mark(
        Path("vision_safe_ultima_webapp_v2.0/.env.example").exists(),
        "Frontend .env.example exists"
    )
    
    # Docker files
    docker_files = check_mark(
        Path("docker-compose.yml").exists() and
        Path("Dockerfile.backend").exists() and
        Path("Dockerfile.frontend").exists(),
        "Docker files exist"
    )
    
    config_ok = config_ok and backend_env and backend_env_example and frontend_env and frontend_env_example and docker_files
    
    return config_ok

def validate_dependencies():
    """Check Python and Node dependencies"""
    print_section("Dependencies")
    
    deps_ok = True
    
    # Check required Python packages
    required_python = [
        "fastapi",
        "uvicorn",
        "torch",
        "cv2",
        "ultralytics",
        "pydantic",
    ]
    
    for package in required_python:
        try:
            __import__(package)
            check_mark(True, f"Python package: {package}")
        except ImportError:
            check_mark(False, f"Python package: {package} (not installed)")
            deps_ok = False
    
    # Check Node packages installation
    frontend_path = Path("vision_safe_ultima_webapp_v2.0")
    node_modules_ok = check_mark(
        (frontend_path / "node_modules").exists(),
        "Node packages installed"
    )
    deps_ok = deps_ok and node_modules_ok
    
    return deps_ok

def validate_docker():
    """Check Docker installation"""
    print_section("Docker Setup")
    
    docker_ok = True
    
    # Check Docker
    try:
        subprocess.run(["docker", "--version"], capture_output=True, check=True)
        check_mark(True, "Docker installed")
    except FileNotFoundError:
        check_mark(False, "Docker not installed")
        docker_ok = False
    except subprocess.CalledProcessError:
        check_mark(False, "Docker not working")
        docker_ok = False
    
    # Check Docker Compose
    try:
        subprocess.run(["docker-compose", "--version"], capture_output=True, check=True)
        check_mark(True, "Docker Compose installed")
    except FileNotFoundError:
        check_mark(False, "Docker Compose not installed")
        docker_ok = False
    except subprocess.CalledProcessError:
        check_mark(False, "Docker Compose not working")
        docker_ok = False
    
    return docker_ok

def validate_code_quality():
    """Check for common code issues"""
    print_section("Code Quality Checks")
    
    quality_ok = True
    
    # Check for hardcoded URLs
    main_py = Path("vision_safe_ultima_backend_v2.0/main.py").read_text()
    hardcoded_urls = check_mark(
        "ws://localhost" not in main_py,
        "No hardcoded WebSocket URLs in backend"
    )
    quality_ok = quality_ok and hardcoded_urls
    
    # Check imports in main.py
    has_numpy = check_mark("import numpy" in main_py, "NumPy imported in main.py")
    has_cv2 = check_mark("import cv2" in main_py, "OpenCV imported in main.py")
    quality_ok = quality_ok and has_numpy and has_cv2
    
    # Check CORS configuration
    cors_restricted = check_mark(
        'allow_origins=[' in main_py or 'config.ALLOWED_ORIGINS' in main_py,
        "CORS has restricted origin list"
    )
    quality_ok = quality_ok and cors_restricted
    
    return quality_ok

def main():
    """Run all validations"""
    print(f"\n{Colors.BLUE}")
    print("Vision Safe Ultima v2.0 - Project Validation")
    print(f"{Colors.RESET}")
    
    all_ok = True
    
    # Run validations
    all_ok = validate_python_environment() and all_ok
    all_ok = validate_backend_structure() and all_ok
    all_ok = validate_frontend_structure() and all_ok
    all_ok = validate_configuration() and all_ok
    all_ok = validate_dependencies() and all_ok
    all_ok = validate_docker() and all_ok
    all_ok = validate_code_quality() and all_ok
    
    # Summary
    print_section("Validation Summary")
    
    if all_ok:
        print(f"{Colors.GREEN}✓ All validations passed!{Colors.RESET}")
        print(f"\n{Colors.GREEN}Project is ready to run.{Colors.RESET}")
        print("\nNext steps:")
        print("  Backend:  cd vision_safe_ultima_backend_v2.0 && python main.py")
        print("  Frontend: cd vision_safe_ultima_webapp_v2.0 && npm run dev")
        print("  Or Docker: docker-compose up -d")
        return 0
    else:
        print(f"{Colors.RED}✗ Some validations failed.{Colors.RESET}")
        print("\nPlease fix the issues above and try again.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

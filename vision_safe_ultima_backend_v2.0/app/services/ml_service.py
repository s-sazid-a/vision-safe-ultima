"""
Vision Safe Ultima - ML Service
Handles model initialization and frame processing
"""
import cv2
import numpy as np
import logging
import traceback
from pathlib import Path
import time

import config
from app.services.vision_safe_inference import VisionSafeInference
from app.services.risk_engine import RiskEngine

logger = logging.getLogger(__name__)


class MLService:
    """
    ML Service for Vision Safe Ultima.
    Manages inference models and frame processing with error handling.
    """
    
    def __init__(self):
        """Initialize ML service with error handling"""
        self.inference_service = None
        self.risk_engine = RiskEngine()
        self.initialization_error = None
        
        try:
            logger.info("🚀 Initializing ML Service...")
            logger.info(f"   Safe model: {config.SAFE_MODEL_PATH} (49.6 MB, mAP50=0.893)")
            logger.info(f"   Unsafe model: {config.UNSAFE_MODEL_PATH} (148.46 MB - LARGEST hazard detector)")
            logger.info(f"   Device: {config.ML_DEVICE}")
            logger.info(f"   Confidence threshold: {config.ML_CONF_THRESHOLD}")
            logger.info("   ⭐ Using LARGEST/BEST models for maximum accuracy")
            
            # Check if models exist
            if not config.SAFE_MODEL_PATH.exists():
                raise FileNotFoundError(f"Safe model not found: {config.SAFE_MODEL_PATH}")
            if not config.UNSAFE_MODEL_PATH.exists():
                raise FileNotFoundError(f"Unsafe model not found: {config.UNSAFE_MODEL_PATH}")
            
            # Initialize inference service
            self.inference_service = VisionSafeInference(
                safe_model_path=str(config.SAFE_MODEL_PATH),
                unsafe_model_path=str(config.UNSAFE_MODEL_PATH),
                device=config.ML_DEVICE,
                conf_threshold=config.ML_CONF_THRESHOLD,
                iou_threshold=config.ML_IOU_THRESHOLD,
                enable_temporal_smoothing=config.ML_ENABLE_TEMPORAL_SMOOTHING,
                smoothing_window=config.ML_SMOOTHING_WINDOW
            )
            
            logger.info("✅ ML Service initialized successfully!")
            
        except Exception as e:
            self.initialization_error = str(e)
            logger.error(f"❌ Failed to initialize ML Service: {e}")
            logger.error(f"Traceback:\n{traceback.format_exc()}")
            logger.warning("Frames will be processed without ML inference")
    
    def process_frame(self, frame: np.ndarray, frame_index: int = 0) -> dict:
        """
        Process a single frame through both models.
        
        Args:
            frame: BGR numpy array (from OpenCV)
            frame_index: Frame number for logging
            
        Returns:
            Dictionary with detections and risk assessment
        """
        # Validate frame
        if not isinstance(frame, np.ndarray):
            logger.error(f"Frame {frame_index}: Invalid frame type {type(frame)}")
            return self._empty_response("Invalid frame type")
        
        if frame.size == 0:
            logger.error(f"Frame {frame_index}: Empty frame")
            return self._empty_response("Empty frame")
        
        # If inference service not available, return empty results
        if self.inference_service is None:
            logger.warning(f"Frame {frame_index}: ML Service not available")
            return self._empty_response(self.initialization_error or "ML Service not initialized")
        
        try:
            start_time = time.perf_counter()
            
            # Run inference
            result = self.inference_service.predict(frame)
            
            # Convert to WebSocket format
            websocket_data = self.inference_service.to_websocket_format(result)
            
            # Calculate risk
            risk_data = self.risk_engine.evaluate(
                websocket_data["safe"],
                websocket_data["unsafe"]
            )
            
            # Add risk to response
            websocket_data["risk"] = risk_data
            
            # Log if detections found
            safe_count = len(result.safe_detections)
            unsafe_count = len(result.unsafe_detections)
            if safe_count > 0 or unsafe_count > 0:
                logger.debug(
                    f"Frame {frame_index}: SAFE={safe_count}, UNSAFE={unsafe_count}, "
                    f"Risk={risk_data['level']}, Inference={result.inference_time_ms:.1f}ms"
                )
            
            return websocket_data
            
        except Exception as e:
            logger.error(f"Frame {frame_index}: Processing error - {str(e)}")
            logger.debug(traceback.format_exc())
            return self._empty_response(f"Processing error: {str(e)[:50]}")
    
    def _empty_response(self, error_msg: str = None) -> dict:
        """Return empty response with optional error message"""
        response = {
            "safe": {"detections": []},
            "unsafe": {"detections": []},
            "risk": {"level": "LOW", "score": 0.0, "factors": []},
            "inference_time_ms": 0
        }
        if error_msg:
            response["error"] = error_msg
        return response
    
    def is_ready(self) -> bool:
        """Check if service is ready for inference"""
        return self.inference_service is not None


# Global service instance
ml_service = MLService()

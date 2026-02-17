"""
Vision Safe Ultima - Production Inference Service
Adapted from training pipeline for backend integration
"""
import cv2
import numpy as np
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import deque
import logging

logger = logging.getLogger(__name__)


@dataclass
class Detection:
    """Single detection result."""
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    class_name: str
    confidence: float
    class_id: int


@dataclass
class InferenceResult:
    """Complete inference result."""
    safe_detections: List[Detection]
    unsafe_detections: List[Detection]
    inference_time_ms: float
    image_size: Tuple[int, int]


class TemporalSmoother:
    """
    Implements temporal smoothing using moving average over detection history.
    Reduces flickering and false positives.
    """
    
    def __init__(self, window_size: int = 5, confidence_threshold: float = 0.3):
        """
        Args:
            window_size: Number of frames to average over
            confidence_threshold: Minimum average confidence to keep detection
        """
        self.window_size = window_size
        self.confidence_threshold = confidence_threshold
        self.safe_history = deque(maxlen=window_size)
        self.unsafe_history = deque(maxlen=window_size)
    
    def smooth(self, safe_detections: List[Detection], unsafe_detections: List[Detection]) -> Tuple[List[Detection], List[Detection]]:
        """
        Apply temporal smoothing to detections.
        
        Args:
            safe_detections: Current frame safe detections
            unsafe_detections: Current frame unsafe detections
            
        Returns:
            Tuple of (smoothed_safe, smoothed_unsafe)
        """
        # Add current detections to history
        self.safe_history.append(safe_detections)
        self.unsafe_history.append(unsafe_detections)
        
        # Smooth safe detections
        smoothed_safe = self._smooth_detections(self.safe_history)
        
        # Smooth unsafe detections
        smoothed_unsafe = self._smooth_detections(self.unsafe_history)
        
        return smoothed_safe, smoothed_unsafe
    
    def _smooth_detections(self, history: deque) -> List[Detection]:
        """
        Average detections across history window.
        """
        if not history:
            return []
        
        # Group detections by class
        class_detections = {}
        
        for frame_detections in history:
            for det in frame_detections:
                if det.class_name not in class_detections:
                    class_detections[det.class_name] = []
                class_detections[det.class_name].append(det)
        
        # Average confidence for each class
        smoothed = []
        for class_name, detections in class_detections.items():
            avg_confidence = sum(d.confidence for d in detections) / len(detections)
            
            # Only keep if average confidence above threshold
            if avg_confidence >= self.confidence_threshold:
                # Use most recent detection's bbox and class_id
                latest = detections[-1]
                smoothed.append(Detection(
                    bbox=latest.bbox,
                    class_name=class_name,
                    confidence=avg_confidence,
                    class_id=latest.class_id
                ))
        
        return smoothed
    
    def reset(self):
        """Clear history (call when switching video sources)."""
        self.safe_history.clear()
        self.unsafe_history.clear()


class VisionSafeInference:
    """
    Production inference service for Vision Safe Ultima.
    
    Loads both safe and unsafe detection models and provides
    unified inference interface with temporal smoothing.
    """
    
    SAFE_CLASSES = ['person_walking', 'person_sitting', 'person_standing', 'person_yoga']
    UNSAFE_CLASSES = ['fire', 'vehicle_car', 'vehicle_motorbike']
    
    def __init__(
        self,
        safe_model_path: str,
        unsafe_model_path: str,
        device: str = 'cuda',
        conf_threshold: float = 0.5,
        iou_threshold: float = 0.45,
        enable_temporal_smoothing: bool = True,
        smoothing_window: int = 5
    ):
        """
        Initialize the inference service.
        
        Args:
            safe_model_path: Path to safe activities detector model
            unsafe_model_path: Path to unsafe objects detector model
            device: Device to run inference on ('cuda' or 'cpu')
            conf_threshold: Confidence threshold for detections
            iou_threshold: IoU threshold for NMS
            enable_temporal_smoothing: Enable temporal smoothing
            smoothing_window: Window size for temporal smoothing
        """
        try:
            from ultralytics import YOLO
        except ImportError:
            raise ImportError("ultralytics package not installed. Run: pip install ultralytics")
        
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        
        # Reconstruct large model if split parts exist
        def reconstruct_if_split(model_path):
            path = Path(model_path)
            if not path.exists():
                # Check for parts
                parts = sorted(path.parent.glob(f"{path.name}.part*"))
                if parts:
                    logger.info(f"Reconstructing {model_path} from {len(parts)} parts...")
                    with open(path, 'wb') as outfile:
                        for part in parts:
                            with open(part, 'rb') as infile:
                                outfile.write(infile.read())
                    logger.info(f"Reconstruction complete: {path}")

        reconstruct_if_split(str(unsafe_model_path))
        reconstruct_if_split(str(safe_model_path)) # Just in case

        # Load models
        logger.info(f"Loading safe model from: {safe_model_path}")
        self.safe_model = YOLO(safe_model_path)
        
        logger.info(f"Loading unsafe model from: {unsafe_model_path}")
        self.unsafe_model = YOLO(unsafe_model_path)
        
        # Initialize temporal smoother
        self.enable_smoothing = enable_temporal_smoothing
        if enable_temporal_smoothing:
            self.smoother = TemporalSmoother(window_size=smoothing_window)
            logger.info(f"Temporal smoothing enabled (window={smoothing_window})")
        
        # Warmup (first inference is slow)
        logger.info("Warming up models...")
        dummy = np.zeros((640, 640, 3), dtype=np.uint8)
        self.safe_model(dummy, verbose=False)
        self.unsafe_model(dummy, verbose=False)
        
        logger.info("✅ Models loaded and warmed up!")
    
    def predict(
        self,
        image: np.ndarray,
        return_annotated: bool = False
    ) -> InferenceResult:
        """
        Run inference on an image.
        
        Args:
            image: BGR image from OpenCV
            return_annotated: If True, also return annotated image
            
        Returns:
            InferenceResult object
        """
        h, w = image.shape[:2]
        start_time = time.perf_counter()
        
        # Run both models
        safe_results = self.safe_model(
            image,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            verbose=False
        )
        
        unsafe_results = self.unsafe_model(
            image,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            verbose=False
        )
        
        # Parse safe detections
        safe_detections = []
        for result in safe_results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].cpu().numpy().astype(int)
                
                safe_detections.append(Detection(
                    bbox=tuple(xyxy),
                    class_name=self.SAFE_CLASSES[cls_id] if cls_id < len(self.SAFE_CLASSES) else f"class_{cls_id}",
                    confidence=conf,
                    class_id=cls_id
                ))
        
        # Parse unsafe detections
        unsafe_detections = []
        for result in unsafe_results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].cpu().numpy().astype(int)
                
                unsafe_detections.append(Detection(
                    bbox=tuple(xyxy),
                    class_name=self.UNSAFE_CLASSES[cls_id] if cls_id < len(self.UNSAFE_CLASSES) else f"class_{cls_id}",
                    confidence=conf,
                    class_id=cls_id
                ))
        
        # Apply temporal smoothing
        if self.enable_smoothing:
            safe_detections, unsafe_detections = self.smoother.smooth(safe_detections, unsafe_detections)
        
        inference_time = (time.perf_counter() - start_time) * 1000
        
        result = InferenceResult(
            safe_detections=safe_detections,
            unsafe_detections=unsafe_detections,
            inference_time_ms=inference_time,
            image_size=(w, h)
        )
        
        return result
    
    def to_websocket_format(self, result: InferenceResult) -> dict:
        """
        Convert result to WebSocket-compatible format.
        Maintains backward compatibility with existing frontend.
        
        Args:
            result: InferenceResult object
            
        Returns:
            Dictionary in WebSocket format
        """
        # Provide both pixel and normalized bboxes for compatibility
        img_w, img_h = result.image_size

        def normalize_bbox(bbox):
            x1, y1, x2, y2 = bbox
            # Avoid division by zero
            if img_w == 0 or img_h == 0:
                return [0.0, 0.0, 0.0, 0.0]
            nx1 = max(0.0, min(1.0, float(x1) / img_w))
            ny1 = max(0.0, min(1.0, float(y1) / img_h))
            nx2 = max(0.0, min(1.0, float(x2) / img_w))
            ny2 = max(0.0, min(1.0, float(y2) / img_h))
            return [round(nx1, 6), round(ny1, 6), round(nx2, 6), round(ny2, 6)]

        def pixel_bbox(bbox):
            return [int(x) for x in bbox]

        return {
            "bbox_format": "both",
            "image_size": {"width": int(img_w), "height": int(img_h)},
            "safe": {
                "detections": [
                    {
                        "label": d.class_name,
                        "confidence": float(round(d.confidence, 3)),
                        "bbox": pixel_bbox(d.bbox),
                        "bbox_normalized": normalize_bbox(d.bbox)
                    }
                    for d in result.safe_detections
                ]
            },
            "unsafe": {
                "detections": [
                    {
                        "label": d.class_name,
                        "confidence": float(round(d.confidence, 3)),
                        "bbox": pixel_bbox(d.bbox),
                        "bbox_normalized": normalize_bbox(d.bbox)
                    }
                    for d in result.unsafe_detections
                ]
            },
            "inference_time_ms": float(round(result.inference_time_ms, 1))
        }
    
    def reset_temporal_state(self):
        """Reset temporal smoothing history (call when switching cameras)."""
        if self.enable_smoothing:
            self.smoother.reset()

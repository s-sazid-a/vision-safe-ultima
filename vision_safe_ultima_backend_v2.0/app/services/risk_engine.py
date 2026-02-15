"""
Risk Assessment Engine
Combines outputs from SAFE and UNSAFE pipelines to determine overall risk
"""
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class RiskEngine:
    """
    Evaluates risk based on combined detection pipelines.
    
    Risk Levels (standardized to 3 levels):
    - LOW: No hazards detected
    - HIGH: Unauthorized access or dangerous objects
    - CRITICAL: Immediate danger (fire, accidents, etc.)
    """
    
    RISK_LEVELS = {
        "LOW": 0,
        "HIGH": 1,
        "CRITICAL": 2
    }
    
    # SAFE activities are baseline monitoring - not risk indicators
    SAFE_ACTIVITIES = ["person_walking", "person_sitting", "person_standing", "person_yoga"]
    
    # UNSAFE objects trigger risk alerts
    CRITICAL_OBJECTS = ["fire"]  # Immediate danger
    HIGH_RISK_OBJECTS = ["vehicle_car", "vehicle_motorbike"]  # Unauthorized access
    
    def __init__(self):
        """Initialize risk engine"""
        pass

    def evaluate(self, safe_result: Dict[str, Any], unsafe_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate risk based on combined pipeline results.
        
        Args:
            safe_result: Dict with 'detections' array from SAFE model
            unsafe_result: Dict with 'detections' array from UNSAFE model
        
        Returns:
            Risk assessment dict with level, score, and factors
        """
        risk_score = 0.0
        risk_level = "LOW"
        risk_factors = []
        
        try:
            # 1. Evaluate SAFE Pipeline (Activity Monitoring)
            # SAFE detections are for monitoring only, not risk calculation
            # We just track presence for logging/analytics
            if safe_result:
                safe_detections = safe_result.get("detections", [])
                if safe_detections:
                    # Log activity presence but don't increase risk
                    activities = [d.get("label", "") for d in safe_detections]
                    logger.debug(f"Safe activities detected: {activities}")
                    # Baseline score for normal activity
                    risk_score = 0.1

            # 2. Evaluate UNSAFE Pipeline (Hazard Detection)
            # This is where actual risk comes from
            if unsafe_result:
                detections = unsafe_result.get("detections", [])
                
                for det in detections:
                    label = det.get("label", "").lower().strip()
                    conf = det.get("confidence", 0.0)
                    
                    # CRITICAL: Fire detection
                    if "fire" in label and conf > 0.5:
                        risk_score = 1.0
                        risk_level = "CRITICAL"
                        risk_factors.append(f"🔥 Fire Detected (confidence: {conf:.2f})")
                        logger.warning(f"CRITICAL ALERT: Fire detected with confidence {conf:.2f}")
                    
                    # HIGH: Vehicle detection (unauthorized access)
                    elif "car" in label or "vehicle" in label:
                        if conf > 0.6:
                            risk_score = max(risk_score, 0.75)
                            if risk_level != "CRITICAL":
                                risk_level = "HIGH"
                            vehicle_type = "Car" if "car" in label else "Vehicle"
                            risk_factors.append(f"🚗 {vehicle_type} Detected (confidence: {conf:.2f})")
                            logger.warning(f"HIGH ALERT: {vehicle_type} detected with confidence {conf:.2f}")
                    
                    elif "motorbike" in label or "motorcycle" in label:
                        if conf > 0.6:
                            risk_score = max(risk_score, 0.75)
                            if risk_level != "CRITICAL":
                                risk_level = "HIGH"
                            risk_factors.append(f"🏍️ Motorbike Detected (confidence: {conf:.2f})")
                            logger.warning(f"HIGH ALERT: Motorbike detected with confidence {conf:.2f}")

            # 3. Normalize score to 0-1 range if not already
            if risk_score > 1.0:
                risk_score = 1.0
            
            # 4. Default fallback
            if risk_score == 0:
                risk_score = 0.0
                
            return {
                "level": risk_level,
                "score": risk_score,
                "factors": risk_factors,
            }
        
        except Exception as e:
            logger.error(f"Error in risk evaluation: {e}")
            return {
                "level": "LOW",
                "score": 0.0,
                "factors": [],
            }


# Global instance
risk_engine = RiskEngine()

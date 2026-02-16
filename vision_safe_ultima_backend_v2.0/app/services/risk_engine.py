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
        Evaluate risk based on density and presence of Human vs Hazard.
        
        Logic:
        1. SAFE ONLY (People): Low Risk, Score determined by crowd density (0-50).
        2. UNSAFE ONLY (Hazards): High Risk, Score determined by hazard density (50-100).
        3. MIXED (People + Hazards): Critical Risk, Score 100.
        """
        risk_score = 0.0
        risk_level = "LOW"
        risk_factors = []
        activity_type = "Safe Activity" # Default

        try:
            # Extract lists
            safe_detections = safe_result.get("detections", []) if safe_result else []
            unsafe_detections = unsafe_result.get("detections", []) if unsafe_result else []
            
            # Count logical entities
            # Safe: People (walking, sitting, standing, yoga)
            person_count = len(safe_detections)
            
            # Unsafe: Vehicles, Fire
            hazard_count = 0
            has_fire = False
            
            for det in unsafe_detections:
                label = det.get("label", "").lower()
                if "fire" in label:
                    has_fire = True
                    hazard_count += 1
                elif "car" in label or "vehicle" in label or "motorbike" in label or "truck" in label:
                    hazard_count += 1

            # --- LOGIC IMPLEMENTATION ---

            # Scenario 1: No activity
            if person_count == 0 and hazard_count == 0:
                risk_level = "LOW"
                risk_score = 0.0
                activity_type = "Safe Activity"

            # Scenario 3: MIXED (People + Hazards) -> CRITICAL
            elif person_count > 0 and hazard_count > 0:
                risk_level = "CRITICAL"
                risk_score = 100.0
                activity_type = "Unsafe Activity"
                risk_factors.append(f"CRITICAL: {person_count} People detected near {hazard_count} Hazards!")
                if has_fire:
                    risk_factors.append("🔥 Fire Threat Active")
            
            # Scenario 2: UNSAFE ONLY (Hazards) -> HIGH
            elif hazard_count > 0:
                risk_level = "HIGH"
                activity_type = "Unsafe Activity"
                # Score between 50-100 based on density
                # Base 50, +10 per hazard, max 100
                risk_score = min(100.0, 50.0 + (hazard_count * 10.0))
                risk_factors.append(f"Unsafe Zone: {hazard_count} Hazards detected")
                if has_fire:
                    risk_factors.append("🔥 Fire Detected")

            # Scenario 1 (Continued): SAFE ONLY (People) -> LOW
            elif person_count > 0:
                risk_level = "LOW"
                activity_type = "Safe Activity"
                # Score between 0-50 based on density
                # +10 per person, max 50
                risk_score = min(50.0, person_count * 10.0)
                risk_factors.append(f"Safe Crowd: {person_count} People monitored")

            return {
                "level": risk_level,
                "score": float(risk_score),
                "factors": risk_factors,
                "activity_type": activity_type,
                "stats": {
                    "person_count": person_count,
                    "hazard_count": hazard_count
                }
            }
        
        except Exception as e:
            logger.error(f"Error in risk evaluation: {e}")
            return {
                "level": "LOW",
                "score": 0.0,
                "factors": [],
                "activity_type": "Safe Activity"
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

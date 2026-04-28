"""
Proctoring Agent - Manages camera check, system check, and monitors interview integrity
"""
from typing import Dict, Any, List
from datetime import datetime
import json

class ProctoringAgent:
    def __init__(self):
        self.system_requirements = {
            "camera": True,
            "microphone": True,
            "stable_internet": True,
            "no_screen_sharing": True,
            "browser_compatibility": True
        }
    
    def start_proctoring(self, interview_id: int, db) -> Dict[str, Any]:
        """Initialize proctoring for an interview"""
        try:
            from models import ProctoringLog
            
            # Log proctoring start
            log_entry = ProctoringLog(
                interview_id=interview_id,
                event_type="proctoring_started",
                event_data={"message": "Proctoring session initialized"},
                status="info"
            )
            db.add(log_entry)
            db.commit()
            
            return {
                "success": True,
                "message": "Proctoring initialized successfully",
                "requirements": self.system_requirements
            }
            
        except Exception as e:
            print(f"Error starting proctoring: {e}")
            return {"success": False, "error": str(e)}
    
    def perform_camera_check(self, interview_id: int, camera_data: Dict[str, Any], db) -> Dict[str, Any]:
        """Perform camera check and log results"""
        try:
            from models import ProctoringLog, Interview
            
            # Simulate camera check validation
            camera_available = camera_data.get("camera_available", False)
            camera_permission = camera_data.get("camera_permission", False)
            
            camera_check_passed = camera_available and camera_permission
            
            # Update interview status
            interview = db.query(Interview).filter(Interview.id == interview_id).first()
            if interview:
                interview.camera_check_passed = camera_check_passed
                db.commit()
            
            # Log camera check
            log_entry = ProctoringLog(
                interview_id=interview_id,
                event_type="camera_check",
                event_data={
                    "camera_available": camera_available,
                    "camera_permission": camera_permission,
                    "check_passed": camera_check_passed
                },
                status="info" if camera_check_passed else "warning"
            )
            db.add(log_entry)
            db.commit()
            
            return {
                "success": True,
                "camera_check_passed": camera_check_passed,
                "message": "Camera check passed" if camera_check_passed else "Camera check failed"
            }
            
        except Exception as e:
            print(f"Error in camera check: {e}")
            return {"success": False, "error": str(e)}
    
    def perform_system_check(self, interview_id: int, system_data: Dict[str, Any], db) -> Dict[str, Any]:
        """Perform system check and log results"""
        try:
            from models import ProctoringLog, Interview
            
            # Validate system requirements
            checks = {
                "microphone": system_data.get("microphone_available", False),
                "internet": system_data.get("internet_stable", True),
                "screen_sharing": not system_data.get("screen_sharing_active", False),
                "browser": system_data.get("browser_compatible", True)
            }
            
            system_check_passed = all(checks.values())
            
            # Update interview status
            interview = db.query(Interview).filter(Interview.id == interview_id).first()
            if interview:
                interview.system_check_passed = system_check_passed
                db.commit()
            
            # Log system check
            log_entry = ProctoringLog(
                interview_id=interview_id,
                event_type="system_check",
                event_data={
                    "checks": checks,
                    "check_passed": system_check_passed
                },
                status="info" if system_check_passed else "warning"
            )
            db.add(log_entry)
            db.commit()
            
            return {
                "success": True,
                "system_check_passed": system_check_passed,
                "checks": checks,
                "message": "System check passed" if system_check_passed else "System check failed"
            }
            
        except Exception as e:
            print(f"Error in system check: {e}")
            return {"success": False, "error": str(e)}
    
    def log_suspicious_activity(self, interview_id: int, activity_type: str, details: Dict[str, Any], db) -> Dict[str, Any]:
        """Log suspicious activity during interview"""
        try:
            from models import ProctoringLog
            
            # Determine severity
            severity_map = {
                "tab_switch": "warning",
                "window_change": "warning",
                "camera_off": "critical",
                "multiple_faces": "critical",
                "screenshot_attempt": "critical"
            }
            
            status = severity_map.get(activity_type, "warning")
            
            log_entry = ProctoringLog(
                interview_id=interview_id,
                event_type="suspicious_activity",
                event_data={
                    "activity_type": activity_type,
                    "details": details,
                    "timestamp": datetime.utcnow().isoformat()
                },
                status=status
            )
            db.add(log_entry)
            db.commit()
            
            return {
                "success": True,
                "message": "Suspicious activity logged",
                "severity": status
            }
            
        except Exception as e:
            print(f"Error logging suspicious activity: {e}")
            return {"success": False, "error": str(e)}
    
    def get_proctoring_summary(self, interview_id: int, db) -> Dict[str, Any]:
        """Get summary of proctoring events for an interview"""
        try:
            from models import ProctoringLog
            
            logs = db.query(ProctoringLog).filter(
                ProctoringLog.interview_id == interview_id
            ).all()
            
            summary = {
                "total_events": len(logs),
                "critical_events": len([log for log in logs if log.status == "critical"]),
                "warning_events": len([log for log in logs if log.status == "warning"]),
                "info_events": len([log for log in logs if log.status == "info"]),
                "events": [
                    {
                        "event_type": log.event_type,
                        "status": log.status,
                        "timestamp": log.timestamp.isoformat(),
                        "data": log.event_data
                    }
                    for log in logs
                ]
            }
            
            return {
                "success": True,
                "summary": summary
            }
            
        except Exception as e:
            print(f"Error getting proctoring summary: {e}")
            return {"success": False, "error": str(e)}

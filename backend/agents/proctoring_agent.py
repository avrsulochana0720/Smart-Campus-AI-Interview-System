"""
proctor_agent.py — Logs violations + calculates risk score
Handles proctoring events: tab switches, camera off, multiple faces, etc.
Calculates a cumulative risk score per interview.
"""
import json
from typing import Dict, Any, List
from datetime import datetime


# Risk weights for each event type
RISK_WEIGHTS = {
    "tab_switch":         0.10,
    "window_change":      0.10,
    "camera_off":         0.25,
    "multiple_faces":     0.30,
    "screenshot_attempt": 0.30,
    "copy_paste":         0.15,
    "browser_resize":     0.05,
    "idle_timeout":       0.05,
}


class ProctorAgent:
    def __init__(self):
        self.risk_weights = RISK_WEIGHTS

    def log_violation(
        self, interview_id: int, user_id: int, event_type: str, details: Dict[str, Any], db
    ) -> Dict[str, Any]:
        """
        Log a proctoring violation and compute the risk score for this event.
        """
        from models import ProctoringLog

        weight = self.risk_weights.get(event_type, 0.05)

        # Determine severity
        if weight >= 0.25:
            status = "critical"
        elif weight >= 0.10:
            status = "warning"
        else:
            status = "info"

        log_entry = ProctoringLog(
            interview_id=interview_id,
            user_id=user_id,
            event_type=event_type,
            event_data=json.dumps(details),
            risk_score=weight,
            status=status,
            timestamp=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()

        return {
            "logged": True,
            "event_type": event_type,
            "risk_score": weight,
            "severity": status
        }

    def get_risk_score(self, interview_id: int, db) -> Dict[str, Any]:
        """
        Calculate cumulative risk score for an interview.
        Returns a value between 0.0 (clean) and 1.0 (high risk).
        """
        from models import ProctoringLog

        logs = db.query(ProctoringLog).filter(
            ProctoringLog.interview_id == interview_id
        ).all()

        if not logs:
            return {
                "interview_id": interview_id,
                "total_violations": 0,
                "risk_score": 0.0,
                "risk_level": "clean",
                "breakdown": {}
            }

        total_risk = sum(log.risk_score for log in logs)
        # Cap at 1.0
        capped_risk = min(total_risk, 1.0)

        # Breakdown by event type
        breakdown = {}
        for log in logs:
            et = log.event_type
            if et not in breakdown:
                breakdown[et] = {"count": 0, "total_risk": 0.0}
            breakdown[et]["count"] += 1
            breakdown[et]["total_risk"] += log.risk_score

        # Risk level
        if capped_risk >= 0.7:
            risk_level = "high"
        elif capped_risk >= 0.4:
            risk_level = "medium"
        elif capped_risk > 0:
            risk_level = "low"
        else:
            risk_level = "clean"

        return {
            "interview_id": interview_id,
            "total_violations": len(logs),
            "risk_score": round(capped_risk, 3),
            "risk_level": risk_level,
            "critical_events": len([l for l in logs if l.status == "critical"]),
            "warning_events": len([l for l in logs if l.status == "warning"]),
            "breakdown": breakdown
        }

    def get_proctoring_summary(self, interview_id: int, db) -> Dict[str, Any]:
        """Full proctoring summary for report generation."""
        from models import ProctoringLog

        logs = db.query(ProctoringLog).filter(
            ProctoringLog.interview_id == interview_id
        ).order_by(ProctoringLog.timestamp.asc()).all()

        risk_data = self.get_risk_score(interview_id, db)

        events = []
        for log in logs:
            events.append({
                "event_type": log.event_type,
                "status": log.status,
                "risk_score": log.risk_score,
                "timestamp": log.timestamp.isoformat(),
                "data": json.loads(log.event_data) if log.event_data else {}
            })

        return {
            **risk_data,
            "events": events
        }


# Singleton
proctor_agent = ProctorAgent()

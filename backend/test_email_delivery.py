import sys
from database import SessionLocal
from models import InterviewReport
from email_service import send_candidate_report_email

def verify_email_flow():
    db = SessionLocal()
    try:
        interview_id = 1
        
        # Reset any existing status
        report = db.query(InterviewReport).filter(InterviewReport.interview_id == interview_id).first()
        if not report:
            print("ERROR: Report for interview 1 not found.")
            return False
            
        report.email_delivery_status = "pending"
        report.email_delivery_error = None
        db.commit()
        print("Reset email delivery status to 'pending'.")
        
        # Call email sending
        print("Attempting to send email (SMTP credentials should be missing)...")
        try:
            send_candidate_report_email(interview_id, db)
            print("ERROR: Email sending succeeded but should have failed (silent success)!")
            return False
        except ValueError as val_err:
            print(f"Captured expected ValueError (No silent success): {val_err}")
            if "SMTP credentials not configured" not in str(val_err):
                print(f"ERROR: Unexpected exception message: {val_err}")
                return False
        except Exception as e:
            print(f"ERROR: Captured unexpected exception type: {e}")
            return False
            
        # Check database updates
        db.refresh(report)
        print(f"Report email status after abort: {report.email_delivery_status}")
        print(f"Report email error message: {report.email_delivery_error}")
        
        assert report.email_delivery_status == "smtp_missing"
        assert report.email_delivery_error == "SMTP credentials missing in configuration"
        
        print("SUCCESS: Gmail delivery warning and tracking verification completed successfully!")
        return True
        
    except Exception as e:
        print(f"ERROR during verification: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = verify_email_flow()
    sys.exit(0 if success else 1)

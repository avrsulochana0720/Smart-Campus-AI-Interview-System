import os
import sys
from database import SessionLocal
from models import Interview
from report_generator import generate_pdf_report, get_or_create_pdf_report

def verify():
    db = SessionLocal()
    try:
        interview_id = 1
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            print("ERROR: Interview ID 1 not found in database.")
            return False
            
        print(f"Verifying report generation for Interview ID: {interview_id}")
        print(f"Candidate ID: {interview.user_id}, Job: {interview.job_role} at {interview.company}")
        
        # Test generate_pdf_report
        pdf_path, pdf_url = generate_pdf_report(interview_id, db)
        print(f"Generated PDF Path: {pdf_path}")
        print(f"Generated PDF URL: {pdf_url}")
        
        # Assertions
        if not os.path.exists(pdf_path):
            print(f"ERROR: PDF file was not created at {pdf_path}")
            return False
            
        file_size = os.path.getsize(pdf_path)
        print(f"PDF created successfully. File size: {file_size} bytes.")
        if file_size == 0:
            print("ERROR: Generated PDF is empty (0 bytes).")
            return False
            
        # Test get_or_create_pdf_report
        path2, url2 = get_or_create_pdf_report(interview_id, db)
        print(f"Self-healing check - Path: {path2}, URL: {url2}")
        
        # Check DB updates
        db.refresh(interview)
        print(f"Database report_path: {interview.report_path}")
        print(f"Database report_url: {interview.report_url}")
        
        if interview.report_path != pdf_path:
            print("ERROR: Database report_path does not match generated path.")
            return False
        if interview.report_url != pdf_url:
            print("ERROR: Database report_url does not match generated URL.")
            return False
            
        print("SUCCESS: PDF generated and verified successfully!")
        return True
        
    except Exception as e:
        print(f"ERROR during verification: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = verify()
    sys.exit(0 if success else 1)

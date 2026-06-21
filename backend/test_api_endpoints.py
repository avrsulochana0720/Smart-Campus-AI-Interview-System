import sys
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import User, Interview
from auth import create_access_token

client = TestClient(app)

def test_endpoints():
    db = SessionLocal()
    try:
        # Create a TPO user for testing
        tpo_user = db.query(User).filter(User.email == "tpo@example.com").first()
        if not tpo_user:
            tpo_user = User(
                name="TPO Tester",
                email="tpo@example.com",
                password="pw",
                role="tpo",
                is_verified=True
            )
            db.add(tpo_user)
            db.commit()
            db.refresh(tpo_user)
            print(f"Created TPO User ID: {tpo_user.id}")

        # Get owner of interview 1
        interview = db.query(Interview).filter(Interview.id == 1).first()
        owner_id = interview.user_id
        owner = db.query(User).filter(User.id == owner_id).first()
        print(f"Interview 1 owner: {owner.email} (ID: {owner.id})")
        
        # Get another student (not owner)
        other_student = db.query(User).filter(User.id != owner_id, User.role == "student").first()
        print(f"Other student: {other_student.email} (ID: {other_student.id})")
        
        # Create access tokens
        owner_token = create_access_token({"sub": owner.email, "user_id": owner.id, "role": "student"})
        other_token = create_access_token({"sub": other_student.email, "user_id": other_student.id, "role": "student"})
        tpo_token = create_access_token({"sub": tpo_user.email, "user_id": tpo_user.id, "role": "tpo"})
        
        # Test Case 1: Download report without token (401)
        res = client.get("/download-report/1")
        print("Test 1 (No token): Status =", res.status_code)
        assert res.status_code == 401
        
        # Test Case 2: Download report with invalid token (401)
        res = client.get("/download-report/1?token=invalid_token")
        print("Test 2 (Invalid token): Status =", res.status_code)
        assert res.status_code == 401
        
        # Test Case 3: Download report with other student's token (403)
        res = client.get(f"/download-report/1?token={other_token}")
        print("Test 3 (Unauthorized student): Status =", res.status_code)
        assert res.status_code == 403
        
        # Test Case 4: Download report with owner's token (200)
        res = client.get(f"/download-report/1?token={owner_token}")
        print("Test 4 (Owner student): Status =", res.status_code, "Size =", len(res.content))
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        
        # Test Case 5: Download report with TPO's token (200)
        res = client.get(f"/download-report/1?token={tpo_token}")
        print("Test 5 (TPO admin): Status =", res.status_code, "Size =", len(res.content))
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        
        print("ALL ENDPOINT TESTS PASSED SUCCESSFULLY!")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_endpoints()

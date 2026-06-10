import os
import random
from datetime import datetime, timedelta
from database import SessionLocal, engine, Base
from models import User, Interview, InterviewReport, Resume, ProctoringLog
from auth import hash_password_native

def seed_db():
    print("Creating tables if they don't exist...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check removed

    print("Seeding Users...")
    departments = ["Computer Science", "Information Technology", "Electronics", "Mechanical"]
    students = db.query(User).filter(User.role == 'student').all()
    
    if not students:
        # Create some mock students
        names = ["Aarav Sharma", "Vihaan Patel", "Aditya Singh", "Sai Kumar", "Ananya Gupta", 
                 "Diya Reddy", "Isha Joshi", "Kavya Menon", "Rohan Das", "Neha Verma"]
                 
        for i, name in enumerate(names):
            student = User(
                name=name,
                email=f"student{i+100}@example.com",
                password=hash_password_native("password123"),
                role="student",
                department=random.choice(departments),
                is_verified=True
            )
            db.add(student)
            students.append(student)
            
        db.commit()

    print("Seeding Resumes and Interviews...")
    companies = ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro"]
    roles = ["Software Engineer", "Data Analyst", "Frontend Developer", "Backend Engineer", "DevOps"]
    
    for student in students:
        # Create Resume
        resume = Resume(
            user_id=student.id,
            resume_text=f"Resume of {student.name}. Skilled in Python, React, SQL, Java.",
            skills_extracted='["Python", "React", "SQL", "Java"]',
            uploaded_at=datetime.utcnow() - timedelta(days=random.randint(5, 30))
        )
        db.add(resume)
        db.commit()

        # Create Interview
        num_interviews = random.randint(1, 3)
        for _ in range(num_interviews):
            status = random.choice(["completed", "completed", "in_progress", "failed"])
            interview = Interview(
                user_id=student.id,
                resume_id=resume.id,
                job_role=random.choice(roles),
                company=random.choice(companies),
                mode="Practice",
                status=status,
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 14))
            )
            db.add(interview)
            db.commit()

            # Create Report if completed
            if status == "completed":
                tech_score = random.uniform(60, 95)
                hr_score = random.uniform(65, 98)
                final_score = (tech_score * 0.7) + (hr_score * 0.3)
                
                report = InterviewReport(
                    interview_id=interview.id,
                    narrative_summary=f"{student.name} performed well, demonstrating strong problem-solving skills.",
                    average_score=int(final_score),
                    total_questions=10,
                    answered_questions=random.randint(8, 10),
                    strengths="Algorithm Design, Clear Communication",
                    weaknesses="System Design concepts need improvement",
                    recommendation="Hire" if final_score > 80 else "Needs Practice",
                    technical_score=tech_score,
                    hr_score=hr_score,
                    confidence_score=random.uniform(70, 95),
                    overall_technical_score=tech_score,
                    overall_hr_score=hr_score,
                    final_interview_score=final_score,
                    hiring_readiness_score=int(final_score),
                    status="completed",
                    generated_at=interview.created_at + timedelta(hours=1)
                )
                db.add(report)

    print("Seeding Proctoring Logs...")
    events = ["Multiple faces detected", "Looking away from screen", "Tab switched", "Audio anomaly detected"]
    for _ in range(15):
        log = ProctoringLog(
            interview_id=random.randint(1, len(students)),
            event_type=random.choice(events),
            timestamp=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
            status=random.choice(["warning", "critical"])
        )
        db.add(log)
        
    db.commit()
    print("Seeding Companies and Job Roles...")
    from models import Company, JobRoleTemplate
    if db.query(Company).count() == 0:
        c1 = Company(name="Google", industry="Technology", description="Search", required_skills="Python, Go", is_active=True)
        c2 = Company(name="Microsoft", industry="Technology", description="Software", required_skills="C#, C++", is_active=True)
        c3 = Company(name="TCS", industry="IT Services", description="Consulting", required_skills="Java, Python", is_active=True)
        db.add_all([c1, c2, c3])
        db.commit()
        db.refresh(c1)
        db.refresh(c2)
        
        j1 = JobRoleTemplate(company_id=c1.id, title="Software Engineer", description="SDE 1", required_skills="DSA, Python", is_active=True)
        j2 = JobRoleTemplate(company_id=c2.id, title="Data Analyst", description="Data Science Intern", required_skills="SQL, Python", is_active=True)
        j3 = JobRoleTemplate(company_id=c3.id, title="Systems Engineer", description="TCS Ninja", required_skills="Java, DBMS", is_active=True)
        db.add_all([j1, j2, j3])
        db.commit()

    print("Seeding Batches, Integrations, and Feedbacks...")
    from models import Batch, Integration, Feedback
    
    if db.query(Batch).count() == 0:
        b1 = Batch(batch_id="B-2026-CS", name="CS Graduation 2026", students_count=120, interviews_done=350, avg_score=82.5, status="Active")
        b2 = Batch(batch_id="B-2026-IT", name="IT Graduation 2026", students_count=95, interviews_done=210, avg_score=79.0, status="Active")
        b3 = Batch(batch_id="B-2025-ME", name="Mechanical 2025 Placement", students_count=150, interviews_done=400, avg_score=75.2, status="Completed")
        db.add_all([b1, b2, b3])
        
    if db.query(Integration).count() == 0:
        i1 = Integration(name="GitHub", desc="Sync candidate repositories and verify code commits.", icon="https://cdn-icons-png.flaticon.com/512/733/733553.png", status="Connected", color="#3B82F6")
        i2 = Integration(name="LinkedIn", desc="Import candidate profiles and professional experience.", icon="https://cdn-icons-png.flaticon.com/512/3536/3536505.png", status="Connected", color="#3B82F6")
        i3 = Integration(name="Workday ATS", desc="Push successful candidates directly to HR workflows.", icon="https://cdn-icons-png.flaticon.com/512/5968/5968382.png", status="Not Connected", color="#64748B")
        db.add_all([i1, i2, i3])
        
    if db.query(Feedback).count() == 0:
        if students:
            student = students[0]
            f1 = Feedback(user_id=student.id, type="Platform", target="UI", rating=5.0, comment="Great platform! Very intuitive.", tag="Positive")
            f2 = Feedback(user_id=student.id, type="Interview", target="AI Agent", rating=4.5, comment="AI feedback was spot on.", tag="Positive")
            f3 = Feedback(user_id=student.id, type="Platform", target="Video", rating=3.0, comment="Good experience, but video quality can improve.", tag="Neutral")
            f4 = Feedback(user_id=student.id, type="Platform", target="Auth", rating=2.0, comment="Had trouble logging in yesterday.", tag="Negative")
            db.add_all([f1, f2, f3, f4])
            
    db.commit()

    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_db()

"""
migrate_db.py - Add missing columns to existing tables for the new agent architecture.
Safe to run multiple times - it checks if columns exist before adding.
Includes RAG/PDF knowledge base table migrations.
"""
from database import engine
from sqlalchemy import text, inspect

def migrate():
    inspector = inspect(engine)
    
    migrations = [
        # users table - add missing columns
        ("users", "phone_number", "ALTER TABLE users ADD COLUMN phone_number VARCHAR(50)"),
        ("users", "auth_method", "ALTER TABLE users ADD COLUMN auth_method VARCHAR(50) DEFAULT 'email'"),
        # resumes table - add skills_extracted and ai_analysis
        ("resumes", "skills_extracted", "ALTER TABLE resumes ADD COLUMN skills_extracted TEXT"),
        ("resumes", "ai_analysis", "ALTER TABLE resumes ADD COLUMN ai_analysis TEXT"),
        # interview_reports table - add strengths, weaknesses, recommendation
        ("interview_reports", "strengths", "ALTER TABLE interview_reports ADD COLUMN strengths TEXT"),
        ("interview_reports", "weaknesses", "ALTER TABLE interview_reports ADD COLUMN weaknesses TEXT"),
        ("interview_reports", "recommendation", "ALTER TABLE interview_reports ADD COLUMN recommendation TEXT"),
        # interview_reports table - RAG-enhanced fields
        ("interview_reports", "technical_score", "ALTER TABLE interview_reports ADD COLUMN technical_score FLOAT"),
        ("interview_reports", "hr_score", "ALTER TABLE interview_reports ADD COLUMN hr_score FLOAT"),
        ("interview_reports", "confidence_score", "ALTER TABLE interview_reports ADD COLUMN confidence_score FLOAT"),
        ("interview_reports", "missing_concepts", "ALTER TABLE interview_reports ADD COLUMN missing_concepts TEXT"),
        ("interview_reports", "improvement_suggestions", "ALTER TABLE interview_reports ADD COLUMN improvement_suggestions TEXT"),
        ("interview_reports", "rag_matching_data", "ALTER TABLE interview_reports ADD COLUMN rag_matching_data TEXT"),
        # interview_questions - add expected_answer
        ("interview_questions", "expected_answer", "ALTER TABLE interview_questions ADD COLUMN expected_answer TEXT"),
        # answers table - add question_type
        ("answers", "question_type", "ALTER TABLE answers ADD COLUMN question_type VARCHAR(50)"),
        
        # NEW: factor-based scoring (answers)
        ("answers", "accuracy_score", "ALTER TABLE answers ADD COLUMN accuracy_score INTEGER"),
        ("answers", "concept_understanding_score", "ALTER TABLE answers ADD COLUMN concept_understanding_score INTEGER"),
        ("answers", "problem_solving_score", "ALTER TABLE answers ADD COLUMN problem_solving_score INTEGER"),
        ("answers", "communication_clarity_score", "ALTER TABLE answers ADD COLUMN communication_clarity_score INTEGER"),
        ("answers", "code_quality_score", "ALTER TABLE answers ADD COLUMN code_quality_score INTEGER"),
        ("answers", "communication_skills_score", "ALTER TABLE answers ADD COLUMN communication_skills_score INTEGER"),
        ("answers", "confidence_score", "ALTER TABLE answers ADD COLUMN confidence_score INTEGER"),
        ("answers", "professionalism_score", "ALTER TABLE answers ADD COLUMN professionalism_score INTEGER"),
        ("answers", "adaptability_score", "ALTER TABLE answers ADD COLUMN adaptability_score INTEGER"),
        ("answers", "team_collaboration_score", "ALTER TABLE answers ADD COLUMN team_collaboration_score INTEGER"),
        ("answers", "rag_reference_id", "ALTER TABLE answers ADD COLUMN rag_reference_id VARCHAR(50)"),
        ("answers", "rag_similarity_score", "ALTER TABLE answers ADD COLUMN rag_similarity_score FLOAT"),
        
        # NEW: factor averages & overall scores (interview_reports)
        ("interview_reports", "tech_accuracy_avg", "ALTER TABLE interview_reports ADD COLUMN tech_accuracy_avg FLOAT"),
        ("interview_reports", "tech_concept_understanding_avg", "ALTER TABLE interview_reports ADD COLUMN tech_concept_understanding_avg FLOAT"),
        ("interview_reports", "tech_problem_solving_avg", "ALTER TABLE interview_reports ADD COLUMN tech_problem_solving_avg FLOAT"),
        ("interview_reports", "tech_communication_avg", "ALTER TABLE interview_reports ADD COLUMN tech_communication_avg FLOAT"),
        ("interview_reports", "tech_code_quality_avg", "ALTER TABLE interview_reports ADD COLUMN tech_code_quality_avg FLOAT"),
        ("interview_reports", "overall_technical_score", "ALTER TABLE interview_reports ADD COLUMN overall_technical_score FLOAT"),
        ("interview_reports", "hr_communication_skills_avg", "ALTER TABLE interview_reports ADD COLUMN hr_communication_skills_avg FLOAT"),
        ("interview_reports", "hr_confidence_avg", "ALTER TABLE interview_reports ADD COLUMN hr_confidence_avg FLOAT"),
        ("interview_reports", "hr_professionalism_avg", "ALTER TABLE interview_reports ADD COLUMN hr_professionalism_avg FLOAT"),
        ("interview_reports", "hr_adaptability_avg", "ALTER TABLE interview_reports ADD COLUMN hr_adaptability_avg FLOAT"),
        ("interview_reports", "hr_team_collaboration_avg", "ALTER TABLE interview_reports ADD COLUMN hr_team_collaboration_avg FLOAT"),
        ("interview_reports", "overall_hr_score", "ALTER TABLE interview_reports ADD COLUMN overall_hr_score FLOAT"),
        ("interview_reports", "final_interview_score", "ALTER TABLE interview_reports ADD COLUMN final_interview_score FLOAT"),
        ("interview_reports", "evaluation_method", "ALTER TABLE interview_reports ADD COLUMN evaluation_method VARCHAR(50) DEFAULT 'json_rag'"),
        ("interview_reports", "evaluation_model", "ALTER TABLE interview_reports ADD COLUMN evaluation_model VARCHAR(100) DEFAULT 'qwen'"),
        ("interview_reports", "retrieved_references_count", "ALTER TABLE interview_reports ADD COLUMN retrieved_references_count INTEGER DEFAULT 0"),
        
        # PDF Knowledge Base tables (columns on pdf_chunks)
        ("pdf_chunks", "question_text", "ALTER TABLE pdf_chunks ADD COLUMN question_text TEXT"),
        ("pdf_chunks", "answer_text", "ALTER TABLE pdf_chunks ADD COLUMN answer_text TEXT"),
        ("pdf_chunks", "question_category", "ALTER TABLE pdf_chunks ADD COLUMN question_category VARCHAR(50)"),
        ("pdf_chunks", "is_qa_pair", "ALTER TABLE pdf_chunks ADD COLUMN is_qa_pair BOOLEAN DEFAULT FALSE"),
        # PDF documents stats
        ("pdf_documents", "total_qa_pairs", "ALTER TABLE pdf_documents ADD COLUMN total_qa_pairs INTEGER DEFAULT 0"),
        ("pdf_documents", "total_chunks", "ALTER TABLE pdf_documents ADD COLUMN total_chunks INTEGER DEFAULT 0"),
    ]
    
    with engine.connect() as conn:
        for table, column, sql in migrations:
            if not inspector.has_table(table):
                print(f"  [SKIP] Table '{table}' does not exist yet (will be created by SQLAlchemy)")
                continue
            existing_cols = [c["name"] for c in inspector.get_columns(table)]
            if column not in existing_cols:
                print(f"  Adding column '{column}' to '{table}'...")
                try:
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"  [OK] Added '{column}'")
                except Exception as e:
                    print(f"  [WARN] Could not add '{column}' to '{table}': {e}")
            else:
                print(f"  [SKIP] '{table}.{column}' already exists")

    print("\n[OK] Database migration complete.")

if __name__ == "__main__":
    migrate()

from database import engine, SessionLocal
from sqlalchemy import text

def add_indexes():
    db = SessionLocal()
    try:
        # Robust SQL INDEX creation supporting both SQLite and MySQL
        indexes = [
            ("idx_interview_id", "interview_questions (interview_id)"),
            ("idx_question_id", "answers (question_id)"),
            ("idx_user_id", "interviews (user_id)"),
            ("idx_report_interview_id", "interview_reports (interview_id)"),
            ("idx_pdf_chunks_is_qa_pair", "pdf_chunks (is_qa_pair)"),
            ("idx_pdf_chunks_document_id", "pdf_chunks (document_id)"),
            ("idx_json_entries_question_type", "json_entries (question_type)"),
            ("idx_json_entries_source_type", "json_entries (source_type)"),
            ("idx_json_entries_document_id", "json_entries (document_id)")
        ]
        
        for index_name, table_spec in indexes:
            try:
                # Use standard database-agnostic index creation if possible
                db.execute(text(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_spec};"))
            except Exception as e:
                # Fallback in case IF NOT EXISTS fails on certain DB versions
                try:
                    db.execute(text(f"CREATE INDEX {index_name} ON {table_spec};"))
                except Exception as inner_e:
                    print(f"Index {index_name} might already exist: {inner_e}")
            
        db.commit()
        print("Indexes added successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_indexes()

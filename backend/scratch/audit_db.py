"""Quick audit script to check database state."""
from database import engine
from sqlalchemy import text

conn = engine.connect()

print("=== JSON Documents ===")
rows = conn.execute(text("SELECT id, filename, source_type, total_entries, status FROM json_documents")).fetchall()
for r in rows:
    print(f"  {r}")

print("\n=== JSON Entries Count ===")
count = conn.execute(text("SELECT count(id) FROM json_entries")).scalar()
print(f"  Total JSON entries: {count}")

print("\n=== Per Source Type ===")
for st in ["hr", "math", "technical"]:
    c = conn.execute(text(f"SELECT count(id) FROM json_entries WHERE source_type='{st}'")).scalar()
    print(f"  {st}: {c}")

print("\n=== PDF Documents ===")
rows = conn.execute(text("SELECT id, filename, status, total_qa_pairs, total_chunks FROM pdf_documents")).fetchall()
for r in rows:
    print(f"  {r}")

print("\n=== PDF Chunks Count ===")
count = conn.execute(text("SELECT count(id) FROM pdf_chunks")).scalar()
print(f"  Total PDF chunks: {count}")

print("\n=== Answer Table Schema (factor score columns) ===")
rows = conn.execute(text("PRAGMA table_info(answers)")).fetchall()
factor_cols = [r[1] for r in rows if "score" in r[1] or "rag_" in r[1]]
print(f"  Factor/RAG columns: {factor_cols}")

print("\n=== InterviewReport Table Schema (factor avg columns) ===")
rows = conn.execute(text("PRAGMA table_info(interview_reports)")).fetchall()
factor_cols = [r[1] for r in rows if "avg" in r[1] or "overall" in r[1] or "final" in r[1] or "evaluation" in r[1]]
print(f"  Factor/Score columns: {factor_cols}")

print("\n=== Sample JSON Entry (first 1) ===")
row = conn.execute(text("SELECT entry_id, question_type, source_type, source_file, category, difficulty, substr(question, 1, 80) as q FROM json_entries LIMIT 1")).fetchone()
if row:
    print(f"  ID: {row[0]}")
    print(f"  Type: {row[1]}, Source: {row[2]}, File: {row[3]}")
    print(f"  Category: {row[4]}, Difficulty: {row[5]}")
    print(f"  Question: {row[6]}...")

print("\n=== Duplicate Check ===")
dup_count = conn.execute(text("SELECT count(id) - count(DISTINCT entry_id) FROM json_entries")).scalar()
print(f"  Duplicate entry_ids: {dup_count}")

print("\n=== Entries with ideal_answer ===")
with_answer = conn.execute(text("SELECT count(id) FROM json_entries WHERE ideal_answer IS NOT NULL AND ideal_answer != ''")).scalar()
total = conn.execute(text("SELECT count(id) FROM json_entries")).scalar()
print(f"  With ideal_answer: {with_answer}/{total}")

conn.close()
print("\n[OK] Database audit complete.")

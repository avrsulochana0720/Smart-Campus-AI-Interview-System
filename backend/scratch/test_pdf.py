import sys
sys.path.insert(0, '.')
from pdf_processor import pdf_processor

text = pdf_processor.extract_text('../public/freshers-interview-questions-answers.pdf')
print(f"Extracted {len(text)} chars")

qa = pdf_processor.parse_qa_pairs(text)
print(f"Found {len(qa)} Q&A pairs")

for i, q in enumerate(qa[:5]):
    qtype = q["type"]
    question = q["question"][:80]
    answer = q["answer"][:80]
    print(f"  Q{i+1} [{qtype}]: {question}...")
    print(f"  A{i+1}: {answer}...")
print("---")
tech_count = sum(1 for q in qa if q["type"] == "technical")
hr_count = sum(1 for q in qa if q["type"] == "hr")
print(f"Technical: {tech_count}, HR: {hr_count}")

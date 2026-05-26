import sys
sys.path.insert(0, '.')
from pdf_processor import pdf_processor

text = pdf_processor.extract_text('../public/freshers-interview-questions-answers.pdf')
# Print first 3000 chars to understand the format
print(text[:3000])
print("===== END OF PREVIEW =====")
print(f"Total chars: {len(text)}")

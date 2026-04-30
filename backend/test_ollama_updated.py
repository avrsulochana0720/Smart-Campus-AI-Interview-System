import ollama
import os

# Load configuration from .env
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

print(f"Testing Ollama with model: {OLLAMA_MODEL}")

test_resume = """
John Doe
Software Engineer at Tech Corp

Education:
- Bachelor of Computer Science, 2020 - MIT

Experience:
- Led a team of 5 developers to increase system performance by 40%
- Implemented microservices architecture that reduced costs by $500K
- Optimized database queries resulting in 60% faster response times
"""

try:
    # Test name extraction
    name_prompt = f"Extract the full name from this resume. Return only the name:\n{test_resume[:1000]}"
    name_response = ollama.generate(model=OLLAMA_MODEL, prompt=name_prompt, options={'num_predict': 50})
    name = name_response['response'].strip()
    print(f"Name: {name}")
    
    # Test education extraction
    edu_prompt = f"Extract education in format 'Major - Year - University' from this resume:\n{test_resume[:2000]}"
    edu_response = ollama.generate(model=OLLAMA_MODEL, prompt=edu_prompt, options={'num_predict': 100})
    education = edu_response['response'].strip()
    print(f"Education: {education}")
    
    # Test classification
    classify_prompt = f"""
Classify this person as one word - IMPACT, MOTIVE, or SYSTEM:
- IMPACT: results-driven, metrics, achievements
- MOTIVE: people-driven, leadership, teams  
- SYSTEM: process-driven, architecture, optimization

Resume: {test_resume[:3000]}
"""
    class_response = ollama.generate(model=OLLAMA_MODEL, prompt=classify_prompt, options={'num_predict': 20})
    candidate_type = class_response['response'].strip().upper()
    print(f"Candidate Type: {candidate_type}")
    
    print("\n✅ Ollama integration is working!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

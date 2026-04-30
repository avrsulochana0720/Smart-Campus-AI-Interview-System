import ollama
import os

# Load configuration from .env
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

print(f"Testing Ollama with model: {OLLAMA_MODEL}")
print(f"Ollama base URL: {OLLAMA_BASE_URL}")

try:
    # Test if Ollama is running
    models = ollama.list()
    print(f"Available models: {[model['name'] for model in models['models']]}")
    
    # Test classification
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
    
    prompt = f"""
    Analyze the following resume text and extract:
    1. Candidate's Full Name
    2. Education details (Major, Year of Graduation, University)
    3. Classify the candidate into exactly ONE of these three types based on their achievements, skills, and career focus:
       - IMPACT: Results-driven, focuses on measurable outcomes, revenue, growth, efficiency improvements
       - MOTIVE: People-driven, focuses on leadership, team building, motivation, communication, mentoring
       - SYSTEM: Process-driven, focuses on architecture, systems thinking, optimization, technical infrastructure

    Return the response in the following JSON format only:
    {{
        "name": "Name here",
        "education": "Major 'Year - University",
        "candidate_type": "IMPACT|MOTIVE|SYSTEM"
    }}

    Resume Text:
    {test_resume}
    """
    
    response = ollama.generate(
        model=OLLAMA_MODEL,
        prompt=prompt,
        options={
            'temperature': 0.3,
            'num_predict': 200
        }
    )
    
    print("\nClassification result:")
    result_text = response['response']
    print(result_text)
    
    # Try to parse JSON
    import json
    import re
    try:
        # Clean up the response
        result_text = re.sub(r'```json\n?', '', result_text)
        result_text = re.sub(r'```\n?', '', result_text)
        result_text = result_text.strip()
        
        parsed = json.loads(result_text)
        print("\nParsed result:")
        print(f"Name: {parsed.get('name')}")
        print(f"Education: {parsed.get('education')}")
        print(f"Candidate Type: {parsed.get('candidate_type')}")
    except Exception as e:
        print(f"\nFailed to parse JSON: {e}")
    
except Exception as e:
    print(f"Error: {e}")
    print("\nMake sure Ollama is installed and running:")
    print("1. Install Ollama from https://ollama.com")
    print("2. Run: ollama serve")
    print(f"3. Pull the model: ollama pull {OLLAMA_MODEL}")

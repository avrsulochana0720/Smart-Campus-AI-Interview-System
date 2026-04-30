import ollama

try:
    # Simple test
    response = ollama.generate(
        model='llama3.2',
        prompt='What is 2+2? Answer with just the number.',
        options={'num_predict': 10}
    )
    print("Simple test response:", response['response'])
    
    # Test JSON response
    response2 = ollama.generate(
        model='llama3.2',
        prompt='Respond with JSON: {"result": "test"}',
        options={'num_predict': 50}
    )
    print("JSON test response:", response2['response'])
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

import ollama
import os
import time

def request_ollama(prompt: str, model: str = None) -> str:
    """
    Routes to local Ollama with optimized settings for fast, focused generation.
    Includes retry logic to avoid marking questions as ERROR on transient failures.
    """
    ollama_model = model or os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    
    print(f"[Ollama] Routing request to local Ollama ({ollama_model})...")
    start_time = time.time()
    
    max_retries = 2
    for attempt in range(max_retries):
        try:
            response = ollama.generate(
                model=ollama_model,
                prompt=prompt,
                options={
                    'temperature': 0.4,       # Lower = faster + more focused output
                    'num_predict': 800,        # Higher = prevents JSON truncation
                    'num_ctx': 2048,           # Constrained context = faster attention
                    'top_p': 0.9,              # Nucleus sampling for quality
                    'repeat_penalty': 1.15,    # Penalize repetitive text
                }
            )
            duration = time.time() - start_time
            print(f"[Ollama] Local Ollama succeeded in {duration:.2f}s")
            return response['response']
            
        except Exception as e:
            duration = time.time() - start_time
            if attempt < max_retries - 1:
                print(f"[Ollama] Attempt {attempt+1} failed after {duration:.2f}s: {e}. Retrying...")
                time.sleep(2)
            else:
                print(f"[Ollama Error] Local Ollama failed after {max_retries} attempts ({duration:.2f}s): {e}")
                raise e

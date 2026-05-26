import urllib.request
import urllib.parse
import json

KEYS = [
    "AIzaSyC--U1W_8seZgI5ObfJj34Lp9vA6_0AL6c",
    "AIzaSyCf0dIX4Y-iLSC34-zCMxwAN9geNNnOj0s"
]

MODELS = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash"
]

# We track the last successful key/model index to avoid repeating rate-limited ones first
_last_successful_key_idx = 0
_last_successful_model_idx = 0

def request_gemini(prompt: str, api_key: str = None, model: str = None) -> str:
    """
    Direct urllib-based wrapper for the Gemini API with automatic key rotation
    and model fallback capability when quota limits (HTTP 429) are encountered.
    """
    global _last_successful_key_idx, _last_successful_model_idx

    # If key or model is specified directly, try that first
    if api_key and model:
        try:
            return _execute_request(prompt, api_key, model)
        except Exception as e:
            print(f"[Gemini Helper] Direct request failed ({model} with key {api_key[:10]}...): {e}. Falling back to rotation.")

    # Generate prioritized list of key-model combinations starting with last successful
    combinations = []
    
    # 1. Add last successful first
    last_key = KEYS[_last_successful_key_idx]
    last_model = MODELS[_last_successful_model_idx]
    combinations.append((last_key, last_model))

    # 2. Add the rest of the combinations
    for k_idx, key in enumerate(KEYS):
        for m_idx, mod in enumerate(MODELS):
            if (key, mod) not in combinations:
                combinations.append((key, mod))

    # Try combinations sequentially
    last_error = None
    for key, mod in combinations:
        try:
            # print(f"[Gemini Helper] Attempting request using model: {mod} with key: {key[:10]}...")
            res = _execute_request(prompt, key, mod)
            
            # Update last successful indexes
            if key in KEYS:
                _last_successful_key_idx = KEYS.index(key)
            if mod in MODELS:
                _last_successful_model_idx = MODELS.index(mod)
                
            return res
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8')
            last_error = f"HTTP {e.code}: {err_body}"
            # Log failure and try next combination
            # print(f"[Gemini Helper] Combination failed (Model: {mod}, Key: {key[:10]}...) -> HTTP {e.code}")
        except Exception as e:
            last_error = str(e)
            # print(f"[Gemini Helper] Combination failed (Model: {mod}, Key: {key[:10]}...) -> {e}")

    # If all combinations failed
    print(f"[Gemini Helper Error] All key-model combinations failed. Last error: {last_error}")
    return f"Error: All Gemini API combinations failed. Last error: {last_error}"


def _execute_request(prompt: str, api_key: str, model: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url, 
        data=data, 
        headers={'Content-Type': 'application/json'}, 
        method='POST'
    )
    
    with urllib.request.urlopen(req) as response:
        resp_body = response.read().decode('utf-8')
        resp_data = json.loads(resp_body)
        
        candidates = resp_data.get("candidates", [])
        if candidates:
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if parts:
                return parts[0].get("text", "")
        raise Exception("No content returned in Gemini response.")

if __name__ == "__main__":
    print("Testing temporary Gemini Helper with Key Rotation & Fallback...")
    test_prompt = "Say 'Hello from key rotation!' in exactly one sentence."
    response = request_gemini(test_prompt)
    print(f"Response: {response}")

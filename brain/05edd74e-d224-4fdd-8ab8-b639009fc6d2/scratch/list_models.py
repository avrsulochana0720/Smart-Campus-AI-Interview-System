import urllib.request
import urllib.parse
import json

keys = [
    "AIzaSyC--U1W_8seZgI5ObfJj34Lp9vA6_0AL6c",
    "AIzaSyCf0dIX4Y-iLSC34-zCMxwAN9geNNnOj0s"
]

for key in keys:
    print(f"\n--- Listing Models for Key: {key[:10]}... ---")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    try:
        with urllib.request.urlopen(url) as response:
            resp = json.loads(response.read().decode('utf-8'))
            models = resp.get("models", [])
            for m in models:
                name = m.get("name", "")
                supported_methods = m.get("supportedGenerationMethods", [])
                if "generateContent" in supported_methods:
                    print(f"  - {name}")
    except Exception as e:
        print(f"Failed: {e}")

import urllib.request
import urllib.parse
import json

keys = [
    "AIzaSyC--U1W_8seZgI5ObfJj34Lp9vA6_0AL6c",
    "AIzaSyCf0dIX4Y-iLSC34-zCMxwAN9geNNnOj0s"
]

models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro"
]

versions = ["v1beta", "v1"]

for key in keys:
    for model in models:
        for version in versions:
            url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={key}"
            payload = {"contents": [{"parts": [{"text": "Say 'hello'"}]}]}
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
            try:
                with urllib.request.urlopen(req) as response:
                    resp = json.loads(response.read().decode('utf-8'))
                    text = resp["candidates"][0]["content"]["parts"][0]["text"].strip()
                    print(f"[SUCCESS] Key: {key[:10]}... | Model: {model} | Version: {version} -> {text}")
            except Exception as e:
                # print(f"[FAILED] Key: {key[:10]}... | Model: {model} | Version: {version} -> {e}")
                pass
print("Diagnostic Done!")

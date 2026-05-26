import urllib.request
import urllib.parse
import json

keys = [
    "AIzaSyC--U1W_8seZgI5ObfJj34Lp9vA6_0AL6c",
    "AIzaSyCf0dIX4Y-iLSC34-zCMxwAN9geNNnOj0s"
]

models = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-lite-latest"
]

for key in keys:
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        payload = {"contents": [{"parts": [{"text": "Say 'ok'"}]}]}
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
        try:
            with urllib.request.urlopen(req) as response:
                resp = json.loads(response.read().decode('utf-8'))
                text = resp["candidates"][0]["content"]["parts"][0]["text"].strip()
                print(f"[OK] Key: {key[:10]}... | Model: {model} -> {text}")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8')
            print(f"[FAIL] Key: {key[:10]}... | Model: {model} -> {e.code}")
        except Exception as e:
            print(f"[FAIL] Key: {key[:10]}... | Model: {model} -> {e}")

import requests
import time
import os

BASE = 'http://127.0.0.1:8001'
EMAIL = f'report_verify_long2_{int(time.time())}@example.com'
PASSWORD = 'pw12345'
NAME = 'Report Verify Long2'

r = requests.post(f'{BASE}/register', data={'name': NAME, 'email': EMAIL, 'password': PASSWORD}, timeout=120)
print('REGISTER', r.status_code, r.text)
assert r.status_code == 200
r = requests.post(f'{BASE}/login', json={'email': EMAIL, 'password': PASSWORD}, timeout=120)
print('LOGIN', r.status_code, r.text)
assert r.status_code == 200

token = r.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

with open('temp_report_resume.txt', 'w', encoding='utf-8') as f:
    f.write('Alice Johnson Backend Engineer Python SQL Docker AWS microservices')
with open('temp_report_resume.txt', 'rb') as f:
    r = requests.post(f'{BASE}/upload-resume', headers=headers, files={'file': ('resume.txt', f, 'text/plain')}, timeout=120)
print('UPLOAD', r.status_code, r.text)
assert r.status_code == 200
resume_id = r.json().get('resume_id') or r.json().get('id')

r = requests.post(f'{BASE}/create-interview', headers=headers, json={'job_role': 'Backend Engineer', 'company': 'Amazon', 'resume_id': resume_id}, timeout=120)
print('CREATE', r.status_code, r.text)
assert r.status_code == 200
interview_id = r.json()['interview_id']

r = requests.get(f'{BASE}/get-question/{interview_id}', headers=headers, timeout=120)
print('GETQ', r.status_code, r.text)
assert r.status_code == 200
q = r.json()

r = requests.post(f'{BASE}/submit-answer', headers=headers, json={
    'interview_id': interview_id,
    'question_id': q['question_id'],
    'answer': 'I would design a scalable backend using microservices, caching, observability, and clear APIs.'
}, timeout=120)
print('SUBMIT', r.status_code, r.text)
assert r.status_code == 200

r = requests.post(f'{BASE}/generate-report/{interview_id}', headers=headers, timeout=120)
print('GENERATE_REPORT', r.status_code, r.text)
assert r.status_code == 200

for i in range(24):
    time.sleep(5)
    r = requests.get(f'{BASE}/get-report/{interview_id}', headers=headers, timeout=120)
    data = r.json()
    print('POLL', i + 1, r.status_code, data.get('status'), 'summary=', bool(data.get('narrative_summary')))
    if r.status_code == 200 and data.get('status') == 'completed':
        print('VERIFY_OK')
        break
else:
    print('TIMEOUT')

os.remove('temp_report_resume.txt')

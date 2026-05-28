import os
import glob

files_to_update = glob.glob('agents/*.py') + ['ai_service.py']
for file_path in files_to_update:
    if not os.path.exists(file_path): continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the import
    content = content.replace('from gemini_helper import request_gemini', 'from ollama_helper import request_ollama')
    
    # Replace the function call
    content = content.replace('request_gemini(', 'request_ollama(')
    
    # Cleanup any references in strings/comments
    content = content.replace('Gemini', 'Ollama')
    content = content.replace('gemini', 'ollama')
    
    # Specific report_agent cleanups
    if 'report_agent.py' in file_path:
        content = content.replace('Ollama config', 'Ollama config')
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {file_path}')

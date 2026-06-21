import os

replacements = {
    '#3B82F6': '#E11D48',
    '#3b82f6': '#E11D48',
    'rgba(59, 130, 246': 'rgba(225, 29, 72',
    '#4F46E5': '#BE123C',
    '#4f46e5': '#BE123C',
    '#1D4ED8': '#9F1239',
    '#1d4ed8': '#9F1239',
    '#2563EB': '#BE123C',
    '#2563eb': '#BE123C',
    '#1E3A8A': '#4C0519',
    '#1e3a8a': '#4C0519',
    'rgba(30, 58, 138': 'rgba(76, 5, 25',
    '#93C5FD': '#FDA4AF',
    '#93c5fd': '#FDA4AF',
    '#EFF6FF': '#FFF1F2',
    '#eff6ff': '#FFF1F2',
    '#0EA5E9': '#F43F5E',
    '#0ea5e9': '#F43F5E'
}

count = 0
for root, _, files in os.walk('frontend/src/admin'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
                
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f'Updated {path}')

print(f'Total files updated: {count}')

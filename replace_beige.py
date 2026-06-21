import os
import re

replacements = {
    '#0D1322': '#FAF6EE',
    '#0d1322': '#FAF6EE',
    '#0A0F1C': '#FAF6EE',
    '#0a0f1c': '#FAF6EE',
    '#111827': '#FFFFFF',
    '#1E293B': '#E2E8F0',
    '#334155': '#CBD5E1',
    '#FFFFFF': '#0F172A',
    '#FFF': '#0F172A',
    '#E2E8F0': '#334155',
    '#CBD5E1': '#475569',
    '#94A3B8': '#64748B',
    '#111': '#FFF'
}

count = 0
for root, _, files in os.walk('frontend/src/admin'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            # Standard exact replacements
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
                
            # Now fix buttons or colored elements that need white text.
            # Look for style strings that contain both #E11D48 and #0F172A
            # Actually, look for backgroundColor: '#E11D48' and color: '#0F172A'
            def fix_button_text(match):
                s = match.group(0)
                # If background is a solid color like crimson, red, green, gradient, etc.
                if re.search(r'background(?:Color)?:\s*\'(?:#E11D48|#BE123C|#10B981|#EF4444|#F59E0B|#064E3B|#78350F|#4C1D95)\'', s) or 'linear-gradient' in s:
                    s = s.replace('#0F172A', '#FFFFFF')
                # But wait, what if the color was meant to be the solid color, and it's a border button?
                # Usually solid buttons have color: '#0F172A' (formerly #FFFFFF)
                # Let's just blindly restore '#FFFFFF' if it's a solid background.
                return s

            new_content = re.sub(r'style={{[^}]+}}', fix_button_text, new_content)

            # Special cases for AdminLayout dark mode toggles if they were inverted.
            # Example: darkMode ? '#FAF6EE' : '#F1F5F9'
            # Let's just force the beige theme on both or remove darkMode logic.
            # But the user said "dont change other than that", so maybe let's leave darkMode logic alone but both sides are light.
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f'Updated {path}')

print(f'Total files updated: {count}')

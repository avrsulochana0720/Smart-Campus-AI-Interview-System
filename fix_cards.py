import os
import re

count = 0
for root, _, files in os.walk('frontend/src/admin'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            def replace_card_bg(match):
                style_str = match.group(0)
                style_str = style_str.replace("backgroundColor: '#0F172A'", "backgroundColor: '#E11D48', color: '#FFFFFF'")
                style_str = re.sub(r",\s*color:\s*'#0F172A'", "", style_str)
                style_str = style_str.replace("#334155", "#BE123C")
                return style_str

            new_content = re.sub(r'style={{[^}]*backgroundColor:\s*\'#0F172A\'[^}]*}}', replace_card_bg, content)

            if file == 'AdminOverview.tsx':
                new_content = new_content.replace("color: '#0F172A', fontWeight: 700", "color: '#FFFFFF', fontWeight: 700")

            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f'Updated {path}')

print(f'Total files updated: {count}')

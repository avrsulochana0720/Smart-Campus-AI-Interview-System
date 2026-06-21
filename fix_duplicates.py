import os
import re

count = 0
for root, _, files in os.walk('frontend/src/admin'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Fix Duplicate key "color"
            # It looks like: style={{ backgroundColor: '#E11D48', color: '#FFFFFF', ... color: '#something' ... }}
            # We want to remove the later color declaration so it stays #FFFFFF
            
            def fix_duplicate_color(match):
                s = match.group(0)
                # s contains "style={{ ... backgroundColor: '#E11D48', color: '#FFFFFF' ... color: '#HEX' ... }}"
                # We want to strip out any subsequent color declarations inside this style object
                if "color: '#FFFFFF'" in s:
                    # Find and remove any other color declarations
                    s = re.sub(r",\s*color:\s*'#[0-9a-fA-F]+'(?!,\s*color:\s*'#FFFFFF')", "", s)
                    # wait, the regex above will also remove color: '#FFFFFF' if we are not careful
                    # Better approach: remove all color: declarations, then prepend color: '#FFFFFF' next to backgroundColor
                    s = re.sub(r"color:\s*'#[0-9a-fA-F]+'\s*,?\s*", "", s)
                    s = s.replace("backgroundColor: '#E11D48'", "backgroundColor: '#E11D48', color: '#FFFFFF'")
                    
                    # Fix conditional colors like color: dropdownOpen ? '#E11D48' : '#64748B'
                    # Actually those wouldn't have been matched by color: '#HEX' because of the ternary
                return s

            new_content = re.sub(r'style={{[^}]*backgroundColor:\s*\'#E11D48\'[^}]*}}', fix_duplicate_color, content)

            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f'Updated {path}')

print(f'Total files updated: {count}')

with open('frontend/src/admin/pages/InterviewsPage.tsx', 'r') as f:
    text = f.read()

text = text.replace("backgroundColor: '#334155', color: '#0F172A', border: '1px solid #475569'", "backgroundColor: '#FFFFFF', color: '#E11D48', border: '2px solid #E11D48'")

text = text.replace("backgroundColor: '#E11D48', color: '#FFFFFF', border: '1px solid #BE123C', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem'", "backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #E11D48', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem'")

text = text.replace("e.currentTarget.style.backgroundColor = '#0F172A'", "e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.05)'")

text = text.replace("backgroundColor: '#334155', border: '1px solid #475569'", "backgroundColor: '#FFFFFF', border: '2px solid #E11D48'")

text = text.replace("e.currentTarget.style.backgroundColor = '#475569'", "e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'")

text = text.replace("th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B'", "th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF'")

text = text.replace("backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #BE123C'", "backgroundColor: '#FFFFFF', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #E11D48'")

text = text.replace("color: '#64748B', marginBottom: '0.25rem'", "color: '#E11D48', marginBottom: '0.25rem', fontWeight: 600")

text = text.replace("backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1.25rem', borderRadius: '0.5rem', fontSize: '0.85rem', lineHeight: 1.6, border: '1px solid #BE123C'", "backgroundColor: '#FFFFFF', color: '#0F172A', padding: '1.25rem', borderRadius: '0.5rem', fontSize: '0.85rem', lineHeight: 1.6, border: '2px solid #E11D48'")

text = text.replace('<Search size={16} color="#64748B"', '<Search size={16} color="#E11D48"')

text = text.replace("backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B'", "backgroundColor: 'rgba(225, 29, 72, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E11D48'")

# Toolbar styling tweak
text = text.replace("border: '1px solid #334155'", "border: '2px solid #0F172A'")
text = text.replace("borderBottom: '1px solid #334155'", "borderBottom: '1px solid #E2E8F0'")

with open('frontend/src/admin/pages/InterviewsPage.tsx', 'w') as f:
    f.write(text)

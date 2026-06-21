with open('frontend/src/admin/AdminOverview.tsx', 'r') as f:
    text = f.read()

text = text.replace('#64748B', '#1E293B')
text = text.replace('#475569', '#0F172A')
text = text.replace('#334155', '#0F172A')
text = text.replace('1px solid #E2E8F0', '2px solid #0F172A')
text = text.replace("border: 'none'", "border: '2px solid #0F172A'")
text = text.replace('fontWeight: 500', 'fontWeight: 700')
text = text.replace('fontWeight: 600', 'fontWeight: 800')

with open('frontend/src/admin/AdminOverview.tsx', 'w') as f:
    f.write(text)

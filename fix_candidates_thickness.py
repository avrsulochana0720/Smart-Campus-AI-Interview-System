import re

with open('frontend/src/admin/pages/CandidatesPage.tsx', 'r') as f:
    text = f.read()

# Make the page background beige if it isn't already
text = text.replace("backgroundColor: '#FFFFFF'", "backgroundColor: '#FAF6EE'")
text = text.replace("backgroundColor: '#F8FAFC'", "backgroundColor: '#FAF6EE'")
text = text.replace("backgroundColor: '#F1F5F9'", "backgroundColor: '#FAF6EE'")

# Thicken text colors
text = text.replace("color: '#64748B'", "color: '#1E293B'")
text = text.replace("color: '#475569'", "color: '#0F172A'")
text = text.replace("color: '#334155'", "color: '#0F172A'")

# Thick borders
text = text.replace("1px solid #334155", "2px solid #0F172A")
text = text.replace("1px solid #E2E8F0", "2px solid #0F172A")
text = text.replace("1px solid #475569", "2px solid #0F172A")
text = text.replace("1px solid #F1F5F9", "2px solid #0F172A")
text = text.replace("1px solid #BE123C", "2px solid #BE123C")

# We previously had modified some button logic in CandidatesPage.tsx for Active states.
# We should ensure those border strings are updated if they were 2px solid #E2E8F0 -> 2px solid #0F172A.
text = text.replace("2px solid #E2E8F0", "2px solid #0F172A")

# Increase font weights
text = text.replace("fontWeight: 500", "fontWeight: 700")
text = text.replace("fontWeight: 600", "fontWeight: 800")

# Ensure candidate modal (if any) looks right
# The table header needs dark color and thick bottom border
text = re.sub(r"borderBottom: '1px solid #[A-F0-9]+'", "borderBottom: '2px solid #0F172A'", text)

# Write back
with open('frontend/src/admin/pages/CandidatesPage.tsx', 'w') as f:
    f.write(text)

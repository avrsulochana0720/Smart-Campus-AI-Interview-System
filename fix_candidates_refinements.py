with open('frontend/src/admin/pages/CandidatesPage.tsx', 'r') as f:
    text = f.read()

# 1. Update export CSV button style:
text = text.replace(
    "style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#334155', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}",
    "style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}"
)

# 2. Update search bar input & search icon color:
text = text.replace(
    'Search size={16} color="#64748B"',
    'Search size={16} color="#E11D48"'
)
text = text.replace(
    "style={{ width: '100%', backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #BE123C', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', fontSize: '0.85rem', outline: 'none' }}",
    "style={{ width: '100%', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}"
)

# 3. Update table headers `color: '#1E293B'` to `color: '#FFFFFF'` (since header background is crimson #E11D48)
text = text.replace(
    "<thead style={{ backgroundColor: '#E11D48', color: '#FFFFFF', borderBottom: '2px solid #BE123C' }}>\n            <tr>\n              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate Info</th>\n              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applied Role</th>\n              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Score</th>\n              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>\n              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>\n            </tr>\n          </thead>",
    "<thead style={{ backgroundColor: '#E11D48', color: '#FFFFFF', borderBottom: '2px solid #BE123C' }}>\n            <tr>\n              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate Info</th>\n              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applied Role</th>\n              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Score</th>\n              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>\n              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>\n            </tr>\n          </thead>"
)

# 4. Fix row hover effect and avatar background:
text = text.replace(
    "onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0F172A'}",
    "onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.05)'}"
)
text = text.replace(
    "backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E293B'",
    "backgroundColor: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF'"
)

# 5. Fix candidate item actions dropdown menu styling:
text = text.replace(
    "backgroundColor: '#334155', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.25rem', zIndex: 10, minWidth: '120px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'",
    "backgroundColor: '#FAF6EE', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.25rem', zIndex: 10, minWidth: '120px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'"
)
text = text.replace(
    "onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}",
    "onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}"
)

# 6. Fix profile modal close button font weight:
text = text.replace(
    "<button onClick={() => setSelectedCandidate(null)} style={{ background: 'transparent', border: 'none', color: '#1E293B', cursor: 'pointer' }}>Close</button>",
    "<button onClick={() => setSelectedCandidate(null)} style={{ background: 'transparent', border: 'none', color: '#0F172A', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}>Close</button>"
)

# 7. Fix information cards inside the profile modal:
# We replace the styling of detail cards to be beige with black borders and black text.
# Let's replace the whole grid contents to make them clean:
modal_old_content = """            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#0F172A', fontSize: '0.9rem' }}>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Full Name</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.name}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Candidate ID</div>
                  <div style={{ fontWeight: 800 }}>#{selectedCandidate.id}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C', gridColumn: '1 / -1' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Email Address</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.email}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Applied Role</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.job_role || 'General'}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Department</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.department || 'Unassigned'}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>AI Status</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.interview_status}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Overall Score</div>
                  <div style={{ fontWeight: 800, color: getScoreColor(selectedCandidate.overall_score || 0) }}>
                      {selectedCandidate.overall_score || 'Pending'}
                  </div>
              </div>
            </div>"""

modal_new_content = """            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#0F172A', fontSize: '0.9rem' }}>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Full Name</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.name}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Candidate ID</div>
                  <div style={{ fontWeight: 800 }}>#{selectedCandidate.id}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A', gridColumn: '1 / -1' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Email Address</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.email}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Applied Role</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.job_role || 'General'}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Department</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.department || 'Unassigned'}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>AI Status</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.interview_status}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Overall Score</div>
                  <div style={{ fontWeight: 800, color: getScoreColor(selectedCandidate.overall_score || 0) }}>
                      {selectedCandidate.overall_score || 'Pending'}
                  </div>
              </div>
            </div>"""

text = text.replace(modal_old_content, modal_new_content)

with open('frontend/src/admin/pages/CandidatesPage.tsx', 'w') as f:
    f.write(text)

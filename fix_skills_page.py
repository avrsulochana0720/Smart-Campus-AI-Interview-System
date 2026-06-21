with open('frontend/src/admin/pages/SkillInsightsPage.tsx', 'r') as f:
    text = f.read()

new_return_block = """  if (loading) return <div style={{ color: '#0F172A', padding: '2rem', fontWeight: 800 }}>Loading insights...</div>;
  if (!data) return <div style={{ color: '#0F172A', padding: '2rem', fontWeight: 800 }}>Failed to load insights.</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Skill Insights</h2>
          <p style={{ fontSize: '0.85rem', color: '#1E293B', margin: '0.25rem 0 0 0' }}>Analyze trending skills, map campus competencies, and identify curriculum gaps.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Trending Up */}
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18} color="#22C55E"/> Surging Skills (Top 3)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(data.surging || []).map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#FFFFFF', border: '2px solid #0F172A', borderRadius: '0.5rem', borderLeft: `6px solid ${s.color}` }}>
                <span style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 800 }}>{s.skill}</span>
                <span style={{ fontSize: '0.85rem', color: '#22C55E', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><TrendingUp size={12}/> {s.growth}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gaps */}
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={18} color="#E11D48"/> Critical Skill Gaps</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(data.gaps || []).map((s: any, i: number) => (
              <div key={i} style={{ padding: '1rem', backgroundColor: '#FFFFFF', color: '#0F172A', borderRadius: '0.5rem', border: '2px solid #0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 800 }}>{s.skill}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', backgroundColor: s.gap === 'High' ? 'rgba(225, 29, 72, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: s.gap === 'High' ? '#E11D48' : '#F59E0B', fontWeight: 800 }}>{s.gap} Gap</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Zap size={12} color="#E11D48"/> {s.recommendation}</div>
                </div>
                <button onClick={() => setSelectedGap(s)} style={{ backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #E11D48', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.2)' }}>
                  Take Action
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Layers size={18} color="#E11D48"/> Overall Campus Competency Distribution</h3>
        <p style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 700, marginBottom: '1.5rem' }}>Based on AI evaluated interview transcripts across all departments.</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {(data.competency || []).map((tag: any, i: number) => (
            <button key={i} onClick={() => setSelectedSkill(tag)} style={{ fontSize: tag.size, fontWeight: tag.weight === 'bold' ? 800 : 600, color: '#0F172A', padding: '0.5rem 1rem', backgroundColor: '#FFFFFF', borderRadius: '0.5rem', border: '2px solid #0F172A', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.05)'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.transform = 'scale(1)'; }}>
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Action Gap Modal */}
      {selectedGap && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>Address Skill Gap</h2>
              <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', backgroundColor: selectedGap.gap === 'High' ? 'rgba(225, 29, 72, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: selectedGap.gap === 'High' ? '#E11D48' : '#F59E0B', fontSize: '0.8rem', fontWeight: 800 }}>{selectedGap.gap} Severity</span>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#1E293B', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Target Skill</label>
              <div style={{ color: '#0F172A', fontSize: '1.25rem', fontWeight: 800 }}>{selectedGap.skill}</div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#E11D48', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                <Zap size={16} /> Recommended Action Strategy
              </div>
              <p style={{ color: '#1E293B', fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.5, margin: 0 }}>
                Based on AI analysis, we recommend launching a specialized training curriculum for <strong>{selectedGap.skill}</strong>. This addresses the <strong>{selectedGap.recommendation.toLowerCase()}</strong> requirement flagged by current industry trends.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setSelectedGap(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid #0F172A', color: '#0F172A', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                showToast(`New curriculum pathway generated for ${selectedGap.skill}!`, 'success');
                setSelectedGap(null);
              }} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #E11D48', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Generate Curriculum</button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Deep Dive Modal */}
      {selectedSkill && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '450px', maxWidth: '90%', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: `${selectedSkill.color}20`, border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <Layers size={32} color={selectedSkill.color} />
            </div>
            
            <h2 style={{ fontSize: '1.75rem', color: '#0F172A', margin: '0 0 0.5rem 0', fontWeight: 800 }}>{selectedSkill.name}</h2>
            <p style={{ color: '#1E293B', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 2rem 0', lineHeight: 1.5 }}>
              This skill has been identified as a <strong>{selectedSkill.weight === 'bold' ? 'Core Competency' : 'Developing Competency'}</strong> across recent AI interviews.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
              <div style={{ backgroundColor: '#FFFFFF', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                <div style={{ fontSize: '0.75rem', color: '#1E293B', fontWeight: 700, marginBottom: '0.25rem' }}>Campus Saturation</div>
                <div style={{ color: selectedSkill.color, fontSize: '1.25rem', fontWeight: 800 }}>{Math.floor(Math.random() * 40) + 40}%</div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                <div style={{ fontSize: '0.75rem', color: '#1E293B', fontWeight: 700, marginBottom: '0.25rem' }}>Industry Demand</div>
                <div style={{ color: '#22C55E', fontSize: '1.25rem', fontWeight: 800 }}>Very High</div>
              </div>
            </div>

            <button onClick={() => setSelectedSkill(null)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', border: '2px solid #0F172A', color: '#0F172A', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 800 }}>Close Insights</button>
          </div>
        </div>
      )}
    </div>
  );"""

start_idx = text.find("if (loading)")
if start_idx != -1:
    text = text[:start_idx] + new_return_block + "\\n}"

with open('frontend/src/admin/pages/SkillInsightsPage.tsx', 'w') as f:
    f.write(text)

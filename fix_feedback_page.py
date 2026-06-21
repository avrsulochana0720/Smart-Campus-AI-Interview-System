with open('frontend/src/admin/pages/FeedbackInsightsPage.tsx', 'r') as f:
    text = f.read()

new_return_block = """  if (loading) return <div style={{ color: '#0F172A', padding: '2rem', fontWeight: 800 }}>Loading insights...</div>;
  if (!data) return <div style={{ color: '#0F172A', padding: '2rem', fontWeight: 800 }}>Failed to load insights.</div>;

  const totalReal = data.positive + data.neutral + data.negative;
  const total = totalReal || 1;
  const posPct = Math.round((data.positive / total) * 100);
  const neuPct = Math.round((data.neutral / total) * 100);
  const negPct = Math.round((data.negative / total) * 100);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Candidate Feedback Insights</h2>
          <p style={{ fontSize: '0.85rem', color: '#1E293B', margin: '0.25rem 0 0 0' }}>Sentiment analysis on the AI interview experience based on post-interview surveys.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Overall Sentiment */}
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Smile size={40} color="#22C55E" />
          </div>
          <h3 style={{ fontSize: '3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>{totalReal > 0 ? posPct : 0}%</h3>
          <p style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 700, marginTop: '0.5rem', marginBottom: 0 }}>Positive Sentiment</p>
          <p style={{ fontSize: '0.75rem', color: '#1E293B', fontWeight: 700, marginTop: '0.25rem', marginBottom: 0 }}>Based on {totalReal} total responses</p>
        </div>

        {/* Breakdown */}
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1.5rem 0' }}>Sentiment Breakdown</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#22C55E', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}><ThumbsUp size={14}/> Positive ({data.positive})</span>
              <span style={{ color: '#0F172A', fontWeight: 800 }}>{totalReal > 0 ? posPct : 0}%</span>
            </div>
            <div style={{ width: '100%', height: '12px', backgroundColor: '#FFFFFF', border: '2px solid #0F172A', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${posPct}%`, height: '100%', backgroundColor: '#22C55E' }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}><Minus size={14}/> Neutral ({data.neutral})</span>
              <span style={{ color: '#0F172A', fontWeight: 800 }}>{totalReal > 0 ? neuPct : 0}%</span>
            </div>
            <div style={{ width: '100%', height: '12px', backgroundColor: '#FFFFFF', border: '2px solid #0F172A', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${neuPct}%`, height: '100%', backgroundColor: '#0F172A' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}><ThumbsDown size={14}/> Negative ({data.negative})</span>
              <span style={{ color: '#0F172A', fontWeight: 800 }}>{totalReal > 0 ? negPct : 0}%</span>
            </div>
            <div style={{ width: '100%', height: '12px', backgroundColor: '#FFFFFF', border: '2px solid #0F172A', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${negPct}%`, height: '100%', backgroundColor: '#EF4444' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Comments */}
      <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={18} color="#E11D48"/> Recent Feedback Comments</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(data.comments || []).map((comment: any, i: number) => (
            <div key={i} style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '0.5rem', border: '2px solid #0F172A', borderLeft: `6px solid ${comment.color}` }}>
              <span style={{ fontSize: '0.7rem', color: comment.color === '#E11D48' ? '#E11D48' : comment.color === '#EF4444' ? '#EF4444' : '#0F172A', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'inline-block' }}>{comment.tag}</span>
              <p style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>"{comment.text}"</p>
            </div>
          ))}
          {(!data.comments || data.comments.length === 0) && (
            <div style={{ fontSize: '0.85rem', padding: '1rem', textAlign: 'center', backgroundColor: '#FAF6EE', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 800 }}>
              No feedback submitted by users yet. Wait for candidates to submit feedback from their dashboard.
            </div>
          )}
        </div>
      </div>
    </div>
  );"""

start_idx = text.find("if (loading)")
if start_idx != -1:
    text = text[:start_idx] + new_return_block + "\n}"

with open('frontend/src/admin/pages/FeedbackInsightsPage.tsx', 'w') as f:
    f.write(text)

import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, Smile } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function FeedbackInsightsPage() {
  const { showToast } = useToast();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getFeedbackInsights().then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: '#64748B', padding: '2rem' }}>Loading insights...</div>;
  if (!data) return <div style={{ color: '#64748B', padding: '2rem' }}>Failed to load insights.</div>;

  const totalReal = data.positive + data.neutral + data.negative;
  const total = totalReal || 1;
  const posPct = Math.round((data.positive / total) * 100);
  const neuPct = Math.round((data.neutral / total) * 100);
  const negPct = Math.round((data.negative / total) * 100);
  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Candidate Feedback Insights</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Sentiment analysis on the AI interview experience based on post-interview surveys.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Overall Sentiment */}
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '1px solid #334155', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Smile size={40} color="#22C55E" />
          </div>
          <h3 style={{ fontSize: '3rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{totalReal > 0 ? posPct : 0}%</h3>
          <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '0.5rem' }}>Positive Sentiment</p>
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Based on {totalReal} total responses</p>
        </div>

        {/* Breakdown */}
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '1px solid #334155', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A', margin: '0 0 1.5rem 0' }}>Sentiment Breakdown</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#22C55E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ThumbsUp size={14}/> Positive ({data.positive})</span>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>{totalReal > 0 ? posPct : 0}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px' }}><div style={{ width: `${posPct}%`, height: '100%', backgroundColor: '#22C55E', borderRadius: '4px' }}></div></div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Minus size={14}/> Neutral ({data.neutral})</span>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>{totalReal > 0 ? neuPct : 0}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px' }}><div style={{ width: `${neuPct}%`, height: '100%', backgroundColor: '#64748B', borderRadius: '4px' }}></div></div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ThumbsDown size={14}/> Negative ({data.negative})</span>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>{totalReal > 0 ? negPct : 0}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px' }}><div style={{ width: `${negPct}%`, height: '100%', backgroundColor: '#EF4444', borderRadius: '4px' }}></div></div>
          </div>
        </div>
      </div>

      {/* Recent Comments */}
      <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '1px solid #334155', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={18} color="#E11D48"/> Recent Feedback Comments</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(data.comments || []).map((comment: any, i: number) => (
            <div key={i} style={{ padding: '1rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', borderLeft: `3px solid ${comment.color}` }}>
              <span style={{ fontSize: '0.7rem', color: comment.color, fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'inline-block' }}>{comment.tag}</span>
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>"{comment.text}"</p>
            </div>
          ))}
          {(!data.comments || data.comments.length === 0) && (
            <div style={{ color: '#64748B', fontSize: '0.85rem', padding: '1rem', textAlign: 'center', backgroundColor: '#0F172A', borderRadius: '0.5rem' }}>
              No feedback submitted by users yet. Wait for candidates to submit feedback from their dashboard.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

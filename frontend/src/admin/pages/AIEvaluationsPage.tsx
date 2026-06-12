import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Search, BrainCircuit, AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function AIEvaluationsPage() {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    adminAPI.getAIEvaluations().then(res => {
      setLogs(res || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>AI Evaluations Logs</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Monitor AI grading engine, review flagged sessions, and override confidence scores.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#FAF6EE', border: '1px solid #334155', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: 'rgba(225, 29, 72, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BrainCircuit size={24} color="#E11D48"/></div>
          <div><div style={{ fontSize: '0.85rem', color: '#64748B' }}>Avg Confidence</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{logs.length > 0 ? Math.round(logs.reduce((acc, curr) => acc + curr.confidence, 0) / logs.length) : 0}%</div></div>
        </div>
        <div style={{ backgroundColor: '#FAF6EE', border: '1px solid #334155', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={24} color="#F59E0B"/></div>
          <div><div style={{ fontSize: '0.85rem', color: '#64748B' }}>Flagged Sessions</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{logs.filter(l => l.flag).length}</div></div>
        </div>
        <div style={{ backgroundColor: '#FAF6EE', border: '1px solid #334155', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={24} color="#22C55E"/></div>
          <div><div style={{ fontSize: '0.85rem', color: '#64748B' }}>Auto-Graded</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{logs.filter(l => !l.flag).length}</div></div>
        </div>
      </div>

      <div style={{ backgroundColor: '#FAF6EE', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#0F172A', borderBottom: '1px solid #334155' }}>
            <tr>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Session ID</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Candidate</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>AI Confidence</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Flags / Alerts</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading logs...</td></tr>
            ) : logs.filter(l => (l.candidate || '').toLowerCase().includes(searchTerm.toLowerCase())).map((log, idx) => (
              <tr key={idx} style={{ borderBottom: idx === logs.length - 1 ? 'none' : '1px solid #334155' }}>
                <td style={{ padding: '1rem', color: '#E11D48', fontSize: '0.85rem', fontWeight: 500 }}>{log.id}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#0F172A' }}>{log.candidate}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={10}/> {log.time}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: log.confidence > 90 ? '#22C55E' : '#F59E0B' }}>{log.confidence}%</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {log.flag ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', fontSize: '0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', width: 'max-content' }}>
                      <ShieldAlert size={14} /> {log.flag}
                    </span>
                  ) : (
                    <span style={{ color: '#64748B', fontSize: '0.8rem' }}>None</span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  {log.status === 'Review Required' ? (
                    <button onClick={() => setSelectedLog(log)} style={{ backgroundColor: '#F59E0B', color: '#000', border: 'none', borderRadius: '0.25rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Manual Review</button>
                  ) : (
                    <button onClick={() => setSelectedLog(log)} style={{ backgroundColor: 'transparent', color: '#64748B', border: '1px solid #475569', borderRadius: '0.25rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}>View Details</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #334155', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: '0 0 0.25rem 0' }}>Evaluation Details</h2>
                <div style={{ color: '#E11D48', fontSize: '0.85rem' }}>{selectedLog.id}</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: selectedLog.confidence > 90 ? '#22C55E' : '#F59E0B' }}>
                {selectedLog.confidence}%
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem', backgroundColor: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Candidate</div>
                  <div style={{ color: '#334155', fontSize: '0.9rem' }}>{selectedLog.candidate}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Time Logged</div>
                  <div style={{ color: '#334155', fontSize: '0.9rem' }}>{selectedLog.time}</div>
                </div>
              </div>
            </div>

            {selectedLog.flag && (
              <div style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#EF4444', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldAlert size={14} /> System Flag
                </div>
                <div style={{ color: '#FCA5A5', fontSize: '0.9rem' }}>{selectedLog.flag}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setSelectedLog(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #475569', color: '#64748B', borderRadius: '0.5rem', cursor: 'pointer' }}>Close Details</button>
              {selectedLog.status === 'Review Required' && (
                <button onClick={() => {
                  showToast('Override accepted.', 'success');
                  setLogs(logs.map(l => l.id === selectedLog.id ? {...l, status: 'Completed', flag: null} : l));
                  setSelectedLog(null);
                }} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#22C55E', border: 'none', color: '#0F172A', borderRadius: '0.5rem', cursor: 'pointer' }}>
                  Override & Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

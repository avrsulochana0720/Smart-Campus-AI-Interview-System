import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Server, Activity, Database, Cpu, Wifi, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function SystemMonitoringPage() {
  const { showToast } = useToast();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getSystemMonitoring().then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: '#64748B', padding: '2rem' }}>Loading system metrics...</div>;
  if (!data) return <div style={{ color: '#64748B', padding: '2rem' }}>Failed to load system metrics.</div>;
  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>System Monitoring</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Real-time server health, API latency, and WebSocket connection status.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', animation: 'pulse 2s infinite' }}></span>
          All Systems Operational
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#0D1322', borderRadius: '1rem', border: '1px solid #1E293B', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.75rem' }}><Server size={16}/> Server Uptime</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#FFFFFF' }}>{data.metrics?.uptime || 'N/A'}</div>
          <div style={{ fontSize: '0.75rem', color: '#22C55E', marginTop: '0.25rem' }}>System Operational</div>
        </div>
        <div style={{ backgroundColor: '#0D1322', borderRadius: '1rem', border: '1px solid #1E293B', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.75rem' }}><Activity size={16}/> API Latency</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#FFFFFF' }}>{data.metrics?.latency || '0ms'}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Global Average</div>
        </div>
        <div style={{ backgroundColor: '#0D1322', borderRadius: '1rem', border: '1px solid #1E293B', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.75rem' }}><Wifi size={16}/> Active WebSockets</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#FFFFFF' }}>{data.metrics?.activeWebSockets || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#E11D48', marginTop: '0.25rem' }}>Live Streams</div>
        </div>
        <div style={{ backgroundColor: '#0D1322', borderRadius: '1rem', border: '1px solid #1E293B', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.75rem' }}><Cpu size={16}/> CPU Usage</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#FFFFFF' }}>{data.metrics?.cpuUsage || '0%'}</div>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#1E293B', borderRadius: '2px', marginTop: '0.5rem' }}>
            <div style={{ width: data.metrics?.cpuUsage || '0%', height: '100%', backgroundColor: '#22C55E', borderRadius: '2px' }}></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#0D1322', borderRadius: '1rem', border: '1px solid #1E293B', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={18} color="#E11D48"/> Services Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(data.services || []).map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i === (data.services?.length || 1) - 1 ? 'none' : '1px solid #1E293B', paddingBottom: i === (data.services?.length || 1) - 1 ? 0 : '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.status === 'Operational' ? '#22C55E' : '#EF4444' }}></div>
                  <span style={{ fontSize: '0.9rem', color: '#E2E8F0', fontWeight: 500 }}>{s.service}</span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#64748B' }}>
                  <span>{s.status}</span>
                  <span style={{ width: '40px', textAlign: 'right' }}>{s.ping}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#0D1322', borderRadius: '1rem', border: '1px solid #1E293B', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} color="#EF4444"/> Recent Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(data.alerts || []).map((alert: any, i: number) => {
              const color = alert.level === 'warning' ? '#F59E0B' : (alert.level === 'error' ? '#EF4444' : '#E11D48');
              const bgColor = alert.level === 'warning' ? 'rgba(245, 158, 11, 0.05)' : (alert.level === 'error' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(225, 29, 72, 0.05)');
              return (
                <div key={i} style={{ padding: '1rem', backgroundColor: bgColor, borderRadius: '0.5rem', borderLeft: `3px solid ${color}` }}>
                  <div style={{ fontSize: '0.85rem', color: color, fontWeight: 600, marginBottom: '0.25rem' }}>{alert.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{alert.desc} ({alert.time})</div>
                </div>
              );
            })}
            {(!data.alerts || data.alerts.length === 0) && (
              <div style={{ color: '#64748B', fontSize: '0.85rem' }}>No recent alerts.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

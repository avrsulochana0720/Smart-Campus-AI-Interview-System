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

  if (loading) return <div style={{ color: '#0F172A', fontWeight: 800, padding: '2rem' }}>Loading system metrics...</div>;
  if (!data) return <div style={{ color: '#EF4444', fontWeight: 800, padding: '2rem' }}>Failed to load system metrics.</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>System Monitoring</h2>
          <p style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 600, margin: '0.25rem 0 0 0' }}>Real-time server health, API latency, and WebSocket connection status.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22C55E', color: '#FFFFFF', border: '2px solid #0F172A', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 800 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFFFFF', animation: 'pulse 2s infinite' }}></span>
          All Systems Operational
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.75rem' }}><Server size={16} color="#E11D48"/> Server Uptime</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>{data.metrics?.uptime || 'N/A'}</div>
          <div style={{ fontSize: '0.75rem', color: '#22C55E', fontWeight: 800, marginTop: '0.25rem' }}>System Operational</div>
        </div>
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.75rem' }}><Activity size={16} color="#E11D48"/> API Latency</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>{data.metrics?.latency || '0ms'}</div>
          <div style={{ fontSize: '0.75rem', color: '#1E293B', fontWeight: 600, marginTop: '0.25rem' }}>Global Average</div>
        </div>
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.75rem' }}><Wifi size={16} color="#E11D48"/> Active WebSockets</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>{data.metrics?.activeWebSockets || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#E11D48', fontWeight: 800, marginTop: '0.25rem' }}>Live Streams</div>
        </div>
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.75rem' }}><Cpu size={16} color="#E11D48"/> CPU Usage</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>{data.metrics?.cpuUsage || '0%'}</div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#FAF6EE', border: '2px solid #0F172A', borderRadius: '4px', marginTop: '0.5rem' }}>
            <div style={{ width: data.metrics?.cpuUsage || '0%', height: '100%', backgroundColor: '#E11D48', borderRadius: '2px' }}></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={18} color="#E11D48"/> Services Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(data.services || []).map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i === (data.services?.length || 1) - 1 ? 'none' : '2px solid #0F172A', paddingBottom: i === (data.services?.length || 1) - 1 ? 0 : '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1px solid #0F172A', backgroundColor: s.status === 'Operational' ? '#22C55E' : '#EF4444' }}></div>
                  <span style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 800 }}>{s.service}</span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#1E293B', fontWeight: 700 }}>
                  <span>{s.status}</span>
                  <span style={{ width: '40px', textAlign: 'right' }}>{s.ping}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} color="#EF4444"/> Recent Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(data.alerts || []).map((alert: any, i: number) => {
              const color = alert.level === 'warning' ? '#F59E0B' : (alert.level === 'error' ? '#EF4444' : '#E11D48');
              return (
                <div key={i} style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '0.5rem', border: '2px solid #0F172A', borderLeft: `6px solid ${color}` }}>
                  <div style={{ fontSize: '0.85rem', color: color, fontWeight: 800, marginBottom: '0.25rem' }}>{alert.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 600 }}>{alert.desc} ({alert.time})</div>
                </div>
              );
            })}
            {(!data.alerts || data.alerts.length === 0) && (
              <div style={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem' }}>No recent alerts.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

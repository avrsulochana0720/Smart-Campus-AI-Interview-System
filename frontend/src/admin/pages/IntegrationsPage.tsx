import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Link, Search, Settings, ExternalLink, ShieldCheck } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function IntegrationsPage() {
  const { showToast } = useToast();

  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [configureApp, setConfigureApp] = useState<any>(null);
  const [actionApp, setActionApp] = useState<any>(null);

  const handleToggleStatus = (app: any) => {
    const newStatus = app.status === 'Connected' ? 'Not Connected' : 'Connected';
    setIntegrations(integrations.map((i: any) => i.name === app.name ? { ...i, status: newStatus } : i));
    showToast(`${app.name} has been successfully ${newStatus.toLowerCase()}.`, 'success');
    setActionApp(null);
  };

  useEffect(() => {
    adminAPI.getIntegrations().then(res => {
      setIntegrations(res || []);
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Integrations Hub</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Connect the AI Interview platform with your ATS, LMS, and communication tools.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ color: '#64748B' }}>Loading integrations...</div>
        ) : integrations.map((app, i) => (
          <div key={i} style={{ backgroundColor: '#0D1322', borderRadius: '1rem', border: '1px solid #1E293B', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', backgroundColor: '#FFFFFF', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: app.status === 'Connected' ? '#22C55E' : '#64748B', backgroundColor: app.status === 'Connected' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                {app.status === 'Connected' && <ShieldCheck size={12} />}
                {app.status}
              </div>
            </div>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>{app.name}</h3>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '0 0 1.5rem 0', lineHeight: 1.5, flex: 1 }}>{app.desc}</p>
            
            <div style={{ borderTop: '1px solid #1E293B', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setConfigureApp(app)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.2rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3B82F6'} onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}><Settings size={14}/> Configure</button>
              {app.status === 'Not Connected' ? (
                <button onClick={() => setActionApp(app)} style={{ backgroundColor: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}>Connect</button>
              ) : (
                <button onClick={() => setActionApp(app)} style={{ backgroundColor: 'transparent', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Disconnect</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Configure Modal */}
      {configureApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#0D1322', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #1E293B', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={configureApp.icon} alt={configureApp.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', color: '#FFF', margin: 0 }}>Configure {configureApp.name}</h2>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>API Endpoint URL</label>
              <input type="text" defaultValue={`https://api.${configureApp.name.toLowerCase().replace(' ', '')}.com/v1/sync`} style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.75rem', color: '#FFF', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Access Token / Secret Key</label>
              <input type="password" placeholder="Enter your secret key" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.75rem', color: '#FFF', outline: 'none' }} />
            </div>
            
            <div style={{ backgroundColor: '#111827', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #1E293B', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 500 }}>Auto-Sync Data</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Automatically push interview results</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#3B82F6', transition: '.4s', borderRadius: '24px' }}>
                  <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '20px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setConfigureApp(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #334155', color: '#94A3B8', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                showToast(`Configuration saved for ${configureApp.name}`, 'success');
                setConfigureApp(null);
              }} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#3B82F6', border: 'none', color: '#FFF', borderRadius: '0.5rem', cursor: 'pointer' }}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}

      {/* Action (Connect/Disconnect) Modal */}
      {actionApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#0D1322', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #1E293B', width: '400px', maxWidth: '90%', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '1rem', backgroundColor: '#FFFFFF', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <img src={actionApp.icon} alt={actionApp.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            
            <h2 style={{ fontSize: '1.25rem', color: '#FFF', margin: '0 0 1rem 0' }}>
              {actionApp.status === 'Connected' ? `Disconnect ${actionApp.name}?` : `Connect to ${actionApp.name}?`}
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              {actionApp.status === 'Connected' 
                ? `Are you sure you want to revoke access? This will pause all automated workflows between Smart Campus and ${actionApp.name}.` 
                : `You are about to authorize a secure connection with ${actionApp.name}. This integration will follow your configured data-sharing preferences.`}
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setActionApp(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #334155', color: '#94A3B8', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleToggleStatus(actionApp)} style={{ flex: 1, padding: '0.75rem', backgroundColor: actionApp.status === 'Connected' ? '#EF4444' : '#3B82F6', border: 'none', color: '#FFF', borderRadius: '0.5rem', cursor: 'pointer' }}>
                {actionApp.status === 'Connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

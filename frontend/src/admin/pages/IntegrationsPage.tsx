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
  const [autoSync, setAutoSync] = useState(true);

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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Integrations Hub</h2>
          <p style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 600, margin: '0.25rem 0 0 0' }}>Connect the AI Interview platform with your ATS, LMS, and communication tools.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ color: '#0F172A', fontWeight: 800 }}>Loading integrations...</div>
        ) : integrations.map((app, i) => (
          <div key={i} style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', backgroundColor: '#FFFFFF', border: '2px solid #0F172A', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: app.status === 'Connected' ? '#FFFFFF' : '#0F172A', backgroundColor: app.status === 'Connected' ? '#22C55E' : '#FAF6EE', border: '2px solid #0F172A', padding: '0.25rem 0.75rem', borderRadius: '0.5rem' }}>
                {app.status === 'Connected' && <ShieldCheck size={12} />}
                {app.status}
              </div>
            </div>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>{app.name}</h3>
            <p style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 600, margin: '0 0 1.5rem 0', lineHeight: 1.5, flex: 1 }}>{app.desc}</p>
            
            <div style={{ borderTop: '2px solid #0F172A', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setConfigureApp(app)} style={{ background: 'transparent', border: 'none', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, padding: '0.2rem' }}>
                <Settings size={14} color="#E11D48"/> Configure
              </button>
              {app.status === 'Not Connected' ? (
                <button onClick={() => setActionApp(app)} style={{ backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Connect</button>
              ) : (
                <button onClick={() => setActionApp(app)} style={{ backgroundColor: '#FAF6EE', color: '#EF4444', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Disconnect</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Configure Modal */}
      {configureApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#FFFFFF', border: '2px solid #0F172A', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={configureApp.icon} alt={configureApp.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', color: '#0F172A', fontWeight: 800, margin: 0 }}>Configure {configureApp.name}</h2>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>API Endpoint URL</label>
              <input type="text" defaultValue={`https://api.${configureApp.name.toLowerCase().replace(' ', '')}.com/v1/sync`} style={{ width: '100%', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.75rem', fontWeight: 600, outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Access Token / Secret Key</label>
              <input type="password" placeholder="Enter your secret key" style={{ width: '100%', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.75rem', fontWeight: 600, outline: 'none' }} />
            </div>
            
            <div style={{ backgroundColor: '#FFFFFF', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 800 }}>Auto-Sync Data</div>
                <div style={{ fontSize: '0.75rem', color: '#1E293B', fontWeight: 600 }}>Automatically push interview results</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '28px' }}>
                <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: autoSync ? '#E11D48' : '#FAF6EE', border: '2px solid #0F172A', transition: '.4s', borderRadius: '28px' }}>
                  <span style={{ position: 'absolute', height: '16px', width: '16px', left: autoSync ? '24px' : '4px', bottom: '4px', backgroundColor: autoSync ? '#FFFFFF' : '#0F172A', transition: '.4s', borderRadius: '50%' }}></span>
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setConfigureApp(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid #0F172A', color: '#0F172A', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                showToast(`Configuration saved for ${configureApp.name}`, 'success');
                setConfigureApp(null);
              }} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}

      {/* Action (Connect/Disconnect) Modal */}
      {actionApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '400px', maxWidth: '90%', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '1rem', backgroundColor: '#FFFFFF', border: '2px solid #0F172A', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <img src={actionApp.icon} alt={actionApp.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            
            <h2 style={{ fontSize: '1.25rem', color: '#0F172A', fontWeight: 800, margin: '0 0 1rem 0' }}>
              {actionApp.status === 'Connected' ? `Disconnect ${actionApp.name}?` : `Connect to ${actionApp.name}?`}
            </h2>
            <p style={{ color: '#1E293B', fontSize: '0.9rem', fontWeight: 600, marginBottom: '2rem', lineHeight: 1.5 }}>
              {actionApp.status === 'Connected' 
                ? `Are you sure you want to revoke access? This will pause all automated workflows between Smart Campus and ${actionApp.name}.` 
                : `You are about to authorize a secure connection with ${actionApp.name}. This integration will follow your configured data-sharing preferences.`}
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setActionApp(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid #0F172A', color: '#0F172A', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleToggleStatus(actionApp)} style={{ flex: 1, padding: '0.75rem', backgroundColor: actionApp.status === 'Connected' ? '#EF4444' : '#E11D48', border: '2px solid #0F172A', color: '#FFFFFF', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>
                {actionApp.status === 'Connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

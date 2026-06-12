import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Key, Save } from 'lucide-react';
import { useToast } from '../ToastContext';
import { adminAPI } from '../../utils/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    adminAPI.getSettings().then(data => {
      setSettings(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSave = () => {
    adminAPI.updateSettings(settings).then(() => {
      showToast('Settings saved successfully', 'success');
    }).catch(err => {
      console.error(err);
      showToast('Failed to save settings', 'error');
    });
  };

  const handleUploadPic = () => {
    showToast('Image upload functionality is coming soon.', 'info');
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setSettings({ ...settings, [name]: type === 'checkbox' ? checked : value });
  };

  const handleGenerateKey = () => {
    const newKey = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setSettings({ ...settings, api_key: newKey });
    showToast('New API Key generated successfully', 'success');
  };

  if (loading) return <div style={{ color: '#fff', padding: '2rem' }}>Loading settings...</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Settings</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Manage your account settings, preferences, and security configurations.</p>
        </div>
        <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>
          <Save size={16} />
          Save Changes
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        
        {/* Settings Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { name: 'Profile', icon: User },
            { name: 'Security', icon: Shield },
            { name: 'Notifications', icon: Bell },
            { name: 'API Keys', icon: Key }
          ].map((tab) => (
            <div 
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
                backgroundColor: activeTab === tab.name ? '#334155' : 'transparent', 
                color: activeTab === tab.name ? '#0F172A' : '#64748B',
                borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem',
                borderLeft: activeTab === tab.name ? '3px solid #E11D48' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={18} color={activeTab === tab.name ? '#E11D48' : '#64748B'} />
              {tab.name}
            </div>
          ))}
        </div>

        {/* Settings Content */}
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '1px solid #334155', padding: '2rem' }}>
          
          {activeTab === 'Profile' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#0F172A', margin: '0 0 1.5rem 0', fontWeight: 600 }}>Personal Information</h3>
              
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src="https://ui-avatars.com/api/?name=Admin+User&background=3B82F6&color=fff&size=80" alt="Avatar" />
                </div>
                <div>
                  <button onClick={handleUploadPic} style={{ backgroundColor: '#334155', color: '#0F172A', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', marginBottom: '0.5rem' }}>Upload New Picture</button>
                  <p style={{ color: '#64748B', fontSize: '0.75rem', margin: 0 }}>JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#64748B', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>First Name</label>
                  <input name="first_name" value={settings.first_name || 'Admin'} onChange={handleChange} type="text" style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#0F172A', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748B', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Last Name</label>
                  <input name="last_name" value={settings.last_name || 'User'} onChange={handleChange} type="text" style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#0F172A', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', color: '#64748B', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
                  <input name="email" value={settings.email || 'avrsulochana0720@gmail.com'} onChange={handleChange} type="email" style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#0F172A', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', color: '#64748B', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Bio</label>
                  <textarea name="bio" value={settings.bio || 'Super Admin for Smart Campus AI Interview System.'} onChange={handleChange} rows={4} style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#0F172A', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#0F172A', margin: '0 0 1.5rem 0', fontWeight: 600 }}>Security Settings</h3>
              
              <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ color: '#334155', margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 500 }}>Two-Factor Authentication (2FA)</h4>
                    <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>Add an extra layer of security to your account.</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input name="two_factor" type="checkbox" checked={settings.two_factor || false} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settings.two_factor ? '#22C55E' : '#475569', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: settings.two_factor ? '20px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>
              </div>

              <h4 style={{ color: '#334155', margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 500 }}>Change Password</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '400px' }}>
                <div>
                  <label style={{ display: 'block', color: '#64748B', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Current Password</label>
                  <input name="current_password" value={settings.current_password || ''} onChange={handleChange} type="password" style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#0F172A', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748B', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>New Password</label>
                  <input name="new_password" value={settings.new_password || ''} onChange={handleChange} type="password" style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#0F172A', fontSize: '0.9rem', outline: 'none' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#0F172A', margin: '0 0 1.5rem 0', fontWeight: 600 }}>Notification Preferences</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { id: 'notif_candidates', title: 'New Candidates', desc: 'Receive an email when a new candidate completes an interview.' },
                  { id: 'notif_errors', title: 'System Errors', desc: 'Get immediately notified if a proctoring system error occurs.' },
                  { id: 'notif_reports', title: 'Weekly Reports', desc: 'Receive a weekly digest of campus performance analytics.' }
                ].map((notif) => (
                  <div key={notif.id} style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: '#334155', margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 500 }}>{notif.title}</h4>
                      <p style={{ color: '#64748B', fontSize: '0.8rem', margin: 0 }}>{notif.desc}</p>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                      <input name={notif.id} type="checkbox" checked={settings[notif.id] ?? true} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settings[notif.id] ?? true ? '#E11D48' : '#475569', transition: '.4s', borderRadius: '24px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: settings[notif.id] ?? true ? '20px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'API Keys' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#0F172A', margin: '0 0 1.5rem 0', fontWeight: 600 }}>API Configuration</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '2rem' }}>Manage your secret API keys to authenticate with our endpoints programmatically.</p>
              
              <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', padding: '1.5rem' }}>
                <label style={{ display: 'block', color: '#64748B', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Production Secret Key</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={settings.api_key || 'api_key_xxxxxxxxxxxxxxxxxxxxxxxx'} 
                    style={{ flex: 1, backgroundColor: '#FAF6EE', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#10B981', fontFamily: 'monospace', fontSize: '0.9rem', outline: 'none' }} 
                  />
                  <button onClick={handleGenerateKey} style={{ backgroundColor: '#334155', color: '#0F172A', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                    Regenerate Key
                  </button>
                </div>
                <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.75rem', marginBottom: 0 }}>Warning: Regenerating your API key will immediately invalidate your previous key.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

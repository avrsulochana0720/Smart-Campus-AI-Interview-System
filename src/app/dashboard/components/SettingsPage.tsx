import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User,
  Building,
  Sliders,
  Bell,
  Link,
  ShieldCheck,
  CreditCard,
  Upload,
  Clock,
  Sparkles,
  Award,
  Lock,
  Building2,
  Calendar,
  CheckCircle,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

import '../../../styles/CandidateDashboard.css';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<'profile' | 'org' | 'interview' | 'notifications' | 'scoring' | 'security'>('profile');
  
  // Status feedback toast state
  const [isSaved, setIsSaved] = useState(false);

  // Forms States
  const [profileForm, setProfileForm] = useState({
    name: 'Arjun Mehta',
    email: 'arjun.mehta@smartcampus.ai',
    phone: '+91 98765 43210',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [orgForm, setOrgForm] = useState({
    name: 'Smart Campus University',
    address: '100 University Road, Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    timezone: 'IST (UTC+05:30)',
    academicTerm: '2026 - Autumn Semester'
  });

  const [interviewForm, setInterviewForm] = useState({
    duration: '45',
    autoAssign: true,
    allowReschedule: true,
    aiScoringEnabled: true,
    shortlistThreshold: 75,
    reminderTiming: '24h'
  });

  const [notificationForm, setNotificationForm] = useState({
    scheduled: { email: true, inApp: true },
    completed: { email: true, inApp: true },
    applied: { email: false, inApp: true },
    offered: { email: true, inApp: true },
    feedback: { email: true, inApp: false },
    alerts: { email: false, inApp: true }
  });

  const [securityForm, setSecurityForm] = useState({
    proctorStrictness: 'strict',
    eyeTracking: true,
    screenCapture: true,
    clipboardBlock: true,
    multiFaceDetection: true,
    apiToken: 'sk_live_51Nv89eCampusAIKey2026_98d7f3e1a6c0',
    webhookLevel: 'all',
    dataRetention: '90'
  });

  const [scoringWeights, setScoringWeights] = useState({
    Technical: 30,
    ProblemSolving: 25,
    Communication: 15,
    Coding: 20,
    Behavioral: 10
  });

  const [thresholds, setThresholds] = useState({
    pass: 70,
    anomaly: 80
  });

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Calculate sum of scoring weights
  const totalWeight = Object.values(scoringWeights).reduce((a, b) => a + b, 0);

  // Trigger Save Feedback
  const triggerSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const loadSettings = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Missing auth token');
      const response = await axios.get('http://localhost:8000/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      if (data.name) {
        setProfileForm(prev => ({ ...prev, name: data.name, email: data.email || prev.email }));
      }
      const settings = data.settings || {};
      if (settings.profile) setProfileForm(prev => ({ ...prev, ...settings.profile }));
      if (settings.org) setOrgForm(prev => ({ ...prev, ...settings.org }));
      if (settings.interview) setInterviewForm(prev => ({ ...prev, ...settings.interview }));
      if (settings.notification) setNotificationForm(prev => ({ ...prev, ...settings.notification }));
      if (settings.security) setSecurityForm(prev => ({ ...prev, ...settings.security }));
      if (settings.scoring) setScoringWeights(prev => ({ ...prev, ...settings.scoring }));
      if (settings.thresholds) setThresholds(prev => ({ ...prev, ...settings.thresholds }));
    } catch (error: any) {
      setLoadError(error?.response?.data?.detail || error.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setLoadError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Missing auth token');
      const payload = {
        profile: {
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone
        },
        org: orgForm,
        interview: interviewForm,
        notification: notificationForm,
        scoring: scoringWeights,
        thresholds,
        security: securityForm
      };
      await axios.post('http://localhost:8000/user-settings', { settings: payload }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerSave();
    } catch (error: any) {
      setLoadError(error?.response?.data?.detail || error.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Helper weight slider updater
  const handleWeightSlider = (skill: keyof typeof scoringWeights, val: number) => {
    setScoringWeights(prev => ({
      ...prev,
      [skill]: val
    }));
  };

  return (
    <div className="cd-container">

      {/* 1. Header */}
      <div className="cd-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0 0 0.5rem 0' }}>
            Settings
            <span style={{ fontSize: '0.8rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', color: '#DC2626', padding: '0.3rem 0.75rem', borderRadius: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', letterSpacing: '1px' }}>
              Configurations Manager
            </span>
          </h1>
          <p className="cd-subtitle" style={{ margin: 0, textAlign: 'left' }}>Adjust system preferences, scoring weights, and platform security tools.</p>
        </div>
      </div>

      {/* 2. Main Double-Column Layout */}
      <div className="cd-main-grid" style={{ gridTemplateColumns: '1fr 3fr', alignItems: 'start' }}>
        
        {/* LEFT SETTINGS NAVIGATION */}
        <div className="cd-glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* General settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', padding: '0 0.5rem' }}>General Settings</span>
            <button
              onClick={() => setActiveSection('profile')}
              style={{
                width: '100%', textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.3s ease',
                background: activeSection === 'profile' ? '#ffffff' : 'transparent',
                border: activeSection === 'profile' ? '1px solid #E5E7EB' : '1px solid transparent',
                color: activeSection === 'profile' ? '#DC2626' : '#64748B',
                boxShadow: activeSection === 'profile' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <User size={16} /> My Profile
            </button>
            <button
              onClick={() => setActiveSection('org')}
              style={{
                width: '100%', textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.3s ease',
                background: activeSection === 'org' ? '#ffffff' : 'transparent',
                border: activeSection === 'org' ? '1px solid #E5E7EB' : '1px solid transparent',
                color: activeSection === 'org' ? '#DC2626' : '#64748B',
                boxShadow: activeSection === 'org' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Building2 size={16} /> Organization Settings
            </button>
          </div>

          {/* Interviews settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', padding: '0 0.5rem' }}>Interviews Loop</span>
            <button
              onClick={() => setActiveSection('interview')}
              style={{
                width: '100%', textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.3s ease',
                background: activeSection === 'interview' ? '#ffffff' : 'transparent',
                border: activeSection === 'interview' ? '1px solid #E5E7EB' : '1px solid transparent',
                color: activeSection === 'interview' ? '#DC2626' : '#64748B',
                boxShadow: activeSection === 'interview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Clock size={16} /> Configurations
            </button>
            <button
              onClick={() => setActiveSection('scoring')}
              style={{
                width: '100%', textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.3s ease',
                background: activeSection === 'scoring' ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' : 'transparent',
                border: activeSection === 'scoring' ? '1px solid #DC2626' : '1px solid transparent',
                color: activeSection === 'scoring' ? '#fff' : '#64748B',
                boxShadow: activeSection === 'scoring' ? '0 4px 10px rgba(220, 38, 38, 0.3)' : 'none'
              }}
            >
              <Sparkles size={16} color={activeSection === 'scoring' ? '#fff' : '#64748B'} /> AI Scoring Rules
            </button>
          </div>

          {/* Notifications & Security */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', padding: '0 0.5rem' }}>Security & Alerts</span>
            <button
              onClick={() => setActiveSection('notifications')}
              style={{
                width: '100%', textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.3s ease',
                background: activeSection === 'notifications' ? '#ffffff' : 'transparent',
                border: activeSection === 'notifications' ? '1px solid #E5E7EB' : '1px solid transparent',
                color: activeSection === 'notifications' ? '#DC2626' : '#64748B',
                boxShadow: activeSection === 'notifications' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Bell size={16} /> Notification Triggers
            </button>
            <button
              onClick={() => setActiveSection('security')}
              style={{
                width: '100%', textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.3s ease',
                background: activeSection === 'security' ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' : 'transparent',
                border: activeSection === 'security' ? '1px solid #DC2626' : '1px solid transparent',
                color: activeSection === 'security' ? '#fff' : '#64748B',
                boxShadow: activeSection === 'security' ? '0 4px 10px rgba(220, 38, 38, 0.3)' : 'none'
              }}
            >
              <ShieldCheck size={16} color={activeSection === 'security' ? '#fff' : '#64748B'} /> Advanced & Security
            </button>
          </div>

          {/* Locked / Greyed Out Integrations & Security Billing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', padding: '0 0.5rem' }}>Platform Tools</span>
            <button style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #E5E7EB', color: '#94A3B8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Link size={16} /> Integrations API</span>
              <Lock size={12} color="#CBD5E1" />
            </button>
            <button style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #E5E7EB', color: '#94A3B8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><CreditCard size={16} /> Billing & Plan</span>
              <Lock size={12} color="#CBD5E1" />
            </button>
          </div>

        </div>

        {/* RIGHT FLEXIBLE CONTENT PANEL */}
        <div className="cd-glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC' }}>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>
              {activeSection === 'profile' && 'Profile Settings'}
              {activeSection === 'org' && 'Organization Profile Details'}
              {activeSection === 'interview' && 'Interview System Settings'}
              {activeSection === 'notifications' && 'Notification Dispatch Settings'}
              {activeSection === 'scoring' && 'AI Competency Weights & Guidelines'}
              {activeSection === 'security' && 'Advanced Level Proctoring & Security'}
            </h3>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
              {activeSection === 'profile' && 'Update personal name, contact information, and security key credentials.'}
              {activeSection === 'org' && 'Configure custom institutional attributes, campus semesters, and default timezones.'}
              {activeSection === 'interview' && 'Adjust proctored candidate loops, timings, auto-assignments, and shortlisted score settings.'}
              {activeSection === 'notifications' && 'Choose exact system event triggers to broadcast alerts across Email and In-App loops.'}
              {activeSection === 'scoring' && 'Tune individual core skill score weights, target shortlist passing levels, and AI proctor flags.'}
              {activeSection === 'security' && 'Configure strict AI proctor rules, anti-cheat mechanisms, and access token developer tools.'}
            </p>
          </div>

          <div style={{ padding: '2rem' }}>
            
            {/* --- PROFILE SETTINGS PANEL --- */}
            {activeSection === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Profile Photo upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Profile Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #DC2626', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', boxShadow: '0 2px 10px rgba(220, 38, 38, 0.1)' }}>
                      <User size={32} strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1, maxWidth: '300px', border: '1px dashed rgba(220, 38, 38, 0.4)', background: 'rgba(220, 38, 38, 0.05)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                      <Upload size={20} color="#DC2626" style={{ marginBottom: '0.5rem' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Drag & Drop or click to upload PNG/JPG</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className="cd-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="cd-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="cd-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Platform Access Role</label>
                    <span style={{ display: 'inline-block', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', color: '#DC2626', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.2rem' }}>
                      Super Admin (Full Platform Master)
                    </span>
                  </div>
                </div>

                {/* Change password sub-section */}
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={16} color="#DC2626" /> Change Security Password
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={profileForm.currentPassword}
                        onChange={e => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="cd-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={profileForm.newPassword}
                        onChange={e => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="cd-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={profileForm.confirmPassword}
                        onChange={e => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="cd-input"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* --- ORGANIZATION SETTINGS PANEL --- */}
            {activeSection === 'org' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Organization / University Name</label>
                    <input
                      type="text"
                      value={orgForm.name}
                      onChange={e => setOrgForm(prev => ({ ...prev, name: e.target.value }))}
                      className="cd-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Academic Term</label>
                    <select
                      value={orgForm.academicTerm}
                      onChange={e => setOrgForm(prev => ({ ...prev, academicTerm: e.target.value }))}
                      className="cd-input"
                    >
                      <option value="2026 - Autumn Semester">2026 - Autumn Semester</option>
                      <option value="2026 - Winter Semester">2026 - Winter Semester</option>
                      <option value="2027 - Spring Semester">2027 - Spring Semester</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Organization Logo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '0.75rem', background: '#F8FAFC', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building size={28} color="#94A3B8" />
                    </div>
                    <div style={{ flex: 1, maxWidth: '300px', border: '1px dashed rgba(220, 38, 38, 0.4)', background: 'rgba(220, 38, 38, 0.05)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                      <Upload size={20} color="#DC2626" style={{ marginBottom: '0.5rem' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Upload clean PNG logo</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Address Line</label>
                    <input
                      type="text"
                      value={orgForm.address}
                      onChange={e => setOrgForm(prev => ({ ...prev, address: e.target.value }))}
                      className="cd-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>City</label>
                    <input
                      type="text"
                      value={orgForm.city}
                      onChange={e => setOrgForm(prev => ({ ...prev, city: e.target.value }))}
                      className="cd-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>State</label>
                    <input
                      type="text"
                      value={orgForm.state}
                      onChange={e => setOrgForm(prev => ({ ...prev, state: e.target.value }))}
                      className="cd-input"
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Default Timezone</label>
                    <select
                      value={orgForm.timezone}
                      onChange={e => setOrgForm(prev => ({ ...prev, timezone: e.target.value }))}
                      className="cd-input"
                    >
                      <option value="IST (UTC+05:30)">IST (UTC+05:30) - India</option>
                      <option value="EST (UTC-05:00)">EST (UTC-05:00) - Eastern Time</option>
                      <option value="GMT (UTC+00:00)">GMT (UTC+00:00) - London</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* --- INTERVIEW SETTINGS PANEL --- */}
            {activeSection === 'interview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Default Duration Radio selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Default Interview Duration</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    {['30', '45', '60', '90'].map(d => (
                      <label
                        key={d}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.3s',
                          background: interviewForm.duration === d ? 'rgba(220, 38, 38, 0.05)' : '#ffffff',
                          border: interviewForm.duration === d ? '1px solid #DC2626' : '1px solid #E5E7EB',
                          color: interviewForm.duration === d ? '#DC2626' : '#64748B', fontWeight: interviewForm.duration === d ? 800 : 600
                        }}
                      >
                        <input
                          type="radio"
                          name="duration"
                          value={d}
                          checked={interviewForm.duration === d}
                          onChange={() => setInterviewForm(prev => ({ ...prev, duration: d }))}
                          style={{ display: 'none' }}
                        />
                        <span>{d} mins</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Auto assigner & Rescheduler Toggles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E5E7EB' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0F172A', fontWeight: 700 }}>Auto-Assign Evaluators</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Matches expert panel to candidate loops</span>
                    </div>
                    <div 
                      onClick={() => setInterviewForm(prev => ({ ...prev, autoAssign: !prev.autoAssign }))}
                      style={{ 
                        width: '46px', height: '26px', borderRadius: '13px', 
                        background: interviewForm.autoAssign ? 'rgba(220, 38, 38, 0.2)' : '#E2E8F0',
                        border: interviewForm.autoAssign ? '1px solid rgba(220, 38, 38, 0.5)' : '1px solid #CBD5E1',
                        position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: '2px', left: interviewForm.autoAssign ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%',
                        background: interviewForm.autoAssign ? '#DC2626' : '#94A3B8', transition: 'all 0.3s',
                        boxShadow: interviewForm.autoAssign ? '0 0 5px rgba(220, 38, 38, 0.5)' : 'none'
                      }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E5E7EB' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0F172A', fontWeight: 700 }}>Candidate Rescheduling</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Allow candidates to adjust loops once</span>
                    </div>
                    <div 
                      onClick={() => setInterviewForm(prev => ({ ...prev, allowReschedule: !prev.allowReschedule }))}
                      style={{ 
                        width: '46px', height: '26px', borderRadius: '13px', 
                        background: interviewForm.allowReschedule ? 'rgba(220, 38, 38, 0.2)' : '#E2E8F0',
                        border: interviewForm.allowReschedule ? '1px solid rgba(220, 38, 38, 0.5)' : '1px solid #CBD5E1',
                        position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: '2px', left: interviewForm.allowReschedule ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%',
                        background: interviewForm.allowReschedule ? '#DC2626' : '#94A3B8', transition: 'all 0.3s',
                        boxShadow: interviewForm.allowReschedule ? '0 0 5px rgba(220, 38, 38, 0.5)' : 'none'
                      }}></div>
                    </div>
                  </div>
                </div>

                {/* AI scoring enabled/disabled (PROMINENT TOGGLE) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'rgba(220, 38, 38, 0.05)', borderRadius: '1rem', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <Sparkles size={24} color="#DC2626" />
                    <div>
                      <strong style={{ display: 'block', fontSize: '1rem', color: '#DC2626', fontWeight: 800, marginBottom: '0.25rem' }}>AI Automated Grading Loop</strong>
                      <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 500, lineHeight: 1.5, display: 'block', maxWidth: '500px' }}>
                        Activates automated audio transcript evaluation, code correctness auditing, and proctor anomaly integrity scoring instantly on final submissions.
                      </span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setInterviewForm(prev => ({ ...prev, aiScoringEnabled: !prev.aiScoringEnabled }))}
                    style={{ 
                      width: '60px', height: '32px', borderRadius: '16px', shrink: 0,
                      background: interviewForm.aiScoringEnabled ? 'rgba(220, 38, 38, 0.2)' : '#E2E8F0',
                      border: interviewForm.aiScoringEnabled ? '1px solid rgba(220, 38, 38, 0.5)' : '1px solid #CBD5E1',
                      position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px', left: interviewForm.aiScoringEnabled ? '31px' : '3px', width: '24px', height: '24px', borderRadius: '50%',
                      background: interviewForm.aiScoringEnabled ? '#DC2626' : '#94A3B8', transition: 'all 0.3s',
                      boxShadow: interviewForm.aiScoringEnabled ? '0 0 10px rgba(220, 38, 38, 0.3)' : 'none'
                    }}></div>
                  </div>
                </div>

                {/* Shortlist score thresholds */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Score Threshold for Auto-Shortlist</label>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.4 }}>Final average score target (out of 100) where candidates automatically convert to shortlisted status.</p>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={interviewForm.shortlistThreshold}
                      onChange={e => setInterviewForm(prev => ({ ...prev, shortlistThreshold: parseInt(e.target.value) || 50 }))}
                      className="cd-input"
                      style={{ width: '120px', fontSize: '1rem', fontWeight: 800, textAlign: 'center' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Candidate reminder timing</label>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.4 }}>Select when system reminders ping active candidates before loops schedule.</p>
                    <select
                      value={interviewForm.reminderTiming}
                      onChange={e => setInterviewForm(prev => ({ ...prev, reminderTiming: e.target.value }))}
                      className="cd-input"
                      style={{ maxWidth: '250px' }}
                    >
                      <option value="24h">24 Hours Before</option>
                      <option value="1h">1 Hour Before</option>
                      <option value="30min">30 Minutes Before</option>
                    </select>
                  </div>
                </div>

              </div>
            )}

            {/* --- NOTIFICATION SETTINGS PANEL --- */}
            {activeSection === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '1rem', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', color: '#64748B', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800 }}>Alert Trigger Category</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: 800, width: '100px' }}>Email Loop</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: 800, width: '100px' }}>In-App</th>
                      </tr>
                    </thead>
                    <tbody>
                      
                      {[
                        { key: 'scheduled', label: 'New Interview Scheduled', desc: 'Alert evaluators and candidates immediately once interview time slot maps.' },
                        { key: 'completed', label: 'Interview Completed', desc: 'Trigger report compiled notifications once candidate finalizes submission.' },
                        { key: 'applied', label: 'New Candidate Applied', desc: 'Notify recruiters when new applicants enter loop queues.' },
                        { key: 'offered', label: 'Offer Extended', desc: 'Ping coordination panels when final offer packets route out.' },
                        { key: 'feedback', label: 'Feedback Received', desc: 'Alert technical leads when evaluator comments log.' },
                        { key: 'alerts', label: 'System Alerts & Audits', desc: 'Important server sync notifications, plagiarism anomalies, or billing alerts.' }
                      ].map((row, idx) => (
                        <tr key={row.key} style={{ borderBottom: '1px solid #E5E7EB', transition: 'all 0.2s', background: idx % 2 === 0 ? 'transparent' : '#F8FAFC' }}>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <span style={{ display: 'block', color: '#0F172A', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{row.label}</span>
                            <span style={{ display: 'block', color: '#64748B', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.4 }}>{row.desc}</span>
                          </td>
                          
                          {/* Email toggle */}
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                            <div 
                              onClick={() => {
                                const curr = (notificationForm as any)[row.key];
                                setNotificationForm(prev => ({ ...prev, [row.key]: { ...curr, email: !curr.email } }));
                              }}
                              style={{ 
                                width: '40px', height: '22px', borderRadius: '11px', margin: '0 auto',
                                background: (notificationForm as any)[row.key].email ? 'rgba(220, 38, 38, 0.2)' : '#E2E8F0',
                                border: (notificationForm as any)[row.key].email ? '1px solid rgba(220, 38, 38, 0.5)' : '1px solid #CBD5E1',
                                position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                              }}
                            >
                              <div style={{
                                position: 'absolute', top: '2px', left: (notificationForm as any)[row.key].email ? '20px' : '2px', width: '16px', height: '16px', borderRadius: '50%',
                                background: (notificationForm as any)[row.key].email ? '#DC2626' : '#94A3B8', transition: 'all 0.3s'
                              }}></div>
                            </div>
                          </td>

                          {/* In App toggle */}
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                            <div 
                              onClick={() => {
                                const curr = (notificationForm as any)[row.key];
                                setNotificationForm(prev => ({ ...prev, [row.key]: { ...curr, inApp: !curr.inApp } }));
                              }}
                              style={{ 
                                width: '40px', height: '22px', borderRadius: '11px', margin: '0 auto',
                                background: (notificationForm as any)[row.key].inApp ? 'rgba(220, 38, 38, 0.2)' : '#E2E8F0',
                                border: (notificationForm as any)[row.key].inApp ? '1px solid rgba(220, 38, 38, 0.5)' : '1px solid #CBD5E1',
                                position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                              }}
                            >
                              <div style={{
                                position: 'absolute', top: '2px', left: (notificationForm as any)[row.key].inApp ? '20px' : '2px', width: '16px', height: '16px', borderRadius: '50%',
                                background: (notificationForm as any)[row.key].inApp ? '#DC2626' : '#94A3B8', transition: 'all 0.3s'
                              }}></div>
                            </div>
                          </td>
                        </tr>
                      ))}

                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- AI SCORING RULES PANEL --- */}
            {activeSection === 'scoring' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Sliders weighting header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '1px' }}>Scoring Weights Balance</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Tuning individual weights mapping to final score metrics.</p>
                  </div>

                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 800, padding: '0.4rem 1rem', borderRadius: '2rem',
                    background: totalWeight === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: totalWeight === 100 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    color: totalWeight === 100 ? '#10B981' : '#EF4444'
                  }}>
                    Weights Total: {totalWeight}% (Aim: 100%)
                  </span>
                </div>

                {/* Weighted sliders */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {(Object.keys(scoringWeights) as Array<keyof typeof scoringWeights>).map((skill, idx) => {
                    const val = scoringWeights[skill];
                    return (
                      <div key={skill} style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
                          <span>{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span style={{ color: '#DC2626' }}>{val}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={val}
                          onChange={e => handleWeightSlider(skill, parseInt(e.target.value))}
                          style={{ 
                            width: '100%', cursor: 'ew-resize', accentColor: '#DC2626'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Dynamic alert notice */}
                {totalWeight !== 100 && (
                  <div style={{ padding: '1rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.75rem', color: '#EF4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertCircle size={20} />
                    <span><strong>Weight Notice:</strong> Skill weights equal <strong>{totalWeight}%</strong>. Please adjust them to equal exactly <strong>100%</strong> before saving.</span>
                  </div>
                )}

                {/* Anomaly & Pass sliders */}
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  
                  <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={16} color="#DC2626" /> Shortlist Pass Threshold</span>
                      <span style={{ color: '#DC2626' }}>{thresholds.pass}%</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>Minimum average competency score candidates must maintain to trigger auto-shortlisting.</p>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      value={thresholds.pass}
                      onChange={e => setThresholds(prev => ({ ...prev, pass: parseInt(e.target.value) }))}
                      style={{ width: '100%', cursor: 'ew-resize', accentColor: '#DC2626' }}
                    />
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldCheck size={16} color="#DC2626" /> AI Proctoring Auto-Flag</span>
                      <span style={{ color: '#DC2626' }}>{thresholds.anomaly}%</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>Plagiarism index ratio target at which candidates are automatically flagged for proctor review.</p>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      value={thresholds.anomaly}
                      onChange={e => setThresholds(prev => ({ ...prev, anomaly: parseInt(e.target.value) }))}
                      style={{ width: '100%', cursor: 'ew-resize', accentColor: '#DC2626' }}
                    />
                  </div>

                </div>

              </div>
            )}

            {/* --- ADVANCED SECURITY SETTINGS PANEL --- */}
            {activeSection === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Strictness selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Proctoring Strictness Level</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {[
                      { key: 'standard', title: 'Standard', desc: 'Alerts on tab switches, basic video proctor flags.' },
                      { key: 'strict', title: 'Strict Integrity', desc: 'Locks clipboard, monitors eyes, alerts multi-face.' },
                      { key: 'custom', title: 'Custom Compliance', desc: 'Manually toggle specific rules in list below.' }
                    ].map(item => (
                      <label
                        key={item.key}
                        style={{
                          display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '1.25rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.25s ease', textAlign: 'left',
                          background: securityForm.proctorStrictness === item.key ? 'rgba(220, 38, 38, 0.03)' : '#ffffff',
                          border: securityForm.proctorStrictness === item.key ? '2px solid #DC2626' : '1px solid #E5E7EB',
                          color: securityForm.proctorStrictness === item.key ? '#DC2626' : '#64748B'
                        }}
                      >
                        <input
                          type="radio"
                          name="strictness"
                          value={item.key}
                          checked={securityForm.proctorStrictness === item.key}
                          onChange={() => {
                            if (item.key === 'standard') {
                              setSecurityForm(prev => ({
                                ...prev,
                                proctorStrictness: 'standard',
                                eyeTracking: false,
                                multiFaceDetection: false,
                                clipboardBlock: false,
                                screenCapture: true
                              }));
                            } else if (item.key === 'strict') {
                              setSecurityForm(prev => ({
                                ...prev,
                                proctorStrictness: 'strict',
                                eyeTracking: true,
                                multiFaceDetection: true,
                                clipboardBlock: true,
                                screenCapture: true
                              }));
                            } else {
                              setSecurityForm(prev => ({ ...prev, proctorStrictness: 'custom' }));
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        <strong style={{ fontSize: '0.9rem', color: securityForm.proctorStrictness === item.key ? '#DC2626' : '#0F172A' }}>{item.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.4' }}>{item.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Individual Toggles list */}
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Compliance Rules Auditing</label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    
                    {/* Toggle 1: Eye tracking */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E5E7EB', opacity: securityForm.proctorStrictness === 'custom' ? 1 : 0.65 }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0F172A' }}>Real-time Eye Tracking</strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Flags candidate gaze aversion triggers</span>
                      </div>
                      <button
                        disabled={securityForm.proctorStrictness !== 'custom'}
                        onClick={() => setSecurityForm(prev => ({ ...prev, eyeTracking: !prev.eyeTracking }))}
                        style={{
                          width: '40px', height: '22px', borderRadius: '11px', border: '1px solid', cursor: securityForm.proctorStrictness === 'custom' ? 'pointer' : 'not-allowed', position: 'relative', transition: 'all 0.3s',
                          background: securityForm.eyeTracking ? 'rgba(220, 38, 38, 0.2)' : '#E2E8F0',
                          borderColor: securityForm.eyeTracking ? 'rgba(220, 38, 38, 0.5)' : '#CBD5E1'
                        }}
                      >
                        <div style={{ position: 'absolute', top: '2px', left: securityForm.eyeTracking ? '20px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: securityForm.eyeTracking ? '#DC2626' : '#94A3B8', transition: 'all 0.3s' }}></div>
                      </button>
                    </div>

                    {/* Toggle 2: Multi-face */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E5E7EB', opacity: securityForm.proctorStrictness === 'custom' ? 1 : 0.65 }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0F172A' }}>Multi-Face Detection</strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Audit presence of other faces in feed</span>
                      </div>
                      <button
                        disabled={securityForm.proctorStrictness !== 'custom'}
                        onClick={() => setSecurityForm(prev => ({ ...prev, multiFaceDetection: !prev.multiFaceDetection }))}
                        style={{
                          width: '40px', height: '22px', borderRadius: '11px', border: '1px solid', cursor: securityForm.proctorStrictness === 'custom' ? 'pointer' : 'not-allowed', position: 'relative', transition: 'all 0.3s',
                          background: securityForm.multiFaceDetection ? 'rgba(220, 38, 38, 0.2)' : '#E2E8F0',
                          borderColor: securityForm.multiFaceDetection ? 'rgba(220, 38, 38, 0.5)' : '#CBD5E1'
                        }}
                      >
                        <div style={{ position: 'absolute', top: '2px', left: securityForm.multiFaceDetection ? '20px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: securityForm.multiFaceDetection ? '#DC2626' : '#94A3B8', transition: 'all 0.3s' }}></div>
                      </button>
                    </div>

                    {/* Toggle 3: Clipboard block */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E5E7EB', opacity: securityForm.proctorStrictness === 'custom' ? 1 : 0.65 }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0F172A' }}>Clipboard Copy/Paste Blocks</strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Restricts pasting answers inside loop</span>
                      </div>
                      <button
                        disabled={securityForm.proctorStrictness !== 'custom'}
                        onClick={() => setSecurityForm(prev => ({ ...prev, clipboardBlock: !prev.clipboardBlock }))}
                        style={{
                          width: '40px', height: '22px', borderRadius: '11px', border: '1px solid', cursor: securityForm.proctorStrictness === 'custom' ? 'pointer' : 'not-allowed', position: 'relative', transition: 'all 0.3s',
                          background: securityForm.clipboardBlock ? 'rgba(220, 38, 38, 0.2)' : '#E2E8F0',
                          borderColor: securityForm.clipboardBlock ? 'rgba(220, 38, 38, 0.5)' : '#CBD5E1'
                        }}
                      >
                        <div style={{ position: 'absolute', top: '2px', left: securityForm.clipboardBlock ? '20px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: securityForm.clipboardBlock ? '#DC2626' : '#94A3B8', transition: 'all 0.3s' }}></div>
                      </button>
                    </div>

                    {/* Toggle 4: Screen capture audit */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E5E7EB', opacity: securityForm.proctorStrictness === 'custom' ? 1 : 0.65 }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0F172A' }}>Active Screen Auditing</strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Logs background browser window actions</span>
                      </div>
                      <button
                        disabled={securityForm.proctorStrictness !== 'custom'}
                        onClick={() => setSecurityForm(prev => ({ ...prev, screenCapture: !prev.screenCapture }))}
                        style={{
                          width: '40px', height: '22px', borderRadius: '11px', border: '1px solid', cursor: securityForm.proctorStrictness === 'custom' ? 'pointer' : 'not-allowed', position: 'relative', transition: 'all 0.3s',
                          background: securityForm.screenCapture ? 'rgba(220, 38, 38, 0.2)' : '#E2E8F0',
                          borderColor: securityForm.screenCapture ? 'rgba(220, 38, 38, 0.5)' : '#CBD5E1'
                        }}
                      >
                        <div style={{ position: 'absolute', top: '2px', left: securityForm.screenCapture ? '20px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: securityForm.screenCapture ? '#DC2626' : '#94A3B8', transition: 'all 0.3s' }}></div>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Developer Integrations API keys */}
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Superuser API Access Token (Developer Mode)</label>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                      type="text"
                      value={securityForm.apiToken}
                      readOnly
                      style={{
                        flex: 1, padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #E5E7EB', background: '#F8FAFC', color: '#0F172A', fontFamily: 'monospace', fontSize: '0.85rem'
                      }}
                    />
                    <button
                      onClick={() => {
                        const randToken = 'sk_live_51Nv89eCampus' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_98d7';
                        setSecurityForm(prev => ({ ...prev, apiToken: randToken }));
                      }}
                      className="cd-btn-secondary"
                      style={{ padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <RotateCcw size={12} /> Regenerate
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem' }}>Webhook Dispatch Mode</label>
                      <select
                        value={securityForm.webhookLevel}
                        onChange={e => setSecurityForm(prev => ({ ...prev, webhookLevel: e.target.value }))}
                        className="cd-input"
                      >
                        <option value="all">All Events (Integrations Audit)</option>
                        <option value="errors">Critical Proctor Anomalies Only</option>
                        <option value="none">Disabled</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem' }}>Proctor Audio/Video Data Retention</label>
                      <select
                        value={securityForm.dataRetention}
                        onChange={e => setSecurityForm(prev => ({ ...prev, dataRetention: e.target.value }))}
                        className="cd-input"
                      >
                        <option value="30">30 Days (GDPR Standard)</option>
                        <option value="90">90 Days (Compliant Archive)</option>
                        <option value="365">1 Year (Longterm Audit)</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Consistent Save/Cancel Pattern Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '2rem', marginTop: '2rem' }}>
              
              {/* Feedback Success Notification */}
              {isSaved ? (
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.5rem 1rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} color="#10B981" /> Configuration Saved Successfully!
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, fontStyle: 'italic' }}>
                  * Configurations apply immediately to active interview screening cycles.
                </span>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="cd-btn-secondary"
                  onClick={loadSettings}
                  disabled={loading || isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  disabled={isSaving || (activeSection === 'scoring' && totalWeight !== 100)}
                  className="cd-btn-primary"
                  style={{ opacity: (activeSection === 'scoring' && totalWeight !== 100) || isSaving ? 0.5 : 1 }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

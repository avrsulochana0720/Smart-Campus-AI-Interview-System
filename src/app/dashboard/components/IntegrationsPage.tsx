import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Link,
  Trash,
  CheckCircle,
  Clock,
  Award,
  AlertTriangle,
  Send,
  Building,
  Check,
  X,
  Code,
  Sliders,
  Copy,
  Layers,
  Sparkles,
  HelpCircle,
  FileCode,
  Activity,
  Play,
  RefreshCw,
  Cpu,
  Key,
  Webhook,
  Terminal,
  Settings,
  ChevronRight
} from 'lucide-react';

import '../../../styles/CandidateDashboard.css';

// --- MOCK INTEGRATIONS DATA ---
const INITIAL_SERVICES = [
  { id: 1, name: 'Google Calendar', category: 'Calendar', desc: 'Sync interview slots and availability directly to Google Workspace.', status: 'Connected', syncTime: '2 min ago', baseColor: 'DC2626' }, 
  { id: 2, name: 'Slack', category: 'Communication', desc: 'Send AI-proctoring alerts and completed scoreboards to internal channels.', status: 'Connected', syncTime: '5 min ago', baseColor: 'DC2626' }, 
  { id: 3, name: 'Zoom', category: 'Video', desc: 'Automatically generate secure video meeting URLs for panel evaluations.', status: 'Connected', syncTime: '1 hour ago', baseColor: 'DC2626' }, 
  { id: 4, name: 'LinkedIn Jobs', category: 'Job Board', desc: 'Pull active candidates applications instantly into review queues.', status: 'Connected', syncTime: 'Yesterday', baseColor: 'DC2626' }, 
  { id: 5, name: 'Workday', category: 'HRMS', desc: 'Sync finalized hire records and candidate portfolios with core payroll.', status: 'Connected', syncTime: '3 days ago', baseColor: 'DC2626' }, 
  { id: 6, name: 'SendGrid', category: 'Email', desc: 'Deliver custom-branded loops screening schedules and invitations.', status: 'Connected', syncTime: '1 week ago', baseColor: 'DC2626' }, 
  { id: 7, name: 'Greenhouse', category: 'ATS', desc: 'Pull candidate pipeline stages and export final AI screening scorecards.', status: 'Connected', syncTime: '2 weeks ago', baseColor: 'DC2626' }, 
  // Available Services
  { id: 8, name: 'Microsoft Teams', category: 'Video', desc: 'Generate secure Teams meeting URLs dynamically on interview bookings.', status: 'Available', baseColor: '64748B' }, 
  { id: 9, name: 'WhatsApp Business', category: 'Communication', desc: 'Send automated reminder pings and schedules directly to candidates.', status: 'Available', baseColor: '64748B' }, 
  { id: 10, name: 'Naukri', category: 'Job Board', desc: 'Broadcast open technical assessment links to job seekers instantly.', status: 'Available', baseColor: '64748B' }, 
  { id: 11, name: 'Lever', category: 'ATS', desc: 'Seamlessly transition applicant records from Lever into active screening loops.', status: 'Available', baseColor: '64748B' }, 
  { id: 12, name: 'BambooHR', category: 'HRMS', desc: 'Sync finalized candidates files and backgrounds with core employee directories.', status: 'Available', baseColor: '64748B' }, 
  { id: 13, name: 'SAP SuccessFactors', category: 'HRMS', desc: 'Enterprise-grade employee records and coordination loop syncing.', status: 'Available', baseColor: '64748B' }, 
  { id: 14, name: 'Razorpay', category: 'Payment', desc: 'Integrated billing loops for volume-based assessment transactions.', status: 'Available', baseColor: '64748B' } 
];

// --- MOCK API KEYS ---
const INITIAL_KEYS = [
  { id: 'k1', name: 'Production Dashboard Sync', prefix: 'sk_live_a1b2c3d4...', created: 'May 12, 2026', lastUsed: '2 mins ago' },
  { id: 'k2', name: 'Staging Greenhouse Sync', prefix: 'sk_test_x9y8z7w6...', created: 'May 18, 2026', lastUsed: 'Yesterday' }
];

// --- MOCK WEBHOOKS ---
const INITIAL_WEBHOOKS = [
  { id: 'w1', url: 'https://api.workday.com/v1/webhooks/candidates', events: ['interview.completed', 'offer.extended'], status: true, lastTriggered: '1 hour ago' },
  { id: 'w2', url: 'https://smartcampus.edu/api/interview-sync', events: ['candidate.created', 'assessment.submitted'], status: true, lastTriggered: '2 mins ago' }
];

// --- MOCK WEBHOOK LOGS ---
const WEBHOOK_LOGS = [
  { id: 'l1', event: 'assessment.submitted', status: 200, payload: '{\n  "event": "assessment.submitted",\n  "candidate_id": "cand_9872",\n  "score": 82.5,\n  "status": "Passed"\n}', time: '2 mins ago' },
  { id: 'l2', event: 'interview.completed', status: 201, payload: '{\n  "event": "interview.completed",\n  "interview_id": "int_4812",\n  "interviewer": "Sarah Chen"\n}', time: '1 hour ago' }
];

export default function IntegrationsPage() {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [activeTab, setActiveTab] = useState<'All' | 'Connected' | 'Available' | 'API'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for keys & webhooks
  const [apiKeys, setApiKeys] = useState(INITIAL_KEYS);
  const [webhooks, setWebhooks] = useState(INITIAL_WEBHOOKS);
  const [logsExpanded, setLogsExpanded] = useState<Record<string, boolean>>({});

  // Modal states
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isWebhookTestAlert, setIsWebhookTestAlert] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [configService, setConfigService] = useState<string | null>(null);

  // New key form state
  const [newKey, setNewKey] = useState({
    name: '',
    expiry: 'Never',
    scopes: { read: true, write: false, admin: false }
  });

  // New webhook form state
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: {
      completed: true,
      created: false,
      extended: false,
      submitted: false,
      feedback: false
    }
  });

  // Calculate filtered services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'Connected') matchesTab = s.status === 'Connected';
      if (activeTab === 'Available') matchesTab = s.status === 'Available';
      
      return matchesSearch && matchesTab;
    });
  }, [services, searchQuery, activeTab]);

  // Toggle service connection
  const toggleConnection = (id: number) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        const isConnected = s.status === 'Connected';
        return {
          ...s,
          status: isConnected ? 'Available' : 'Connected',
          syncTime: isConnected ? 'Disconnected' : 'Just Connected'
        };
      }
      return s;
    }));
  };

  const handleCopyKey = async (id: string) => {
    const key = apiKeys.find(k => k.id === id);
    if (!key) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(key.prefix);
      setCopiedKeyId(id);
      window.setTimeout(() => setCopiedKeyId(null), 2500);
    }
  };

  const openConfigModal = (serviceName: string) => {
    setConfigService(serviceName);
    setIsConfigModalOpen(true);
  };

  // Generate new API Key
  const handleCreateKey = () => {
    if (!newKey.name.trim()) return;

    const created: any = {
      id: Date.now().toString(),
      name: newKey.name,
      prefix: `sk_${newKey.scopes.admin ? 'admin' : 'live'}_${Math.random().toString(36).substring(2, 10)}...`,
      created: 'Just Created',
      lastUsed: 'Never used'
    };

    setApiKeys(prev => [created, ...prev]);
    setIsKeyModalOpen(false);
    setNewKey({ name: '', expiry: 'Never', scopes: { read: true, write: false, admin: false } });
  };

  // Revoke API Key
  const handleRevokeKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  // Add new webhook
  const handleCreateWebhook = () => {
    if (!newWebhook.url.trim()) return;

    const selectedEvents = Object.entries(newWebhook.events)
      .filter(([_, checked]) => checked)
      .map(([name]) => `interview.${name}`);

    const created: any = {
      id: Date.now().toString(),
      url: newWebhook.url,
      events: selectedEvents.length > 0 ? selectedEvents : ['interview.completed'],
      status: true,
      lastTriggered: 'Never triggered'
    };

    setWebhooks(prev => [created, ...prev]);
    setIsWebhookModalOpen(false);
    setNewWebhook({ url: '', events: { completed: true, created: false, extended: false, submitted: false, feedback: false } });
  };

  // Webhook trigger test simulation
  const handleTestWebhook = (id: string) => {
    setIsWebhookTestAlert(id);
    setTimeout(() => setIsWebhookTestAlert(null), 3000);
  };

  // Toggle webhook active status
  const toggleWebhookStatus = (id: string) => {
    setWebhooks(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, status: !w.status };
      }
      return w;
    }));
  };

  return (
    <div className="cd-container">

      {/* 1. Header */}
      <div className="cd-header" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0 0 0.5rem 0' }}>
            Integrations
            <span style={{ fontSize: '0.8rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', color: '#DC2626', padding: '0.3rem 0.75rem', borderRadius: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', letterSpacing: '1px' }}>
              SaaS Marketplace
            </span>
          </h1>
          <p className="cd-subtitle" style={{ margin: 0, textAlign: 'left' }}>Connect tools, generate API keys, and configure webhooks.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Real-time search */}
          {activeTab !== 'API' && (
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search platforms..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="cd-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          )}

          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="cd-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Key size={16} /> Generate API Key
          </button>
        </div>
      </div>

      {/* 2. Top Stats Row */}
      <div className="cd-main-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
        {[
          { label: 'Connected Apps', value: services.filter(s => s.status === 'Connected').length.toString(), desc: '+1 this month', icon: Link, colorClass: 'red' },
          { label: 'Active Webhooks', value: webhooks.filter(w => w.status).length.toString(), desc: 'Live event sync', icon: Webhook, colorClass: 'navy' },
          { label: 'API Calls Today', value: '1,247', desc: 'Secure encryption', icon: Cpu, colorClass: 'red' },
          { label: 'Last System Sync', value: '2 min ago', desc: 'Pristine loops', icon: RefreshCw, colorClass: 'amber' }
        ].map((stat, i) => (
          <div key={i} className="cd-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="cd-stat-label">{stat.label}</p>
                <h3 className="cd-stat-value">{stat.value}</h3>
                <span className="trend trend-up">{stat.desc}</span>
              </div>
              <div className={`cd-stat-icon ${stat.colorClass}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: '#ffffff', padding: '0.5rem', borderRadius: '1rem', border: '1px solid #E5E7EB', overflowX: 'auto' }}>
        {['All Integrations', 'Connected Only', 'Available Marketplace', 'API & Webhooks'].map(tab => {
          const tabKey = tab.split(' ')[0] as any;
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tabKey)}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s', whiteSpace: 'nowrap',
                background: isActive ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid transparent',
                color: isActive ? '#DC2626' : '#64748B',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 4. Tab contents rendering */}

      {/* --- INTEGRATIONS MARKETPLACE GRID TAB --- */}
      {activeTab !== 'API' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredServices.map(item => {
            const isConnected = item.status === 'Connected';
            return (
              <div
                key={item.id}
                className="cd-glass-card"
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem', transition: 'all 0.3s' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Card Header: Service name + Logo placeholder */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '48px', height: '48px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800,
                        background: `rgba(220, 38, 38, 0.05)`, border: `1px solid rgba(220, 38, 38, 0.2)`, color: `#DC2626`,
                      }}>
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{item.name}</h4>
                        <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', background: '#F8FAFC', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #E5E7EB' }}>
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span style={{ 
                      fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', padding: '0.25rem 0.5rem', borderRadius: '0.25rem',
                      background: isConnected ? 'rgba(16, 185, 129, 0.1)' : '#F8FAFC',
                      border: isConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #E5E7EB',
                      color: isConnected ? '#10B981' : '#94A3B8'
                    }}>
                      {item.status}
                    </span>
                  </div>

                  {/* Short Description */}
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>
                    {item.desc}
                  </p>
                </div>

                {/* Actions Block */}
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {isConnected ? (
                    <>
                      <button onClick={() => openConfigModal(item.name)} className="cd-btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                        Configure Connector
                      </button>
                      <button
                        onClick={() => toggleConnection(item.id)}
                        style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleConnection(item.id)}
                      className="cd-btn-primary"
                      style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}
                    >
                      Connect Integration
                    </button>
                  )}
                </div>

              </div>
            );
          })}
          {filteredServices.length === 0 && (
            <div className="cd-glass-card" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Layers size={48} color="#CBD5E1" />
              <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>No Integrations Matches</h5>
              <p style={{ margin: 0, color: '#64748B' }}>We couldn't find any SaaS applications matching your search criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* --- API & WEBHOOKS HUB TAB --- */}
      {activeTab === 'API' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
            
            {/* LEFT: API Keys Table */}
            <div className="cd-glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Key size={16} color="#DC2626" /> System API Access Keys
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Secure authentication secrets utilized for custom API endpoints</p>
                </div>
                <button
                  onClick={() => setIsKeyModalOpen(true)}
                  className="cd-btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                >
                  Generate New Key
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', color: '#64748B', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '1px' }}>
                      <th style={{ padding: '1rem', fontWeight: 800 }}>Key Name</th>
                      <th style={{ padding: '1rem', fontWeight: 800 }}>Prefix Token</th>
                      <th style={{ padding: '1rem', fontWeight: 800 }}>Last Used</th>
                      <th style={{ padding: '1rem', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((k, idx) => (
                      <tr key={k.id} style={{ borderBottom: '1px solid #E5E7EB', background: idx % 2 === 0 ? 'transparent' : '#F8FAFC' }}>
                        <td style={{ padding: '1rem', color: '#0F172A', fontWeight: 800, fontSize: '0.85rem' }}>{k.name}</td>
                        <td style={{ padding: '1rem', color: '#DC2626', fontFamily: 'monospace', fontSize: '0.75rem' }}>{k.prefix}</td>
                        <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 500 }}>{k.lastUsed}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button title="Copy Token" onClick={() => handleCopyKey(k.id)} style={{ padding: '0.25rem', background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                              <Copy size={14} />
                            </button>
                            {copiedKeyId === k.id ? (
                              <span style={{ fontSize: '0.7rem', color: '#10B981', marginLeft: '0.5rem' }}>Copied</span>
                            ) : null}
                            <button title="Revoke Key" onClick={() => handleRevokeKey(k.id)} style={{ padding: '0.25rem', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                              <Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: Webhooks Config Panel */}
            <div className="cd-glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Webhook size={16} color="#DC2626" /> Active Webhook Callbacks
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Secure URL integrations dispatching real-time candidate JSON loops</p>
                </div>
                <button
                  onClick={() => setIsWebhookModalOpen(true)}
                  className="cd-btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                >
                  Add Webhook Endpoint
                </button>
              </div>

              {/* Webhooks configuration list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {webhooks.map(w => {
                  const isTesting = isWebhookTestAlert === w.id;
                  return (
                    <div key={w.id} style={{ padding: '1.25rem', border: '1px solid #E5E7EB', borderRadius: '0.75rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.9rem', fontWeight: 800, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '0.25rem' }}>{w.url}</strong>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Last trigger: <span style={{ color: '#94A3B8' }}>{w.lastTriggered}</span></span>
                        </div>

                        {/* Active toggle */}
                        <div 
                          onClick={() => toggleWebhookStatus(w.id)}
                          style={{ 
                            width: '46px', height: '26px', borderRadius: '13px', shrink: 0,
                            background: w.status ? 'rgba(220, 38, 38, 0.2)' : '#E2E8F0',
                            border: w.status ? '1px solid rgba(220, 38, 38, 0.5)' : '1px solid #CBD5E1',
                            position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                          }}
                        >
                          <div style={{
                            position: 'absolute', top: '2px', left: w.status ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%',
                            background: w.status ? '#DC2626' : '#94A3B8', transition: 'all 0.3s'
                          }}></div>
                        </div>
                      </div>

                      {/* Event sub-tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {w.events.map(e => (
                          <span key={e} style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: '#ffffff', border: '1px solid #E5E7EB', color: '#64748B', fontFamily: 'monospace' }}>
                            {e}
                          </span>
                        ))}
                      </div>

                      {/* Webhook tester and triggers */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                        {isTesting ? (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.25rem 0.75rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Check size={12} /> Ping Successful (200 OK)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Ready to test</span>
                        )}

                        <button
                          onClick={() => handleTestWebhook(w.id)}
                          style={{ background: '#ffffff', border: '1px solid #E5E7EB', color: '#64748B', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Play size={12} color="#64748B" /> Trigger test sync
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Webhook logs expandable section */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h5 style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>Sync Log History</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {WEBHOOK_LOGS.map(log => {
                    const isExp = !!logsExpanded[log.id];
                    return (
                      <div key={log.id} style={{ border: '1px solid #E5E7EB', borderRadius: '0.5rem', overflow: 'hidden', background: '#F8FAFC' }}>
                        <div
                          onClick={() => setLogsExpanded(prev => ({ ...prev, [log.id]: !isExp }))}
                          style={{ padding: '0.75rem', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.6rem', fontWeight: 800, background: log.status === 200 || log.status === 201 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: log.status === 200 || log.status === 201 ? '#10B981' : '#EF4444' }}>
                              {log.status}
                            </span>
                            <span style={{ fontFamily: 'monospace', color: '#334155', fontSize: '0.75rem', fontWeight: 700 }}>{log.event}</span>
                          </div>
                          <span style={{ color: '#94A3B8', fontSize: '0.65rem' }}>{log.time}</span>
                        </div>
                        
                        {isExp && (
                          <pre style={{ padding: '1rem', margin: 0, background: '#1E293B', color: '#E2E8F0', fontFamily: 'monospace', fontSize: '0.7rem', lineHeight: 1.5, overflowX: 'auto', borderTop: '1px solid #E5E7EB' }}>
                            {log.payload}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* BOTTOM SECTION — API Documentation link card with code snippet */}
          <div className="cd-glass-card" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={20} color="#DC2626" /> Platform API Documentation
              </h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6, maxWidth: '600px' }}>
                Easily script and automate evaluations. Pull score outputs, sync candidate records, and query question pools securely from your custom shell environments.
              </p>
              <a href="https://smartcampus.ai/docs" target="_blank" rel="noreferrer" style={{ background: 'transparent', border: 'none', color: '#DC2626', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: 0, textDecoration: 'none' }}>
                Read developer guidelines docs <ChevronRight size={14} />
              </a>
            </div>

            {/* Mock code block snippet */}
            <div style={{ width: '100%', maxWidth: '500px', background: '#0F172A', borderRadius: '1rem', border: '1px solid #1E293B', padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.6, color: '#94A3B8', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 800, color: '#CBD5E1', background: '#334155', border: '1px solid #475569', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                bash curl
              </div>
              <span style={{ color: '#64748B' }}>// Fetch completed candidate screening loop scores</span>
              <div style={{ marginTop: '0.5rem', color: '#38BDF8', fontWeight: 700 }}>
                curl -H "Authorization: Bearer <span style={{ color: '#A78BFA' }}>sk_live_a1b2c...</span>" \
              </div>
              <div style={{ paddingLeft: '1.5rem', color: '#38BDF8', fontWeight: 700 }}>
                https://api.smartcampus.ai/v1/candidates
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- INVITE NEW KEY MODAL OVERLAY --- */}
      {isKeyModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          
          <div className="cd-glass-card" style={{ width: '100%', maxWidth: '450px', padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Generate Platform API Key</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Secure secrets mapped to system read/write privileges</p>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                style={{ padding: '0.5rem', background: '#ffffff', border: '1px solid #E5E7EB', color: '#64748B', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Secret Key Label / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Workday Sync Key"
                  value={newKey.name}
                  onChange={e => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                  className="cd-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Secret Expiry Timing</label>
                <select
                  value={newKey.expiry}
                  onChange={e => setNewKey(prev => ({ ...prev, expiry: e.target.value }))}
                  className="cd-input"
                >
                  <option value="Never">Never Expire (Lifetime Key)</option>
                  <option value="30d">Expire in 30 Days</option>
                  <option value="90d">Expire in 90 Days</option>
                </select>
              </div>

              {/* Scopes - using check boxes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Scope Permissions Allocation</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {[
                    { key: 'read', label: 'read:scopes', desc: 'Allows querying candidate scores, assessments, and questions.' },
                    { key: 'write', label: 'write:scopes', desc: 'Allows scheduling interviews, adding questions, and creating assessments.' },
                    { key: 'admin', label: 'admin:scopes', desc: 'Full root privileges including modifying platform roles.' }
                  ].map(scope => {
                    const isChecked = (newKey.scopes as any)[scope.key];
                    return (
                      <div key={scope.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setNewKey(prev => ({ ...prev, scopes: { ...prev.scopes, [scope.key]: !isChecked } }))}>
                        <div style={{ 
                          width: '18px', height: '18px', borderRadius: '4px', border: isChecked ? '1px solid #DC2626' : '1px solid #CBD5E1', 
                          background: isChecked ? '#DC2626' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.1rem',
                          transition: 'all 0.2s'
                        }}>
                          {isChecked && <Check size={12} color="#fff" strokeWidth={4} />}
                        </div>
                        <div>
                          <span style={{ display: 'block', color: '#0F172A', fontWeight: 800, fontSize: '0.85rem' }}>{scope.label}</span>
                          <span style={{ display: 'block', color: '#64748B', fontSize: '0.7rem', fontWeight: 500, marginTop: '0.1rem' }}>{scope.desc}</span>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="cd-btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                className="cd-btn-primary"
                style={{ flex: 1 }}
              >
                Generate Token Key
              </button>
            </div>

          </div>

        </div>
      )}

      {/* --- ADD WEBHOOK MODAL OVERLAY --- */}
      {isWebhookModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          
          <div className="cd-glass-card" style={{ width: '100%', maxWidth: '450px', padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Add Webhook Endpoint</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Route real-time candidate JSON payloads directly</p>
              </div>
              <button
                onClick={() => setIsWebhookModalOpen(false)}
                style={{ padding: '0.5rem', background: '#ffffff', border: '1px solid #E5E7EB', color: '#64748B', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Destination URL Endpoint</label>
                <input
                  type="text"
                  placeholder="https://yourdomain.com/webhooks"
                  value={newWebhook.url}
                  onChange={e => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  className="cd-input"
                />
              </div>

              {/* Event trigger checks */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Subscribe to JSON Event Triggers</label>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '0.75rem', background: '#F8FAFC', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {[
                    { key: 'completed', label: 'interview.completed', desc: 'Triggered when interview transcript completes.' },
                    { key: 'created', label: 'candidate.created', desc: 'Triggered when candidate is successfully imported.' },
                    { key: 'extended', label: 'offer.extended', desc: 'Triggered when final offer package dispatches.' },
                    { key: 'submitted', label: 'assessment.submitted', desc: 'Triggered when technical assessment finalizes.' },
                    { key: 'feedback', label: 'feedback.submitted', desc: 'Triggered when evaluator comments log.' }
                  ].map(e => {
                    const isChecked = (newWebhook.events as any)[e.key];
                    return (
                      <div key={e.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.75rem' }} onClick={() => setNewWebhook(prev => ({ ...prev, events: { ...prev.events, [e.key]: !isChecked } }))}>
                        <div style={{ 
                          width: '18px', height: '18px', borderRadius: '4px', border: isChecked ? '1px solid #DC2626' : '1px solid #CBD5E1', 
                          background: isChecked ? '#DC2626' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.1rem',
                          transition: 'all 0.2s'
                        }}>
                          {isChecked && <Check size={12} color="#fff" strokeWidth={4} />}
                        </div>
                        <div>
                          <span style={{ display: 'block', color: '#0F172A', fontWeight: 800, fontSize: '0.8rem', fontFamily: 'monospace' }}>{e.label}</span>
                          <span style={{ display: 'block', color: '#64748B', fontSize: '0.65rem', fontWeight: 500, marginTop: '0.1rem' }}>{e.desc}</span>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setIsWebhookModalOpen(false)}
                className="cd-btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWebhook}
                className="cd-btn-primary"
                style={{ flex: 1 }}
              >
                Create Webhook End
              </button>
            </div>

          </div>

        </div>
      )}

      {/* --- CONFIGURE CONNECTOR MODAL --- */}
      {isConfigModalOpen && configService && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="cd-glass-card" style={{ width: '100%', maxWidth: '420px', padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Configure {configService}</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Adjust settings, permissions, and sync behavior for this connector.</p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                style={{ padding: '0.5rem', background: '#ffffff', border: '1px solid #E5E7EB', color: '#64748B', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '1px' }}>Sync status</span>
                <p style={{ margin: '0.5rem 0 0 0', color: '#64748B', lineHeight: 1.6 }}>Your connected service is syncing candidate and interview records automatically. You can disconnect or manage the connector from the main integration list.</p>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Auto-sync interval</p>
                  <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>Every 5 minutes</strong>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Data permissions</p>
                  <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>Candidate records, interviews, and scorecards</strong>
                </div>
              </div>
            </div>
            <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="cd-btn-secondary"
                style={{ flex: 1 }}
              >
                Close
              </button>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="cd-btn-primary"
                style={{ flex: 1 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

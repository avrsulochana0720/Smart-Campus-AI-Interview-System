import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Search, Filter, Shield, Key, Database, User, Terminal } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function AuditLogsPage() {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredLogs = logs.filter(l => 
    ((l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) || (l.ip || '').includes(searchTerm)) &&
    (selectedType === 'All Types' || l.type === selectedType)
  );

  const exportToCSV = () => {
    const headers = ['Log ID', 'Action Event', 'Actor (User)', 'Role', 'IP Address', 'Timestamp', 'Type'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(l => `"${l.id}","${l.action}","${l.user}","${l.role}","${l.ip}","${l.time}","${l.type}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'audit_logs.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Logs exported successfully!', 'success');
  };

  useEffect(() => {
    adminAPI.getAuditLogs().then(res => {
      setLogs(res || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'security': return <Key size={14} color="#EF4444" />;
      case 'system': return <Terminal size={14} color="#3B82F6" />;
      case 'data': return <Database size={14} color="#F59E0B" />;
      default: return <Shield size={14} color="#94A3B8" />;
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Security & Audit Logs</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Strict chronological record of all system modifications and access events.</p>
        </div>
        <button onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#111827', color: '#E2E8F0', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111827'}>
          Export Logs (CSV)
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', backgroundColor: '#0D1322', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1E293B' }}>
        <div style={{ position: 'relative', width: '400px' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search by action, user, or IP address..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', color: '#FFFFFF', fontSize: '0.85rem', outline: 'none' }} 
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ backgroundColor: '#111827', color: '#94A3B8', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
          >
            <option value="All Types">All Event Types</option>
            <option value="security">Security</option>
            <option value="system">System</option>
            <option value="data">Data</option>
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: '#0D1322', borderRadius: '0.75rem', border: '1px solid #1E293B', overflow: 'hidden', fontFamily: 'monospace' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#111827', borderBottom: '1px solid #1E293B' }}>
            <tr>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Log ID</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Action Event</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Actor (User)</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>IP Address</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading audit logs...</td></tr>
            ) : filteredLogs.map((log, idx) => (
              <tr key={idx} style={{ borderBottom: idx === logs.length - 1 ? 'none' : '1px solid #1E293B' }}>
                <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.8rem' }}>{log.id}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#E2E8F0' }}>
                    {getTypeIcon(log.type)} {log.action}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={12} color="#64748B"/> {log.user}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>{log.role}</div>
                </td>
                <td style={{ padding: '1rem', color: '#94A3B8', fontSize: '0.8rem' }}>{log.ip}</td>
                <td style={{ padding: '1rem', textAlign: 'right', color: '#94A3B8', fontSize: '0.8rem' }}>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

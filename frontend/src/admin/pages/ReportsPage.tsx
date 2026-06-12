import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { FileText, Download, Filter, Search, Calendar, Plus } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function ReportsPage() {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [newReport, setNewReport] = useState({ candidate_name: '', job_role: '', final_score: 0 });

  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All Types');
  
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('All Time');

  const downloadReport = (report: any) => {
    const csvData = `Report Type: Candidate Evaluation\nCandidate,${report.candidate_name}\nJob Role,${report.job_role}\nFinal Score,${Math.round(report.final_score)}\nGenerated At,${new Date(report.generated_at).toLocaleString()}`;
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${(report.candidate_name || 'candidate').replace(/ /g, '_')}_Evaluation.csv`);
    a.click();
    showToast(`Report for ${report.candidate_name} downloaded successfully!`, 'success');
  };

  const handleGenerateReport = () => {
    if (!newReport.candidate_name || !newReport.job_role) {
      showToast('Candidate name and role are required.', 'error');
      return;
    }
    const added = { 
      id: Date.now(),
      candidate_name: newReport.candidate_name,
      job_role: newReport.job_role,
      final_score: newReport.final_score,
      generated_at: new Date().toISOString()
    };
    setReports([added, ...reports]);
    setIsGenerating(false);
    setNewReport({ candidate_name: '', job_role: '', final_score: 0 });
    showToast('Custom report generated successfully.', 'success');
  };

  useEffect(() => {
    adminAPI.getReports().then(res => {
      setReports(res.data || []);
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Reports & Exports</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Generate, download, and review system-generated PDFs and CSVs.</p>
        </div>
        <button onClick={() => setIsGenerating(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>
          <Plus size={16} /> Generate Custom Report
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', backgroundColor: '#FAF6EE', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search reports..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', color: '#0F172A', fontSize: '0.85rem', outline: 'none' }} 
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setTypeFilterOpen(!typeFilterOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0F172A', color: '#64748B', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}><Filter size={14}/> {typeFilter}</button>
            {typeFilterOpen && (
              <div style={{ position: 'absolute', top: '100%', left: '0', marginTop: '0.5rem', backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.25rem', zIndex: 10, minWidth: '150px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                {['All Types', 'Engineering', 'Marketing', 'Sales'].map(opt => (
                  <div key={opt} onClick={() => { setTypeFilter(opt); setTypeFilterOpen(false); showToast(`Filter changed to ${opt}`, 'success'); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#334155', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setDateFilterOpen(!dateFilterOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0F172A', color: '#64748B', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}><Calendar size={14}/> {dateFilter}</button>
            {dateFilterOpen && (
              <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '0.5rem', backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.25rem', zIndex: 10, minWidth: '150px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                {['All Time', 'Last 7 Days', 'Last 30 Days', 'This Year'].map(opt => (
                  <div key={opt} onClick={() => { setDateFilter(opt); setDateFilterOpen(false); showToast(`Date filter changed to ${opt}`, 'success'); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#334155', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ color: '#64748B' }}>Loading reports...</div>
        ) : reports.filter(r => {
          const matchSearch = (r.candidate_name || '').toLowerCase().includes(searchTerm.toLowerCase());
          
          // Basic role/type matching
          let matchType = true;
          if (typeFilter !== 'All Types') {
            const role = (r.job_role || '').toLowerCase();
            const filterLower = typeFilter.toLowerCase();
            matchType = role.includes(filterLower) || (filterLower === 'engineering' && role.includes('developer'));
          }

          // Basic date matching
          let matchDate = true;
          if (dateFilter !== 'All Time' && r.generated_at) {
            const rDate = new Date(r.generated_at);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - rDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (dateFilter === 'Last 7 Days') {
               matchDate = diffDays <= 7;
            } else if (dateFilter === 'Last 30 Days') {
               matchDate = diffDays <= 30;
            } else if (dateFilter === 'This Year') {
               matchDate = rDate.getFullYear() === now.getFullYear();
            }
          }

          return matchSearch && matchType && matchDate;
        }).map((report, idx) => (
          <div key={idx} style={{ backgroundColor: '#FAF6EE', borderRadius: '0.75rem', border: '1px solid #334155', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', transition: 'background-color 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0F172A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FAF6EE'}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={20} color="#EF4444" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 600, margin: '0 0 0.25rem 0', lineHeight: 1.3 }}>{report.candidate_name} Evaluation</h3>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                  <span>{report.job_role}</span>
                  <span>•</span>
                  <span>{new Date(report.generated_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Score: {Math.round(report.final_score)}</span>
                </div>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); downloadReport(report); }} style={{ background: 'transparent', border: 'none', color: '#E11D48', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <Download size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Generate Custom Report Modal */}
      {isGenerating && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #334155', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: '0 0 1.5rem 0' }}>Generate Custom Report</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#64748B', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Candidate Name</label>
              <input type="text" value={newReport.candidate_name} onChange={(e) => setNewReport({...newReport, candidate_name: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: '#0F172A', outline: 'none' }} placeholder="e.g. John Doe" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#64748B', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Job Role</label>
              <input type="text" value={newReport.job_role} onChange={(e) => setNewReport({...newReport, job_role: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: '#0F172A', outline: 'none' }} placeholder="e.g. Software Engineer" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#64748B', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Final Score</label>
              <input type="number" value={newReport.final_score} onChange={(e) => setNewReport({...newReport, final_score: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: '#0F172A', outline: 'none' }} min="0" max="100" />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setIsGenerating(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #475569', color: '#64748B', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleGenerateReport} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#E11D48', border: 'none', color: '#FFFFFF', borderRadius: '0.5rem', cursor: 'pointer' }}>Generate Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Search, Plus, Layers, Calendar, Users, Target, ChevronRight } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function BatchManagementPage() {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newBatch, setNewBatch] = useState({ name: '', status: 'Preparation Phase', startDate: '', gradDate: '', totalStudents: 0, placed: 0 });

  const handleCreateBatch = () => {
    if (!newBatch.name) {
      showToast('Batch name is required.', 'error');
      return;
    }
    const added = { ...newBatch, id: Date.now() };
    setBatches([added, ...batches]);
    setIsAdding(false);
    setNewBatch({ name: '', status: 'Preparation Phase', startDate: '', gradDate: '', totalStudents: 0, placed: 0 });
    showToast('Batch created successfully.', 'success');
  };

  useEffect(() => {
    adminAPI.getBatches().then(res => {
      setBatches(res || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active Hiring': return '#22C55E';
      case 'Preparation Phase': return '#E11D48';
      case 'Completed': return '#64748B';
      default: return '#64748B';
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Batch Management</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Track academic batches, monitor placement progress, and manage cohorts.</p>
        </div>
        <button onClick={() => setIsAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>
          <Plus size={16} /> Create Batch
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ color: '#64748B' }}>Loading batches...</div>
        ) : batches.length === 0 ? (
          <div style={{ color: '#64748B', textAlign: 'center', padding: '2rem', backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '1px solid #334155' }}>
            No batches found. Please create a new batch to track placement progress.
          </div>
        ) : batches.filter(b => (b.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((batch) => {
          const placementPercentage = Math.round(((batch.placed || 0) / (batch.totalStudents || 1)) * 100);
          return (
            <div key={batch.id} style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '1px solid #334155', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: '#0F172A', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={24} color="#E11D48" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: '#0F172A', fontWeight: 600, margin: '0 0 0.25rem 0' }}>{batch.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: getStatusColor(batch.status) }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(batch.status) }}></span>
                      {batch.status}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}><Calendar size={12}/> Timeline</div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>{batch.startDate} - {batch.gradDate}</div>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#0F172A', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 500, marginBottom: '0.25rem' }}>Placement Progress</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{batch.placed} out of {batch.totalStudents} students placed</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#E11D48' }}>{placementPercentage}%</div>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${placementPercentage}%`, height: '100%', backgroundColor: '#E11D48', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #334155', width: '450px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: '0 0 1.5rem 0' }}>Create New Cohort Batch</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#64748B', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Batch Name</label>
              <input type="text" value={newBatch.name} onChange={(e) => setNewBatch({...newBatch, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: '#0F172A', outline: 'none' }} placeholder="e.g. Computer Science 2026" />
            </div>

            <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', color: '#64748B', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Start Date</label>
                    <input type="date" value={newBatch.startDate} onChange={(e) => setNewBatch({...newBatch, startDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: '#0F172A', outline: 'none', colorScheme: 'dark' }} />
                </div>
                <div>
                    <label style={{ display: 'block', color: '#64748B', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Graduation Date</label>
                    <input type="date" value={newBatch.gradDate} onChange={(e) => setNewBatch({...newBatch, gradDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: '#0F172A', outline: 'none', colorScheme: 'dark' }} />
                </div>
            </div>

            <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', color: '#64748B', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Total Students</label>
                    <input type="number" value={newBatch.totalStudents} onChange={(e) => setNewBatch({...newBatch, totalStudents: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: '#0F172A', outline: 'none' }} />
                </div>
                <div>
                    <label style={{ display: 'block', color: '#64748B', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Initial Placed</label>
                    <input type="number" value={newBatch.placed} onChange={(e) => setNewBatch({...newBatch, placed: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: '#0F172A', outline: 'none' }} />
                </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#64748B', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Batch Status</label>
              <select value={newBatch.status} onChange={(e) => setNewBatch({...newBatch, status: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: '#0F172A', outline: 'none' }}>
                <option value="Preparation Phase">Preparation Phase</option>
                <option value="Active Hiring">Active Hiring</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #475569', color: '#64748B', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateBatch} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#E11D48', border: 'none', color: '#FFFFFF', borderRadius: '0.5rem', cursor: 'pointer' }}>Create Batch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

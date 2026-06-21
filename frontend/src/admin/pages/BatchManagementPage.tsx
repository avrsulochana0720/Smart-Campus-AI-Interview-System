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

  const handleCreateBatch = async () => {
    if (!newBatch.name) {
      showToast('Batch name is required.', 'error');
      return;
    }
    try {
      const created = await adminAPI.createBatch({
        name: newBatch.name,
        status: newBatch.status,
        totalStudents: newBatch.totalStudents
      });
      setBatches([created, ...batches]);
      setIsAdding(false);
      setNewBatch({ name: '', status: 'Preparation Phase', startDate: '', gradDate: '', totalStudents: 0, placed: 0 });
      showToast('Batch created successfully.', 'success');
    } catch (e: any) {
      showToast('Failed to create batch.', 'error');
    }
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Batch Management</h2>
          <p style={{ fontSize: '0.85rem', color: '#1E293B', margin: '0.25rem 0 0 0' }}>Track academic batches, monitor placement progress, and manage cohorts.</p>
        </div>
        <button onClick={() => setIsAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>
          <Plus size={16} /> Create Batch
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ color: '#1E293B', fontWeight: 800 }}>Loading batches...</div>
        ) : batches.length === 0 ? (
          <div style={{ color: '#0F172A', fontWeight: 800, textAlign: 'center', padding: '2rem', backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A' }}>
            No batches found. Please create a new batch to track placement progress.
          </div>
        ) : batches.filter(b => (b.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((batch) => {
          const placementPercentage = Math.round(((batch.placed || 0) / (batch.totalStudents || 1)) * 100);
          return (
            <div key={batch.id} style={{ backgroundColor: '#FAF6EE', borderRadius: '1rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: 'rgba(225, 29, 72, 0.1)', border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={24} color="#E11D48" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: '#0F172A', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{batch.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: getStatusColor(batch.status) }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(batch.status) }}></span>
                      {batch.status}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#1E293B', fontWeight: 700, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}><Calendar size={12} color="#E11D48"/> Timeline</div>
                    <div style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 800 }}>{batch.startDate} - {batch.gradDate}</div>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', borderRadius: '0.75rem', padding: '1.5rem', border: '2px solid #0F172A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 800, marginBottom: '0.25rem' }}>Placement Progress</div>
                    <div style={{ fontSize: '0.75rem', color: '#1E293B', fontWeight: 700 }}>{batch.placed} out of {batch.totalStudents} students placed</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#E11D48' }}>{placementPercentage}%</div>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: '#FFFFFF', border: '2px solid #0F172A', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${placementPercentage}%`, height: '100%', backgroundColor: '#E11D48', borderRadius: '5px' }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '450px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Create New Cohort Batch</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Batch Name</label>
              <input type="text" value={newBatch.name} onChange={(e) => setNewBatch({...newBatch, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none' }} placeholder="e.g. Computer Science 2026" />
            </div>

            <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Start Date</label>
                    <input type="date" value={newBatch.startDate} onChange={(e) => setNewBatch({...newBatch, startDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none', colorScheme: 'light' }} />
                </div>
                <div>
                    <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Graduation Date</label>
                    <input type="date" value={newBatch.gradDate} onChange={(e) => setNewBatch({...newBatch, gradDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none', colorScheme: 'light' }} />
                </div>
            </div>

            <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Total Students</label>
                    <input type="number" value={newBatch.totalStudents} onChange={(e) => setNewBatch({...newBatch, totalStudents: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none' }} />
                </div>
                <div>
                    <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Initial Placed</label>
                    <input type="number" value={newBatch.placed} onChange={(e) => setNewBatch({...newBatch, placed: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none' }} />
                </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Batch Status</label>
              <select value={newBatch.status} onChange={(e) => setNewBatch({...newBatch, status: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none' }}>
                <option value="Preparation Phase">Preparation Phase</option>
                <option value="Active Hiring">Active Hiring</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid #0F172A', color: '#0F172A', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateBatch} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #E11D48', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Create Batch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
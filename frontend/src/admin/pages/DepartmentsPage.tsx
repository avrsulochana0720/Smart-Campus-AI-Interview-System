import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Search, Plus, Building2, Users, FileText, ChevronRight } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function DepartmentsPage() {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: '', head: '', activeRoles: 0, candidates: 0 });
  const [expandedDeptId, setExpandedDeptId] = useState<number | null>(null);

  const handleAddDepartment = () => {
    if (!newDepartment.name) {
      showToast('Department name is required.', 'error');
      return;
    }
    const added = { ...newDepartment, id: Date.now() };
    setDepartments([added, ...departments]);
    setIsAdding(false);
    setNewDepartment({ name: '', head: '', activeRoles: 0, candidates: 0 });
    showToast('Department added successfully.', 'success');
  };

  useEffect(() => {
    adminAPI.getDepartments().then(res => {
      setDepartments(res || []);
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Departments</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Manage university departments, hiring requisitions, and allocations.</p>
        </div>
        <button onClick={() => setIsAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div style={{ display: 'flex', marginBottom: '1.5rem', backgroundColor: '#0D1322', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1E293B' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search departments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', color: '#FFFFFF', fontSize: '0.85rem', outline: 'none' }} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ color: '#64748B' }}>Loading departments...</div>
        ) : departments.filter(d => (d.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((dept) => (
          <div key={dept.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0D1322', borderRadius: '0.75rem', border: '1px solid #1E293B', transition: 'transform 0.2s', overflow: 'hidden' }}>
            <div onClick={() => setExpandedDeptId(expandedDeptId === dept.id ? null : dept.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#111827'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={24} color="#3B82F6" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 600, margin: '0 0 0.25rem 0' }}>{dept.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>Head: <span style={{ color: '#E2E8F0' }}>{dept.head || 'Unassigned'}</span></p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '3rem' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={16} color="#64748B"/> {dept.candidates || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>Total Candidates</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={16} color="#64748B"/> {dept.activeRoles || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>Active Roles</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', transform: expandedDeptId === dept.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                  <ChevronRight size={20} color="#64748B" />
                </div>
              </div>
            </div>
            
            {expandedDeptId === dept.id && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid #1E293B', backgroundColor: '#111827' }}>
                <h4 style={{ color: '#FFFFFF', fontSize: '1rem', margin: '0 0 1rem 0' }}>Advanced Department Metrics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={{ backgroundColor: '#1E293B', padding: '1rem', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.25rem' }}>Hiring Velocity</div>
                    <div style={{ fontSize: '1.25rem', color: '#3B82F6', fontWeight: 600 }}>14 Days</div>
                    <div style={{ fontSize: '0.7rem', color: '#22C55E' }}>+12% vs last quarter</div>
                  </div>
                  <div style={{ backgroundColor: '#1E293B', padding: '1rem', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.25rem' }}>Offer Acceptance Rate</div>
                    <div style={{ fontSize: '1.25rem', color: '#F59E0B', fontWeight: 600 }}>86%</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Average</div>
                  </div>
                  <div style={{ backgroundColor: '#1E293B', padding: '1rem', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.25rem' }}>Active Requisitions</div>
                    <div style={{ fontSize: '1.25rem', color: '#E2E8F0', fontWeight: 600 }}>{dept.activeRoles || 0} Open Roles</div>
                    <button onClick={(e) => { e.stopPropagation(); showToast('Viewing active requisitions...', 'info'); }} style={{ marginTop: '0.5rem', background: 'transparent', border: '1px solid #3B82F6', color: '#3B82F6', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer' }}>View Roles</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#0D1322', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #1E293B', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#FFF', margin: '0 0 1.5rem 0' }}>Add New Department</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Department Name</label>
              <input type="text" value={newDepartment.name} onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', color: '#FFF', outline: 'none' }} placeholder="e.g. Marketing" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Department Head</label>
              <input type="text" value={newDepartment.head} onChange={(e) => setNewDepartment({...newDepartment, head: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', color: '#FFF', outline: 'none' }} placeholder="Jane Doe" />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #334155', color: '#94A3B8', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddDepartment} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#3B82F6', border: 'none', color: '#FFF', borderRadius: '0.5rem', cursor: 'pointer' }}>Add Department</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

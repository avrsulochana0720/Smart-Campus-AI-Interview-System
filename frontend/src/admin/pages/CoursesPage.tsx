import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Search, Plus, BookOpen, Users, BrainCircuit, PlayCircle, MoreHorizontal } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function CoursesPage() {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', modules: 12 });
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleCreateCourse = async () => {
    if (!newCourse.title) {
      showToast('Course title is required.', 'error');
      return;
    }
    try {
      const created = await adminAPI.createCourse({
        title: newCourse.title,
        modules: newCourse.modules
      });
      setCourses([created, ...courses]);
      setIsAdding(false);
      setNewCourse({ title: '', modules: 12 });
      showToast('Course created successfully.', 'success');
    } catch (e: any) {
      showToast('Failed to create course.', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCourse) return;
    try {
      const updated = await adminAPI.updateCourse(editingCourse.id, {
        title: editingCourse.title,
        modules: editingCourse.modules
      });
      setCourses(courses.map(c => c.id === editingCourse.id ? { ...editingCourse, ...updated } : c));
      setEditingCourse(null);
      showToast('Course updated successfully.', 'success');
    } catch (e: any) {
      showToast('Failed to update course.', 'error');
    }
  };

  useEffect(() => {
    adminAPI.getCourses().then(res => {
      setCourses(res || []);
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Courses & Tracks</h2>
          <p style={{ fontSize: '0.85rem', color: '#1E293B', margin: '0.25rem 0 0 0' }}>Manage preparation courses and track candidate performance by module.</p>
        </div>
        <button onClick={() => setIsAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>
          <Plus size={16} /> Create Course
        </button>
      </div>

      <div style={{ display: 'flex', marginBottom: '1.5rem', backgroundColor: '#FAF6EE', padding: '1rem', borderRadius: '0.75rem', border: '2px solid #0F172A' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={16} color="#E11D48" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search courses..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ color: '#1E293B', fontWeight: 800 }}>Loading courses...</div>
        ) : courses.filter(c => (c.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map((course) => (
          <div key={course.id} style={{ backgroundColor: '#FAF6EE', borderRadius: '0.75rem', border: '2px solid #0F172A', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', position: 'relative' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: 'rgba(225, 29, 72, 0.1)', border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={20} color="#E11D48" />
              </div>
              <button onClick={() => setActiveMenuId(activeMenuId === course.id ? null : course.id)} style={{ background: 'transparent', border: 'none', color: '#0F172A', cursor: 'pointer' }}>
                <MoreHorizontal size={18} />
              </button>
              {activeMenuId === course.id && (
                <div style={{ position: 'absolute', right: '0', top: '2.5rem', backgroundColor: '#FAF6EE', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.25rem', zIndex: 10, minWidth: '120px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
                  <div onClick={() => { showToast('Course archived.', 'warning'); setActiveMenuId(null); setCourses(courses.filter(c => c.id !== course.id)); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#EF4444', fontWeight: 800, cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    Archive Course
                  </div>
                  <div onClick={() => { setEditingCourse(course); setActiveMenuId(null); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#0F172A', fontWeight: 800, cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    Edit Course
                  </div>
                </div>
              )}
            </div>
            <h3 style={{ fontSize: '1.1rem', color: '#0F172A', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{course.title || 'General Curriculum'}</h3>
            <p style={{ fontSize: '0.75rem', color: '#E11D48', margin: '0 0 1.5rem 0', fontWeight: 800 }}>{course.id}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', flex: 1 }}>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                <div style={{ fontSize: '0.7rem', color: '#1E293B', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={12} color="#E11D48"/> Enrolled</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{course.enrolled}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                <div style={{ fontSize: '0.7rem', color: '#1E293B', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><BrainCircuit size={12} color="#E11D48"/> Avg AI Score</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: course.avgScore > 80 ? '#22C55E' : '#F59E0B' }}>{course.avgScore}%</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #0F172A', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PlayCircle size={14} color="#E11D48" /> {course.modules} Modules
              </span>
              <button onClick={() => setEditingCourse(course)} style={{ backgroundColor: 'transparent', color: '#E11D48', border: 'none', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Edit Course</button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Create New Course</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Course Title</label>
              <input type="text" value={newCourse.title} onChange={(e) => setNewCourse({...newCourse, title: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none' }} placeholder="e.g. Full Stack Engineering" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Number of Modules</label>
              <input type="number" value={newCourse.modules} onChange={(e) => setNewCourse({...newCourse, modules: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none' }} min="1" />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid #0F172A', color: '#0F172A', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateCourse} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #E11D48', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Create Course</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCourse && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Edit Course Data</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Course Title</label>
              <input type="text" value={editingCourse.title} onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Enrolled</label>
                    <input type="number" value={editingCourse.enrolled} onChange={(e) => setEditingCourse({...editingCourse, enrolled: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none' }} />
                </div>
                <div>
                    <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Modules</label>
                    <input type="number" value={editingCourse.modules} onChange={(e) => setEditingCourse({...editingCourse, modules: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none' }} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setEditingCourse(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid #0F172A', color: '#0F172A', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #E11D48', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
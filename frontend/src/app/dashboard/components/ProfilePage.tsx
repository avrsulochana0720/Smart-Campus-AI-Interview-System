import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Building,
  Calendar, Target, TrendingUp, Activity, Star, Edit, Camera,
  FileText, Eye, Download, Upload, Clock, CheckCircle, ChevronRight, X, Lock
} from 'lucide-react';

/* ── small SVG icon for </> ── */
function CodeIcon({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   PROFILE PAGE – exact replica of reference design
   ═══════════════════════════════════════════════ */
export default function ProfilePage({ interviewHistory = [], loading: parentLoading = false, onNavigate }: { interviewHistory?: any[], loading?: boolean, onNavigate?: (sec: string) => void }) {

  // ── state ──
  const [profile, setProfile] = useState({ 
    name: '', email: '', phone: '', role: '', department: '', location: '',
    skills: [] as string[],
    education: [] as string[],
    projects: [] as string[],
    experience: [] as string[],
    certifications: [] as string[]
  });
  const [resume, setResume] = useState<any>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // ── fetch profile from backend ──
  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:8000/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const p = {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '+91 98765 43210',
        role: data.role || 'Full Stack Developer',
        department: data.department || 'Computer Science',
        location: data.location || 'Location Not Set',
        skills: data.skills || [],
        education: data.education || [],
        projects: data.projects || [],
        experience: data.experience || [],
        certifications: data.certifications || []
      };
      setProfile(p);
      setForm(f => ({ ...f, name: p.name, email: p.email, phone: p.phone, location: p.location || '' }));
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchProfileData();
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/my-resume', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) setResume(res.data);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  // ── save handler ──
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setErrMsg('Passwords do not match');
      setStatus('error');
      return;
    }
    setStatus('saving');
    setErrMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/user-settings', {
        settings: {
          profile: {
            name: form.name,
            email: form.email,
            phone_number: form.phone,
            location: form.location
          },
          password: form.newPassword ? {
            current_password: form.currentPassword,
            new_password: form.newPassword
          } : undefined
        }
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus('saved');
      setProfile(p => ({ ...p, name: form.name, email: form.email, phone: form.phone, location: form.location }));
      setTimeout(() => {
        setEditOpen(false);
        setStatus('idle');
        setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
      }, 800);
    } catch (err: any) {
      setStatus('error');
      setErrMsg(err?.response?.data?.detail || 'Save failed');
    }
  };

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('http://localhost:8000/upload-resume', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setResume(res.data);
      await fetchProfileData();
      alert("Resume uploaded successfully! Profile updated from resume data.");
    } catch (err: any) {
      alert("Error uploading resume: " + (err?.response?.data?.detail || err.message));
    } finally {
      setUploadingResume(false);
    }
  };

  // ── spinner ──
  if (loading || parentLoading) {
    return (
      <div style={S.center}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 36, height: 36, border: '3px solid #E8E5DE', borderTopColor: '#DC2626', borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
      </div>
    );
  }

  const completedInterviews = interviewHistory.filter((item: any) => item.status === 'completed');
  const totalInterviews = completedInterviews.length;

  const validScores = completedInterviews.map((item: any) => {
    let score = item.report?.final_interview_score || item.report?.hiring_readiness_score || 0;
    if (score === 0) {
      score = item.average_score || 0;
      if (score > 0 && score <= 10) {
        score = score * 10;
      }
    } else if (score > 0 && score <= 10) {
      score = score * 10;
    }
    return Math.round(score);
  }).filter(s => s > 0);

  const avgScore = validScores.length
    ? Math.round(validScores.reduce((acc, s) => acc + s, 0) / validScores.length)
    : 0;

  const placementReadiness = avgScore;

  const lastInt = interviewHistory.length > 0 ? interviewHistory[0] : null;
  const lastInterviewDate = lastInt ? new Date(lastInt.date).toLocaleDateString() : 'None';
  const lastInterviewRole = lastInt ? lastInt.job_role : 'N/A';
  const currentRole = lastInt?.job_role || profile.role || 'Not Set';
  const currentCompany = lastInt?.company || 'Not Set';

  const calculateProfileCompletion = () => {
    const fields = [
      profile.name,
      profile.email,
      profile.phone,
      profile.location,
      profile.department,
      profile.skills && profile.skills.length > 0,
      profile.education && profile.education.length > 0,
      profile.experience && profile.experience.length > 0
    ];
    const filled = fields.filter(f => f && f !== 'Not Found' && f !== 'Location Not Set' && f !== 'Not Set').length;
    return Math.round((filled / fields.length) * 100);
  };
  const profileCompletion = calculateProfileCompletion();

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ─────────── EDIT MODAL ─────────── */}
      {editOpen && (
        <div style={S.overlay}>
          <div style={S.modal}>
            {/* modal header */}
            <div style={S.modalHead}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit size={17} color="#DC2626" /> Edit Profile
              </h2>
              <button onClick={() => setEditOpen(false)} style={S.closeBtn}><X size={20} /></button>
            </div>

            <form onSubmit={save} style={{ padding: 24 }}>
              {status === 'error' && <div style={{ ...S.toast, background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>{errMsg}</div>}
              {status === 'saved' && <div style={{ ...S.toast, background: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> Updated!</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <Field label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
                <Field label="Phone Number" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
                <Field label="Location" value={form.location || ''} onChange={v => setForm(f => ({ ...f, location: v }))} />
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 18, marginBottom: 18 }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={14} color="#64748B" /> Change Password
                </p>
                <div style={{ display: 'grid', gap: 12 }}>
                  <Field label="Current Password" value={form.currentPassword} onChange={v => setForm(f => ({ ...f, currentPassword: v }))} type="password" placeholder="••••••••" />
                  <Field label="New Password" value={form.newPassword} onChange={v => setForm(f => ({ ...f, newPassword: v }))} type="password" placeholder="••••••••" />
                  <Field label="Confirm Password" value={form.confirmPassword} onChange={v => setForm(f => ({ ...f, confirmPassword: v }))} type="password" placeholder="••••••••" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #F1F5F9', paddingTop: 18 }}>
                <button type="button" onClick={() => setEditOpen(false)} style={S.btnGhost}>Cancel</button>
                <button type="submit" disabled={status === 'saving'} style={S.btnRed}>{status === 'saving' ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={S.inner}>

        {/* ═══ 1. PAGE HEADER ═══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>My Profile</h1>
            <p style={{ margin: '5px 0 0', fontSize: 14, fontWeight: 600, color: '#334155' }}>View and manage your profile details</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>Profile Completion</span>
              <div style={{ width: 120, height: 8, background: '#E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ width: `${profileCompletion}%`, height: '100%', background: '#10B981', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#10B981' }}>{profileCompletion}%</span>
            </div>
            <button onClick={() => setEditOpen(true)} style={S.editBtn}>
              <Edit size={16} strokeWidth={2.5} /> Edit Profile
            </button>
          </div>
        </div>

        {/* ═══ 2. PROFILE OVERVIEW CARD ═══ */}
        <div style={{ ...S.card, padding: '28px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 0.85fr', gap: 0 }}>

            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, paddingRight: 32 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={S.avatar}><User size={40} color="#94A3B8" /></div>
                <div style={S.cameraBadge}><Camera size={12} color="#64748B" /></div>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#B91C1C' }}>{profile.name}</h2>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                  <Row icon={<Mail size={16} color="#0F172A" strokeWidth={2.5} />} text={profile.email} />
                  <Row icon={<Phone size={16} color="#0F172A" strokeWidth={2.5} />} text={profile.phone} />
                  <Row icon={<MapPin size={16} color="#0F172A" strokeWidth={2.5} />} text={profile.location || 'Location Not Set'} />
                </div>
              </div>
            </div>

            {/* Middle */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', gap: 18, borderLeft: '2px solid #E2E8F0', paddingLeft: 32, paddingRight: 32 }}>
              <InfoRow icon={<Briefcase size={16} color="#0F172A" strokeWidth={2.5} />} label="Top Position" value={<span style={{ color: '#B91C1C', fontWeight: 800 }}>{currentRole}</span>} />
              <InfoRow icon={<Building size={16} color="#0F172A" strokeWidth={2.5} />} label="Company" value={currentCompany} />
              <InfoRow icon={<GraduationCap size={16} color="#0F172A" strokeWidth={2.5} />} label="Department" value={profile.department || 'Not Set'} />
            </div>

            {/* Right */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', gap: 18, borderLeft: '2px solid #E2E8F0', paddingLeft: 32 }}>
              <InfoRow icon={<Target size={16} color="#0F172A" strokeWidth={2.5} />} label="Core Strength" value={resume?.analysis?.system ? (resume.analysis.system.length > 25 ? resume.analysis.system.slice(0, 25) + '...' : resume.analysis.system) : 'Upload Resume'} />
              <InfoRow icon={<Activity size={16} color="#0F172A" strokeWidth={2.5} />} label="Career Motive" value={resume?.analysis?.motive ? (resume.analysis.motive.length > 25 ? resume.analysis.motive.slice(0, 25) + '...' : resume.analysis.motive) : 'Upload Resume'} />
              <InfoRow icon={<Star size={16} color="#0F172A" strokeWidth={2.5} />} label="Top Impact" value={resume?.analysis?.impact ? (resume.analysis.impact.length > 25 ? resume.analysis.impact.slice(0, 25) + '...' : resume.analysis.impact) : 'Upload Resume'} />
            </div>
          </div>
        </div>

        {/* ═══ 3. STAT CARDS ROW ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
          <StatCard icon={<Briefcase size={22} strokeWidth={2.5} />} iconBg="#FEF2F2" iconColor="#B91C1C" value={totalInterviews.toString()} label="Total Interviews" sub="Completed" />
          <StatCard icon={<TrendingUp size={22} strokeWidth={2.5} />} iconBg="#F0FDF4" iconColor="#15803D" value={`${avgScore}%`} label="Average Score" sub="Across Interviews" />
          <StatCard icon={<Activity size={22} strokeWidth={2.5} />} iconBg="#F0F9FF" iconColor="#0369A1" value={totalInterviews.toString()} label="AI Assessments" sub="Completed" />
          <StatCard icon={<Star size={22} strokeWidth={2.5} />} iconBg="#FFFBEB" iconColor="#B45309" value={`${placementReadiness}%`} label="Placement Readiness" sub={placementReadiness >= 80 ? "Very Good" : placementReadiness >= 60 ? "Good" : "Needs Work"} subColor={placementReadiness >= 80 ? "#15803D" : placementReadiness >= 60 ? "#B45309" : "#B91C1C"} />
          <StatCard icon={<Calendar size={22} strokeWidth={2.5} />} iconBg="#EFF6FF" iconColor="#1D4ED8" value={lastInterviewDate} label="Last Interview" sub={lastInterviewRole} smallVal />
        </div>

        {/* ═══ 4-5-6. THREE COLUMNS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* 4 · Profile Summary */}
          <div style={{ ...S.card, padding: '26px 28px' }}>
            <h3 style={S.secTitle}><User size={18} strokeWidth={2.5} color="#B91C1C" /> Profile Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
              {([
                ['Full Name', profile.name || 'Not Set'],
                ['Email', profile.email || 'Not Set'],
                ['Phone', profile.phone || 'Not Set'],
                ['Location', profile.location || 'Not Set'],
                ['Department', profile.department || 'Not Set'],
                ['Top Skill', (profile.skills && profile.skills.length > 0) ? profile.skills[0] : 'N/A'],
              ] as const).map(([l, v], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#334155' }}>{l}</span>
                  <span style={{ fontSize: 13.5, color: '#0F172A', fontWeight: 800 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5 · Skills & Background */}
          <div style={{ ...S.card, padding: '26px 28px', display: 'flex', flexDirection: 'column' as const }}>
            <h3 style={S.secTitle}><CodeIcon s={18} /> Skills & Background</h3>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 18, flex: 1, overflowY: 'auto' as const, maxHeight: 200, paddingRight: 5 }}>
              
              {/* Skills */}
              {profile.skills && profile.skills.length > 0 ? (
                <div>
                  <p style={{ margin: '0 0 9px', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Core Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7 }}>
                    {profile.skills.slice(0, 8).map((s: string) => (
                      <span key={s} style={S.pill}>{s}</span>
                    ))}
                    {profile.skills.length > 8 && <span style={S.pill}>+{profile.skills.length - 8}</span>}
                  </div>
                </div>
              ) : (
                <div style={{ opacity: 0.5 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#334155' }}>No skills extracted yet.</p>
                </div>
              )}

              {/* Education */}
              {profile.education && profile.education.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 9px', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Education</p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#334155', fontWeight: 600 }}>
                    {profile.education.slice(0, 2).map((edu: string, i: number) => <li key={i}>{edu}</li>)}
                  </ul>
                </div>
              )}

              {/* Experience */}
              {profile.experience && profile.experience.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 9px', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Experience</p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#334155', fontWeight: 600 }}>
                    {profile.experience.slice(0, 2).map((exp: string, i: number) => <li key={i}>{exp}</li>)}
                  </ul>
                </div>
              )}

            </div>
          </div>

          {/* 6 · Recent Activity */}
          <div style={{ ...S.card, padding: '26px 28px', display: 'flex', flexDirection: 'column' as const }}>
            <h3 style={S.secTitle}><Clock size={18} strokeWidth={2.5} color="#B91C1C" /> Recent Activity</h3>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 18 }}>
              {interviewHistory.slice(0, 5).map((activity: any, i: number) => {
                 const d = new Date(activity.date);
                 const today = new Date();
                 const diffTime = Math.abs(today.getTime() - d.getTime());
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 const timeStr = diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
                 const colors = ['#B91C1C', '#1D4ED8', '#6D28D9', '#B45309', '#15803D'];

                 return (
                   <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                     <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                       <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[i % colors.length], marginTop: 5, flexShrink: 0, border: '1px solid #0F172A' }} />
                       <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1.5 }}>Interview completed - {activity.job_role}</span>
                     </div>
                     <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>{timeStr}</span>
                   </div>
                 );
              })}
              {interviewHistory.length === 0 && (
                 <p style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>No recent activity.</p>
              )}
            </div>
            <button onClick={() => onNavigate ? onNavigate('interviews') : alert('Navigate to activity')} style={S.linkBtn}>
              View All Activity <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ═══ 7. RESUME OVERVIEW ═══ */}
        <div style={{ ...S.card, padding: '26px 32px' }}>
          <h3 style={S.secTitle}><FileText size={18} strokeWidth={2.5} color="#B91C1C" /> Resume Overview</h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 24 }}>

            {/* file */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} strokeWidth={2.5} color="#B91C1C" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  {resume ? 'Uploaded Resume' : 'No Resume Uploaded'}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  {resume ? `Uploaded on ${new Date(resume.uploaded_at).toLocaleDateString()}` : 'Upload to unlock features'}
                </p>
              </div>
            </div>

            {/* scores */}
            {resume ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 36 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#334155' }}>Skills Found</p>
                  <p style={{ margin: '2px 0 0', fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
                    {resume.skills ? Object.keys(resume.skills).length : 0}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#334155' }}>Status</p>
                  <span style={{ background: '#F0FDF4', color: '#15803D', padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 800, border: '2px solid #0F172A', boxShadow: '2px 2px 0px #0F172A' }}>Analyzed</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 36, opacity: 0.5 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#334155' }}>Resume required to calculate ATS scores.</p>
              </div>
            )}

            {/* action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {resume && (
                <>
                  <button onClick={() => alert("Previewing resume text:\n\n" + resume.text_preview)} style={S.resumeBtnOutline}><Eye size={15} strokeWidth={2.5} /> View</button>
                  <button onClick={() => {
                     const blob = new Blob([resume.text_preview], { type: 'text/plain' });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = 'resume.txt';
                     a.click();
                  }} style={S.resumeBtnGhost}><Download size={15} strokeWidth={2.5} /> Download</button>
                </>
              )}
              <label style={S.resumeBtnFill}>
                <Upload size={15} strokeWidth={2.5} /> {uploadingResume ? 'Uploading...' : 'Upload New'}
                <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleUploadResume} disabled={uploadingResume} />
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════
   SMALL REUSABLE SUB-COMPONENTS
   ══════════════════════════════ */

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span style={{ fontSize: 14, color: '#0F172A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>{icon} {text}</span>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
      <span style={{ marginTop: 2 }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: 13, color: '#334155', fontWeight: 700 }}>{label}</p>
        <p style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 800, color: typeof value === 'string' ? '#0F172A' : undefined }}>{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, iconColor, value, label, sub, subColor, smallVal }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  value: string; label: string; sub: string; subColor?: string; smallVal?: boolean;
}) {
  return (
    <div
      style={S.statCard}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,.04)'; }}
    >
      <div style={{ width: 50, height: 50, borderRadius: 12, background: iconBg, border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 13, color: '#334155', fontWeight: 700 }}>{label}</p>
        <p style={{ margin: '3px 0 0', fontSize: smallVal ? 17 : 24, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>{value}</p>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: subColor || '#334155', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '.3px' }}>{sub}</p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '.4px', marginBottom: 5 }}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '9px 13px', borderRadius: 7, border: '1px solid #E2E8F0', fontSize: 13.5, fontWeight: 500, color: '#0F172A', outline: 'none', boxSizing: 'border-box' as const, background: '#FAFAF9' }}
      />
    </div>
  );
}

/* ═══════════════════
   STYLE CONSTANTS
   ═══════════════════ */
const S: Record<string, React.CSSProperties> = {
  page: {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    background: '#FAF6EE',
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
  },
  inner: {
    width: '100%',
    padding: '28px 36px 52px',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    background: '#FAF6EE',
  },

  /* cards */
  card: {
    background: '#FFFFFF',
    borderRadius: 14,
    border: '2px solid #0F172A',
    padding: '24px 28px',
    marginBottom: 20,
    boxShadow: '3px 3px 0px #0F172A',
  },
  secTitle: {
    margin: '0 0 20px',
    fontSize: 16,
    fontWeight: 900,
    color: '#0F172A',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
  },

  /* stat cards */
  statCard: {
    background: '#fff',
    borderRadius: 14,
    border: '2px solid #0F172A',
    padding: '20px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow: '3px 3px 0px #0F172A',
    transition: 'box-shadow .2s',
    cursor: 'default',
  },

  /* avatar */
  avatar: {
    width: 84,
    height: 84,
    borderRadius: '50%',
    background: '#E8E5DE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #D6D3CC',
  },
  cameraBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#fff',
    border: '1px solid #D6D3CC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,.1)',
  },

  pill: {
    background: '#F1F5F9',
    color: '#0F172A',
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 12.5,
    fontWeight: 800,
    border: '2px solid #0F172A',
    boxShadow: '1px 1px 0px #0F172A',
  },

  linkBtn: {
    marginTop: 14,
    background: 'none',
    border: 'none',
    color: '#B91C1C',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    textAlign: 'left' as const,
  },

  editBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 8,
    border: '2px solid #0F172A',
    background: '#fff',
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '3px 3px 0px #0F172A',
  },

  resumeBtnOutline: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '10px 20px',
    borderRadius: 8,
    border: '2px solid #B91C1C',
    background: '#fff',
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '2px 2px 0px #B91C1C',
  },
  resumeBtnGhost: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '10px 20px',
    borderRadius: 8,
    border: '2px solid #0F172A',
    background: '#fff',
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '2px 2px 0px #0F172A',
  },
  resumeBtnFill: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '10px 20px',
    borderRadius: 8,
    border: '2px solid #0F172A',
    background: '#B91C1C',
    color: '#fff',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '2px 2px 0px #0F172A',
  },

  /* modal */
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15,23,42,.45)',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#fff',
    borderRadius: 14,
    width: '100%',
    maxWidth: 520,
    maxHeight: '88vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 40px rgba(0,0,0,.15)',
  },
  modalHead: {
    padding: '18px 22px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky' as const,
    top: 0,
    background: '#fff',
    zIndex: 1,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94A3B8',
    padding: 0,
  },
  toast: {
    padding: '9px 13px',
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 600,
    marginBottom: 14,
    border: '1px solid',
  },
  btnGhost: {
    padding: '8px 18px',
    borderRadius: 7,
    border: '1px solid #E2E8F0',
    background: '#fff',
    color: '#475569',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnRed: {
    padding: '8px 18px',
    borderRadius: 7,
    border: 'none',
    background: '#DC2626',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
};

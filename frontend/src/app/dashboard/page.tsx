import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { User } from "lucide-react";
import { jsPDF } from 'jspdf';
import styles from "../../styles/dashboard.module.css";
import Navbar from "../components/Navbar";
import axios from "axios";
import InterviewsPage from "./components/InterviewsPage";
import AssessmentsPage from "./components/AssessmentsPage";
import AnalyticsPage from "./components/AnalyticsPage";
import FeedbackPage from "./components/FeedbackPage";
import SettingsPage from "./components/SettingsPage";

interface QA {
  question: string;
  answer: string;
  score: number;
  feedback?: string;
  question_type?: string;
}

interface Interview {
  interview_id: number;
  job_role: string;
  company: string;
  date: string;
  qa_list: QA[];
  total_score: number;
  average_score: number;
  report?: {
    narrative_summary: string;
    strengths: string;
    recommendation: string;
    proctoring_analysis?: any;
    hiring_readiness_score?: number;
    skill_gap_analysis?: string;
  };
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [interviewHistory, setInterviewHistory] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // Fetch user profile from token (decode JWT sub = email, stored name)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Decode JWT payload (base64)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserProfile({
          id: payload.user_id || 0,
          name: payload.name || payload.sub?.split('@')[0] || 'User',
          email: payload.sub || '',
        });
      } catch (_) {
        // silently fail
      }
    }
    // Always fetch interview history on mount
    fetchInterviewHistory();
  }, []);

  const fetchInterviewHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/interview-history", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setInterviewHistory(response.data);
    } catch (error) {
      console.error("Error fetching interview history:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdfReport = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = 50;

    doc.setFontSize(18);
    doc.text('SmartInterview Dashboard Report', margin, y);
    y += 30;
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 20;

    doc.setFontSize(12);
    doc.text('Summary', margin, y);
    y += 20;
    doc.setFontSize(10);
    doc.text(`Total Interviews: ${totalInterviews}`, margin, y);
    y += 16;
    doc.text(`QA Volume: ${qaVolume}`, margin, y);
    y += 16;
    doc.text(`Avg Score: ${overallAvg > 0 ? `${overallAvg.toFixed(1)} / 10` : 'N/A'}`, margin, y);
    y += 16;
    doc.text(`Overall Performance: ${overallPct > 0 ? `${overallPct}%` : 'N/A'}`, margin, y);
    y += 16;
    doc.text(`Pass Rate: ${passRate > 0 ? `${passRate}%` : 'N/A'}`, margin, y);
    y += 30;

    if (interviewHistory.length > 0) {
      const latest = interviewHistory[0];
      doc.setFontSize(12);
      doc.text('Latest Interview', margin, y);
      y += 20;
      doc.setFontSize(10);
      doc.text(`Position: ${latest.job_role} @ ${latest.company}`, margin, y);
      y += 16;
      doc.text(`Date: ${new Date(latest.date).toLocaleDateString()}`, margin, y);
      y += 16;
      doc.text(`Average Score: ${Math.round(latest.average_score * 10)}%`, margin, y);
      y += 30;
      doc.setFontSize(11);
      doc.text('Top Feedback', margin, y);
      y += 18;
      const narrative = latest.report?.narrative_summary || 'No narrative summary available.';
      const lines = doc.splitTextToSize(narrative, 500);
      doc.setFontSize(10);
      doc.text(lines, margin, y);
      y += lines.length * 15 + 10;
      
      if (latest.report?.skill_gap_analysis) {
        doc.setFontSize(11);
        doc.text('Skill Gap Analysis', margin, y);
        y += 18;
        const gapLines = doc.splitTextToSize(latest.report.skill_gap_analysis, 500);
        doc.setFontSize(10);
        doc.text(gapLines, margin, y);
      }
    } else {
      doc.setFontSize(10);
      doc.text('No interview data available yet. Complete an interview to generate report details.', margin, y);
    }

    doc.save('smartinterview-dashboard-report.pdf');
  };

  const handleSendEmail = async () => {
    if (interviewHistory.length > 0) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(`http://localhost:8000/send-report-email/${interviewHistory[0].interview_id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Email notification sent successfully!');
      } catch (error) {
        console.error("Error sending email:", error);
        alert('Failed to send email notification.');
      }
    }
  };

  useEffect(() => {
    if (activeSection === "reports" || activeSection === "interviews" || activeSection === "dashboard") {
      fetchInterviewHistory();
    }
  }, [activeSection]);

  // Compute real stats from history
  const totalInterviews = interviewHistory.length;
  const allQa = interviewHistory.flatMap(i => i.qa_list);
  const qaVolume = allQa.length;
  const passRate = totalInterviews ? Math.round((interviewHistory.filter(item => Math.round((item.average_score || 0) * 10) >= 70).length / totalInterviews) * 100) : 0;
  
  const overallAvg = qaVolume > 0 ? allQa.reduce((sum, qa) => sum + (qa.score || 0), 0) / qaVolume : 0;
  const overallPct = Math.round(overallAvg * 10); // score is /10, convert to %

  const techQa = allQa.filter(qa => qa.question_type === 'technical');
  const hrQa = allQa.filter(qa => qa.question_type === 'hr');
  const techAvg = techQa.length > 0 ? techQa.reduce((sum, qa) => sum + (qa.score || 0), 0) / techQa.length : 0;
  const hrAvg = hrQa.length > 0 ? hrQa.reduce((sum, qa) => sum + (qa.score || 0), 0) / hrQa.length : 0;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div>
            <h1 className={styles.logo}>SmartInterview</h1>
            <nav className={styles.nav}>
              <a
                className={`${styles.navItem} ${activeSection === "dashboard" ? styles.active : ""}`}
                onClick={() => setActiveSection("dashboard")}
                style={{ cursor: "pointer" }}
              >
                Dashboard
              </a>
              <a
                className={`${styles.navItem} ${activeSection === "profile" ? styles.active : ""}`}
                onClick={() => setActiveSection("profile")}
                style={{ cursor: "pointer" }}
              >
                Profile
              </a>
              <a
                className={`${styles.navItem} ${activeSection === "interviews" ? styles.active : ""}`}
                onClick={() => setActiveSection("interviews")}
                style={{ cursor: "pointer" }}
              >
                Interviews
              </a>

              <a
                className={`${styles.navItem} ${activeSection === "assessments" ? styles.active : ""}`}
                onClick={() => setActiveSection("assessments")}
                style={{ cursor: "pointer" }}
              >
                AI Assessments
              </a>

              <a
                className={`${styles.navItem} ${activeSection === "reports" ? styles.active : ""}`}
                onClick={() => setActiveSection("reports")}
                style={{ cursor: "pointer" }}
              >
                Reports
              </a>
              <a
                className={`${styles.navItem} ${activeSection === "feedback" ? styles.active : ""}`}
                onClick={() => setActiveSection("feedback")}
                style={{ cursor: "pointer" }}
              >
                Feedback
              </a>

              <a
                className={`${styles.navItem} ${activeSection === "settings" ? styles.active : ""}`}
                onClick={() => setActiveSection("settings")}
                style={{ cursor: "pointer" }}
              >
                Settings
              </a>

            </nav>
          </div>
          <div className={styles.profile} onClick={() => setActiveSection("profile")} style={{ cursor: 'pointer' }}>
            <div className={styles.avatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#DC2626', border: '2px solid #334155' }}>
              <User size={20} strokeWidth={2.5} />
            </div>
            <span className={styles.username}>{userProfile?.name || 'User'}</span>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {activeSection === "dashboard" && (
            <>
              {/* Header */}
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>Performance Nexus</h2>
                  <p className={styles.subtitle}>Comprehensive candidate performance analytics</p>
                  {interviewHistory.length > 0 && (
                    <p style={{ color: "#DC2626", marginTop: "0.5rem", fontSize: "0.95rem" }}>
                      Current Position: <strong>{interviewHistory[0].job_role}</strong> at <strong>{interviewHistory[0].company}</strong>
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className={styles.button} style={{ background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1' }} onClick={handleSendEmail}>Email Report</button>
                  <button className={styles.button} onClick={downloadPdfReport}>Download PDF</button>
                </div>
              </div>

              {/* Top Grid */}
              <div className={styles.grid}>
                <div className={styles.cardCenter}>
                  <h3 className={styles.cardTitle}>Overall Performance</h3>
                  <div 
                    className={styles.progressCircle}
                    style={{
                      background: `conic-gradient(#DC2626 ${overallPct * 3.6}deg, #E5E7EB 0deg)`
                    }}
                  >
                    <span className={styles.progressText}>
                      {loading ? '...' : (overallPct > 0 ? `${overallPct}%` : 'N/A')}
                    </span>
                  </div>
                  <p className={styles.accent}>
                    {overallPct >= 80 ? 'Elite Candidate' : overallPct >= 60 ? 'Good Candidate' : overallPct > 0 ? 'Keep Practicing' : 'No data yet'}
                  </p>
                </div>

                <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 className={styles.cardTitle} style={{ marginBottom: '0.25rem' }}>Interview Stats</h3>
                  
                  {/* Grid of Micro-stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                    
                    {/* Stat 1: Total Interviews */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#DC2626" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Total Sessions
                      </div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{totalInterviews}</span>
                    </div>

                    {/* Stat 2: QA Volume */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        QA Volume
                      </div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{qaVolume}</span>
                    </div>

                    {/* Stat 3: Avg Score */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#DC2626" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="6" />
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                        Avg Score
                      </div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>
                        {overallAvg > 0 ? `${overallAvg.toFixed(1)}/10` : 'N/A'}
                      </span>
                    </div>

                    {/* Stat 4: Pass Rate */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Pass Rate
                      </div>
                      <span 
                        style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: 800, 
                          color: passRate >= 80 ? '#10B981' : passRate >= 60 ? '#F59E0B' : '#64748B',
                        }}
                      >
                        {passRate > 0 ? `${passRate}%` : 'N/A'}
                      </span>
                    </div>

                    {/* Stat 5: Tech Score */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#0EA5E9" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                        Tech Score
                      </div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0EA5E9' }}>
                        {techAvg > 0 ? `${techAvg.toFixed(1)}/10` : 'N/A'}
                      </span>
                    </div>

                    {/* Stat 6: HR Score */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#8B5CF6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        HR Score
                      </div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8B5CF6' }}>
                        {hrAvg > 0 ? `${hrAvg.toFixed(1)}/10` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Latest Activity Strip */}
                  {interviewHistory.length > 0 && (
                    <div style={{ marginTop: '0.5rem', background: 'rgba(220, 38, 38, 0.03)', border: '1px dashed rgba(220, 38, 38, 0.2)', padding: '0.6rem 0.75rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
                      <svg viewBox="0 0 24 24" width="12" height="12" stroke="#DC2626" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Latest Assessment: <strong style={{ color: '#0F172A' }}>{new Date(interviewHistory[0].date).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Sectional Breakdown */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Latest Interview Performance</h3>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Your Answer</th>
                      <th>Score</th>
                      <th>Feedback</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviewHistory.length > 0 ? (
                      interviewHistory[0].qa_list.map((qa, i) => (
                        <tr key={i}>
                          <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>Question {i + 1}</td>
                          <td style={{ maxWidth: '250px', wordWrap: 'break-word', color: '#475569' }}>{qa.answer || 'Not answered'}</td>
                          <td className={styles.score}>{qa.score > 0 ? `${(qa.score * 10).toFixed(0)}%` : '--'}</td>
                          <td style={{ maxWidth: '200px', wordWrap: 'break-word', fontSize: '0.875rem', color: '#64748b' }}>{qa.feedback || 'Answer recorded'}</td>
                          <td className={styles.status}>{qa.score >= 5 ? '✔' : qa.score > 0 ? '◐' : '✘'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                          No data available. Complete an interview to see your breakdown.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Grid */}
              <div className={styles.grid}>
                <div className={styles.card}>
                <h3 className={styles.cardTitle}>AI Insights & Feedback</h3>
                {loading ? (
                  <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading...</p>
                ) : interviewHistory.length === 0 ? (
                  <p style={{ color: '#64748b', marginTop: '1rem' }}>Complete an interview to see insights here.</p>
                ) : (
                  <div>
                    <p style={{ color: '#475569', marginBottom: '0.75rem', lineHeight: '1.6' }}>
                      {interviewHistory[0].report?.narrative_summary
                        ? interviewHistory[0].report.narrative_summary.split('. ').slice(0, 2).join('. ') + '.'
                        : `Latest interview average score is ${Math.round(interviewHistory[0].average_score * 10)}% with clear room for improvement.`}
                    </p>
                    {interviewHistory[0].report?.skill_gap_analysis && (
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem', background: '#F8FAFC', borderLeft: '3px solid #F59E0B' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block', marginBottom: '0.25rem' }}>Skill Gap Analysis:</strong>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>{interviewHistory[0].report.skill_gap_analysis}</span>
                      </div>
                    )}
                    <p style={{ color: '#64748b', lineHeight: '1.6', fontWeight: 500 }}>
                      <strong style={{ color: '#DC2626' }}>Hiring Readiness: {interviewHistory[0].report?.hiring_readiness_score ?? (Math.round(interviewHistory[0].average_score * 10))}%</strong> — {interviewHistory[0].report?.recommendation
                        ? interviewHistory[0].report.recommendation
                        : 'Focus on stronger answer structure and more concise technical examples in the next session.'}
                    </p>
                  </div>
                )}
              </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Interview Summary</h3>
                  {interviewHistory.length === 0 ? (
                    <div className={styles.alert}>No interviews completed yet</div>
                  ) : (
                    <>
                      <div className={styles.alert}>
                        <strong>Position:</strong> {interviewHistory[0].job_role} @ {interviewHistory[0].company}
                      </div>
                      <div className={styles.alert}>
                        <strong>Date:</strong> {new Date(interviewHistory[0].date).toLocaleDateString()}
                      </div>
                      <div className={styles.alert}>
                        <strong>Average Score:</strong> {interviewHistory[0].average_score.toFixed(1)}/10 ({Math.round(interviewHistory[0].average_score * 10)}%)
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <footer className={styles.footer}>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact Support</a>
              </footer>
            </>
          )}

          {activeSection === "profile" && (
            <>
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>My Profile</h2>
                  <p className={styles.subtitle}>Manage your personal information</p>
                </div>
              </div>

              <div className={styles.card}>
                <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "2rem" }}>
                  <div style={{ width: "100px", height: "100px", borderRadius: "50%", border: "3px solid #E5E7EB", background: "#F1F5F9", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" style={{ width: "65px", height: "65px" }}>
                      <circle cx="12" cy="8" r="4" fill="currentColor"/>
                      <path d="M6 20c0-3 2.5-5 6-5s6 2 6 5" fill="currentColor"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{userProfile?.name || 'User'}</h3>
                    <p style={{ color: "#64748b" }}>{userProfile?.email || ''}</p>
                    {interviewHistory.length > 0 && (
                      <p style={{ color: "#DC2626", marginTop: '0.5rem', fontSize: '0.95rem' }}>
                        <strong>Top Position:</strong> {interviewHistory[0].job_role} @ {interviewHistory[0].company}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Full Name</label>
                    <input
                      type="text"
                      value={userProfile?.name || ''}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        color: "#1e293b",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Email</label>
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        color: "#1e293b",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Total Interviews Completed</label>
                    <input
                      type="text"
                      value={totalInterviews.toString()}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        color: "#1e293b",
                      }}
                    />
                  </div>


                  {interviewHistory.length > 0 && (
                    <>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Last Interview Position</label>
                        <input
                          type="text"
                          value={interviewHistory[0].job_role}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            border: "1px solid #cbd5e1",
                            background: "#f8fafc",
                            color: "#1e293b",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Last Interview Company</label>
                        <input
                          type="text"
                          value={interviewHistory[0].company}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            border: "1px solid #cbd5e1",
                            background: "#f8fafc",
                            color: "#1e293b",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Last Interview Date</label>
                        <input
                          type="text"
                          value={new Date(interviewHistory[0].date).toLocaleDateString()}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            border: "1px solid #cbd5e1",
                            background: "#f8fafc",
                            color: "#1e293b",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Last Interview Score</label>
                        <input
                          type="text"
                          value={interviewHistory[0].average_score.toFixed(1) + ' / 10 (' + (interviewHistory[0].average_score * 10).toFixed(0) + '%)'}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            border: "1px solid #cbd5e1",
                            background: "#f8fafc",
                            color: "#1e293b",
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {activeSection === "interviews" && (
            <div style={{ margin: "-1.5rem", height: "calc(100% + 3rem)" }}>
              <InterviewsPage interviewHistory={interviewHistory} loading={loading} />
            </div>
          )}


          {activeSection === "assessments" && (
            <div style={{ margin: "-1.5rem", height: "calc(100% + 3rem)" }}>
              <AssessmentsPage interviewHistory={interviewHistory} loading={loading} />
            </div>
          )}


          {activeSection === "reports" && (
            <div style={{ margin: "-1.5rem", height: "calc(100% + 3rem)" }}>
              <AnalyticsPage interviewHistory={interviewHistory} loading={loading} />
            </div>
          )}

          {activeSection === "feedback" && (
            <div style={{ margin: "-1.5rem", height: "calc(100% + 3rem)" }}>
              <FeedbackPage interviewHistory={interviewHistory} loading={loading} />
            </div>
          )}


          {activeSection === "settings" && (
            <div style={{ margin: "-1.5rem", height: "calc(100% + 3rem)" }}>
              <SettingsPage />
            </div>
          )}

        </main>
      </div>
    </>
  );
}
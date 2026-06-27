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
import ProfilePage from "./components/ProfilePage";
import { interviewAPI } from "../../utils/api";

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
  report_url?: string | null;
  report?: {
    narrative_summary: string;
    strengths: string;
    recommendation: string;
    proctoring_analysis?: any;
    hiring_readiness_score?: number;
    technical_score?: number;
    hr_score?: number;
    tech_communication_avg?: number;
    hr_communication_skills_avg?: number;
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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: null });
    }, 4000);
  };

  useEffect(() => {
    const section = searchParams.get("section");
    const tab = searchParams.get("tab");
    const target = section || tab;
    if (target) {
      const lowerTarget = target.toLowerCase();
      const validSections = ["dashboard", "profile", "interviews", "assessments", "reports", "feedback"];
      if (validSections.includes(lowerTarget)) {
        setActiveSection(lowerTarget);
      }
    }
  }, [searchParams]);

  // Fetch user profile from database
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await axios.get("http://localhost:8000/users/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserProfile(response.data);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };
    fetchProfile();
    fetchInterviewHistory();
  }, []);

  const fetchInterviewHistory = async () => {
    try {
      setLoading(true);
      const data = await interviewAPI.getHistory();
      setInterviewHistory(data);
    } catch (error) {
      console.error("Error fetching interview history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (interviewHistory.length > 0) {
      const interviewId = interviewHistory[0].interview_id;
      try {
        setIsSendingEmail(true);
        const token = localStorage.getItem("token");
        await axios.post(`http://localhost:8000/send-report-email/${interviewId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast("Interview report sent successfully to your email.", "success");
      } catch (error: any) {
        console.error("Error sending email:", error);
        const errMsg = error.response?.data?.detail || "Failed to send email notification.";
        showToast(errMsg, "error");
      } finally {
        setIsSendingEmail(false);
      }
    }
  };

  useEffect(() => {
    if (activeSection === "reports" || activeSection === "interviews" || activeSection === "dashboard") {
      fetchInterviewHistory();
    }
  }, [activeSection]);

  // Compute exact metrics from history based on requirements
  const completedInterviews = interviewHistory.filter(item => item.status === 'completed');
  const totalInterviews = completedInterviews.length;

  const validScores = completedInterviews.map(item => {
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

  const averageScore = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  const highestScore = validScores.length ? Math.max(...validScores) : 0;

  const validTechScores = completedInterviews.map(item => {
    let score = item.report?.technical_score || 0;
    if (score > 0 && score <= 10) {
      score = score * 10;
    }
    if (score === 0) {
      const tq = item.qa_list.filter(q => q.question_type === 'technical');
      if (tq.length > 0) {
        score = (tq.reduce((s, q) => s + (q.score || 0), 0) / tq.length) * 10;
      }
    }
    return Math.round(score);
  }).filter(s => s > 0);
  const techAverage = validTechScores.length ? Math.round(validTechScores.reduce((a, b) => a + b, 0) / validTechScores.length) : 0;

  const validBehavioralScores = completedInterviews.map(item => {
    let score = item.report?.hr_score || 0;
    if (score > 0 && score <= 10) {
      score = score * 10;
    }
    if (score === 0) {
      const hq = item.qa_list.filter(q => q.question_type === 'hr');
      if (hq.length > 0) {
        score = (hq.reduce((s, q) => s + (q.score || 0), 0) / hq.length) * 10;
      }
    }
    return Math.round(score);
  }).filter(s => s > 0);
  const behavioralAverage = validBehavioralScores.length ? Math.round(validBehavioralScores.reduce((a, b) => a + b, 0) / validBehavioralScores.length) : 0;

  const validCommScores = completedInterviews.map(item => {
    let score = 0;
    if (item.report) {
      const tc = item.report.tech_communication_avg || 0;
      const hc = item.report.hr_communication_skills_avg || 0;
      if (tc > 0 || hc > 0) {
        score = (tc + hc) / (tc > 0 && hc > 0 ? 2 : 1);
      }
    }
    return Math.round(score);
  }).filter(s => s > 0);
  const commAverage = validCommScores.length ? Math.round(validCommScores.reduce((a, b) => a + b, 0) / validCommScores.length) : 0;

  const latestCompleted = completedInterviews.length > 0 ? completedInterviews[0] : null;
  let overallPct = 0;
  if (latestCompleted) {
    let score = latestCompleted.report?.final_interview_score || latestCompleted.report?.hiring_readiness_score || 0;
    if (score === 0) {
      score = latestCompleted.average_score || 0;
      if (score > 0 && score <= 10) {
        score = score * 10;
      }
    } else if (score > 0 && score <= 10) {
      score = score * 10;
    }
    overallPct = Math.round(score);
  }

  const getNormalizedScore = (item: any) => {
    if (!item) return 0;
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
  };

  const formatBulletPoints = (text: string) => {
    if (!text) return [];
    return text
      .split(/(?:\r?\n|- |\* |\.\s+)/)
      .map(s => s.trim())
      .filter(s => s.length > 3);
  };

  const performanceTrend = overallPct > 0 && averageScore > 0 ? (overallPct - averageScore) : 0;
  const trendStr = performanceTrend > 0 ? `+${performanceTrend}%` : `${performanceTrend}%`;

  const recentInterviews = interviewHistory.slice(0, 3);

  const downloadPdfReport = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = 50;

    const qaVolume = completedInterviews.reduce((sum, item) => sum + (item.qa_list?.length || 0), 0);
    const passRate = totalInterviews > 0 ? Math.round((completedInterviews.filter(item => getNormalizedScore(item) >= 60).length / totalInterviews) * 100) : 0;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > 780) {
        doc.addPage();
        y = 50;
        return true;
      }
      return false;
    };

    const addParagraph = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' | 'italic' = 'normal', spacing = 15) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines = doc.splitTextToSize(text, 515);
      lines.forEach((line: string) => {
        checkPageBreak(spacing);
        doc.text(line, margin, y);
        y += spacing;
      });
    };

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('SmartInterview Performance Report', margin, y);
    y += 35;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 25;

    // Summary Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('1. Overall Summary Metrics', margin, y);
    y += 20;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Interviews Attempted: ${totalInterviews}`, margin, y);
    y += 16;
    doc.text(`Total Questions Answered: ${qaVolume}`, margin, y);
    y += 16;
    doc.text(`Overall Average Score: ${overallPct > 0 ? `${overallPct}%` : 'N/A'}`, margin, y);
    y += 16;
    doc.text(`Technical Average Score: ${techAverage > 0 ? `${techAverage}%` : 'N/A'}`, margin, y);
    y += 16;
    doc.text(`HR/Behavioral Average Score: ${behavioralAverage > 0 ? `${behavioralAverage}%` : 'N/A'}`, margin, y);
    y += 16;
    doc.text(`Qualified Pass Rate: ${passRate > 0 ? `${passRate}%` : 'N/A'}`, margin, y);
    y += 30;

    if (interviewHistory.length > 0) {
      const latest = interviewHistory[0];
      
      checkPageBreak(120);
      // Latest Interview Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('2. Latest Interview Details', margin, y);
      y += 20;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Position / Role: ${latest.job_role}`, margin, y);
      y += 16;
      doc.text(`Target Company: ${latest.company}`, margin, y);
      y += 16;
      doc.text(`Date of Interview: ${new Date(latest.date).toLocaleDateString()}`, margin, y);
      y += 16;
      const realScore = latest.report?.hiring_readiness_score || Math.round(latest.average_score * 10);
      doc.text(`Hiring Readiness Rating: ${realScore}%`, margin, y);
      y += 30;

      // Top Feedback Section
      checkPageBreak(100);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('3. Top Feedback & AI Summary', margin, y);
      y += 20;

      const narrative = latest.report?.narrative_summary || 'No narrative summary available.';
      addParagraph(narrative, 10, 'normal', 15);
      y += 15;

      // Skill Gap Section
      if (latest.report?.skill_gap_analysis) {
        checkPageBreak(100);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('4. Skill Gap Analysis', margin, y);
        y += 20;

        addParagraph(latest.report.skill_gap_analysis, 10, 'normal', 15);
        y += 15;
      }

      // Q&A list details
      if (latest.qa_list && latest.qa_list.length > 0) {
        checkPageBreak(120);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('5. Questions & Answers Review', margin, y);
        y += 20;

        latest.qa_list.forEach((item, idx) => {
          checkPageBreak(60);
          
          // Question - wrapped
          addParagraph(`Q${idx + 1}: ${item.question}`, 10.5, 'bold', 16);
          y += 4;

          // Score
          checkPageBreak(20);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.text(`Score: ${item.score > 0 && item.score <= 10 ? item.score * 10 : item.score}%`, margin, y);
          y += 16;

          // Answer - wrapped
          addParagraph(`Your Answer: ${item.answer}`, 10, 'normal', 15);
          y += 4;
          
          // Feedback - wrapped
          if (item.feedback) {
            addParagraph(`Feedback: ${item.feedback}`, 9.5, 'italic', 14);
          }
          y += 12; // spacer between questions
        });
      }
    } else {
      checkPageBreak(50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('No interview data available yet. Complete an interview to generate report details.', margin, y);
    }

    doc.save('smartinterview-dashboard-report.pdf');
  };

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
                  <button 
                    className={styles.button} 
                    style={{ 
                      background: '#F1F5F9', 
                      color: '#0F172A', 
                      border: '1px solid #CBD5E1',
                      opacity: (isSendingEmail || interviewHistory.length === 0) ? 0.6 : 1,
                      cursor: (isSendingEmail || interviewHistory.length === 0) ? 'not-allowed' : 'pointer'
                    }} 
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || interviewHistory.length === 0}
                  >
                    {isSendingEmail ? 'Sending...' : 'Email Report'}
                  </button>
                  <button className={styles.button} onClick={downloadPdfReport}>Download PDF</button>
                </div>
              </div>

              {/* Top Grid */}
              <div className={styles.grid}>
                <div className={styles.card} style={{ textAlign: 'center' }}>
                  <h3 className={styles.cardTitle}>Performance Trend</h3>
                  <div 
                    className={styles.progressCircle}
                    style={{
                      background: `conic-gradient(#DC2626 ${overallPct * 3.6}deg, #E5E7EB 0deg)`
                    }}
                  >
                    <span className={styles.progressText} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {loading ? '...' : (overallPct > 0 ? `${overallPct}%` : 'N/A')}
                      {overallPct > 0 && <span style={{ fontSize: '0.9rem', color: performanceTrend >= 0 ? '#10B981' : '#EF4444', marginTop: '-0.5rem' }}>{trendStr}</span>}
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
                    
                    {/* Stat 1: Interviews Completed */}
                    <div style={{ background: '#F8FAFC', border: '2px solid #0F172A', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left', boxShadow: '2px 2px 0px #0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0F172A', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#DC2626" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Interviews Completed
                      </div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{totalInterviews}</span>
                    </div>

                    {/* Stat 2: Average Score */}
                    <div style={{ background: '#F8FAFC', border: '2px solid #0F172A', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left', boxShadow: '2px 2px 0px #0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0F172A', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        Average Score
                      </div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{averageScore > 0 ? `${averageScore}%` : 'N/A'}</span>
                    </div>

                    {/* Stat 3: Highest Score */}
                    <div style={{ background: '#F8FAFC', border: '2px solid #0F172A', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left', boxShadow: '2px 2px 0px #0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0F172A', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Highest Score
                      </div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>
                        {highestScore > 0 ? `${highestScore}%` : 'N/A'}
                      </span>
                    </div>

                    {/* Stat 4: Technical Average */}
                    <div style={{ background: '#F8FAFC', border: '2px solid #0F172A', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left', boxShadow: '2px 2px 0px #0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0F172A', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#0EA5E9" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                        Technical Average
                      </div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0EA5E9' }}>
                        {techAverage > 0 ? `${techAverage}%` : 'N/A'}
                      </span>
                    </div>

                    {/* Stat 5: Communication Average */}
                    <div style={{ background: '#F8FAFC', border: '2px solid #0F172A', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left', boxShadow: '2px 2px 0px #0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0F172A', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        Communication Avg
                      </div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B' }}>
                        {commAverage > 0 ? `${commAverage}%` : 'N/A'}
                      </span>
                    </div>

                    {/* Stat 6: Behavioral Average */}
                    <div style={{ background: '#F8FAFC', border: '2px solid #0F172A', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left', boxShadow: '2px 2px 0px #0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0F172A', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="#8B5CF6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Behavioral Average
                      </div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8B5CF6' }}>
                        {behavioralAverage > 0 ? `${behavioralAverage}%` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Recent Interviews Strip */}
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Interviews</div>
                    {recentInterviews.length > 0 ? recentInterviews.map((intv, idx) => (
                      <div key={idx} style={{ background: 'rgba(220, 38, 38, 0.05)', border: '2px solid #0F172A', padding: '0.6rem 0.75rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0F172A', fontSize: '0.75rem', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg viewBox="0 0 24 24" width="12" height="12" stroke="#DC2626" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>{intv.job_role} @ {intv.company}</span>
                        </div>
                        <strong style={{ color: '#0F172A', fontWeight: 800 }}>{new Date(intv.date).toLocaleDateString()}</strong>
                      </div>
                    )) : (
                      <div style={{ color: '#0F172A', fontSize: '0.8rem', fontStyle: 'italic', fontWeight: 700 }}>No recent interviews</div>
                    )}
                  </div>
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
                  <p style={{ color: '#0F172A', marginTop: '1rem', fontWeight: 700 }}>Loading...</p>
                ) : interviewHistory.length === 0 ? (
                  <p style={{ color: '#0F172A', marginTop: '1rem', fontWeight: 700 }}>Complete an interview to see insights here.</p>
                ) : (
                  <div style={{ maxHeight: '190px', overflowY: 'auto', paddingRight: '8px' }}>
                    <ul style={{ 
                      listStyleType: 'disc', 
                      paddingLeft: '1.25rem', 
                      marginTop: '0', 
                      marginBottom: '0.75rem', 
                      color: '#0F172A', 
                      fontSize: '0.85rem',
                      lineHeight: '1.5', 
                      fontWeight: 700,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      {formatBulletPoints(interviewHistory[0].report?.narrative_summary).map((point, idx) => (
                        <li key={idx}>{point}.</li>
                      ))}
                      {formatBulletPoints(interviewHistory[0].report?.narrative_summary).length === 0 && (
                        <li>Latest interview average score is {getNormalizedScore(interviewHistory[0])}% with clear room for improvement.</li>
                      )}
                    </ul>
                    {interviewHistory[0].report?.skill_gap_analysis && (
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', padding: '0.5rem 0.75rem', background: '#F8FAFC', border: '2px solid #0F172A', borderLeft: '6px solid #F59E0B', borderRadius: '0.5rem', boxShadow: '2px 2px 0px #0F172A' }}>
                        <strong style={{ fontSize: '0.8rem', color: '#0F172A', display: 'block', marginBottom: '0.25rem', fontWeight: 800 }}>Skill Gap Analysis:</strong>
                        <span style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 700 }}>{interviewHistory[0].report.skill_gap_analysis}</span>
                      </div>
                    )}
                    <p style={{ color: '#0F172A', fontSize: '0.85rem', lineHeight: '1.5', fontWeight: 700 }}>
                      <strong style={{ color: '#DC2626', fontWeight: 800 }}>Hiring Readiness: {getNormalizedScore(interviewHistory[0])}%</strong> — {interviewHistory[0].report?.recommendation
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
                        <strong>Latest Interview Score:</strong> {getNormalizedScore(interviewHistory[0])}%
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


          {activeSection === "profile" && (
            <div style={{ margin: "-1.5rem", height: "calc(100% + 3rem)" }}>
              <ProfilePage interviewHistory={interviewHistory} loading={loading} onNavigate={setActiveSection} />
            </div>
          )}

        </main>
      </div>
      {toast.type && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: toast.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          color: toast.type === 'success' ? '#16A34A' : '#DC2626',
          border: `1px solid ${toast.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
          zIndex: 9999,
          fontWeight: 600,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none'
        }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
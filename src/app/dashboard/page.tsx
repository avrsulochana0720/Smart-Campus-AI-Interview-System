import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "../../styles/dashboard.module.css";
import Navbar from "../components/Navbar";
import axios from "axios";

interface QA {
  question: string;
  answer: string;
  score: number;
  feedback?: string;
}

interface Interview {
  interview_id: number;
  job_role: string;
  company: string;
  date: string;
  qa_list: QA[];
  total_score: number;
  average_score: number;
  narrative_summary?: string;
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
  const [expandedInterviews, setExpandedInterviews] = useState<Record<number, boolean>>({});
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

  useEffect(() => {
    if (activeSection === "reports" || activeSection === "interviews" || activeSection === "dashboard") {
      fetchInterviewHistory();
    }
  }, [activeSection]);

  const toggleExpand = (interviewId: number) => {
    setExpandedInterviews(prev => ({
      ...prev,
      [interviewId]: !prev[interviewId]
    }));
  };

  // Compute real stats from history
  const totalInterviews = interviewHistory.length;
  const allScores = interviewHistory.flatMap(i => i.qa_list.map(q => q.score).filter(s => s > 0));
  const overallAvg = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
  const overallPct = Math.round(overallAvg * 10); // score is /10, convert to %

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
                className={`${styles.navItem} ${activeSection === "reports" ? styles.active : ""}`}
                onClick={() => setActiveSection("reports")}
                style={{ cursor: "pointer" }}
              >
                Reports
              </a>
            </nav>
          </div>
          <div className={styles.profile} onClick={() => setActiveSection("profile")} style={{ cursor: 'pointer' }}>
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userProfile?.email || 'user')}`}
              alt="Profile"
              className={styles.avatar}
            />
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
                    <p style={{ color: "#3B82F6", marginTop: "0.5rem", fontSize: "0.95rem" }}>
                      Current Position: <strong>{interviewHistory[0].job_role}</strong> at <strong>{interviewHistory[0].company}</strong>
                    </p>
                  )}
                </div>
                <button className={styles.button}>Download PDF Report</button>
              </div>

              {/* Top Grid */}
              <div className={styles.grid}>
                <div className={styles.cardCenter}>
                  <h3 className={styles.cardTitle}>Overall Performance</h3>
                  <div className={styles.progressCircle}>
                    <span className={styles.progressText}>
                      {loading ? '...' : (overallPct > 0 ? `${overallPct}%` : 'N/A')}
                    </span>
                  </div>
                  <p className={styles.accent}>
                    {overallPct >= 80 ? 'Elite Candidate' : overallPct >= 60 ? 'Good Candidate' : overallPct > 0 ? 'Keep Practicing' : 'No data yet'}
                  </p>
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Interview Stats</h3>
                  <div className={styles.radar}>
                    <div style={{ padding: '1rem', color: '#9ca3af' }}>
                      <p style={{ marginBottom: '0.75rem' }}>Total Interviews: <strong style={{ color: '#fff' }}>{totalInterviews}</strong></p>
                      <p style={{ marginBottom: '0.75rem' }}>Questions Answered: <strong style={{ color: '#fff' }}>{allScores.length}</strong></p>
                      <p style={{ marginBottom: '0.75rem' }}>Avg Score: <strong style={{ color: '#3B82F6' }}>{overallAvg > 0 ? `${overallAvg.toFixed(1)}/10` : 'N/A'}</strong></p>
                      {interviewHistory.length > 0 && (
                        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#d1d5db' }}>
                          Latest: <strong>{new Date(interviewHistory[0].date).toLocaleDateString()}</strong>
                        </p>
                      )}
                    </div>
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
                          <td style={{ maxWidth: '250px', wordWrap: 'break-word', color: '#d1d5db' }}>{qa.answer || 'Not answered'}</td>
                          <td className={styles.score}>{qa.score > 0 ? `${(qa.score * 10).toFixed(0)}%` : '--'}</td>
                          <td style={{ maxWidth: '200px', wordWrap: 'break-word', fontSize: '0.875rem', color: '#9ca3af' }}>{qa.feedback || 'Answer recorded'}</td>
                          <td className={styles.status}>{qa.score >= 5 ? '✔' : qa.score > 0 ? '◐' : '✘'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
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
                  <p style={{ color: '#9ca3af', marginTop: '1rem' }}>Loading...</p>
                ) : interviewHistory.length === 0 ? (
                  <p style={{ color: '#9ca3af', marginTop: '1rem' }}>Complete an interview to see insights here.</p>
                ) : (
                  <div>
                    {interviewHistory[0].narrative_summary && (
                      <p style={{ color: '#d1d5db', marginBottom: '1rem', lineHeight: '1.6' }}>
                        {interviewHistory[0].narrative_summary}
                      </p>
                    )}
                    <ul className={styles.list}>
                      {interviewHistory[0].qa_list.slice(0, 3).map((qa, i) => (
                        <li key={i} style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                          <strong style={{ color: '#3B82F6' }}>Q{i+1}:</strong> {qa.feedback || 'Good response'}
                        </li>
                      ))}
                    </ul>
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
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userProfile?.email || 'user')}`}
                    style={{ width: "100px", height: "100px", borderRadius: "50%" }}
                    alt="Avatar"
                  />
                  <div>
                    <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{userProfile?.name || 'User'}</h3>
                    <p style={{ color: "#9ca3af" }}>{userProfile?.email || ''}</p>
                    {interviewHistory.length > 0 && (
                      <p style={{ color: "#3B82F6", marginTop: '0.5rem', fontSize: '0.95rem' }}>
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
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(0,0,0,0.3)",
                        color: "#fff",
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
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(0,0,0,0.3)",
                        color: "#fff",
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
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(0,0,0,0.3)",
                        color: "#fff",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Overall Performance</label>
                    <input
                      type="text"
                      value={overallAvg > 0 ? `${overallAvg.toFixed(1)} / 10 (${overallPct}%)` : 'No interviews yet'}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(0,0,0,0.3)",
                        color: "#fff",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Total Questions Answered</label>
                    <input
                      type="text"
                      value={allScores.length.toString()}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(0,0,0,0.3)",
                        color: "#fff",
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
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(0,0,0,0.3)",
                            color: "#fff",
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
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(0,0,0,0.3)",
                            color: "#fff",
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
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(0,0,0,0.3)",
                            color: "#fff",
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
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(0,0,0,0.3)",
                            color: "#fff",
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
            <>
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>My Interviews</h2>
                  <p className={styles.subtitle}>View and manage your interview history</p>
                </div>
                <button className={styles.button}>Schedule New Interview</button>
              </div>

              <div className={styles.card}>
                {loading ? (
                  <p style={{ color: '#9ca3af', marginTop: '1rem' }}>Loading interviews...</p>
                ) : interviewHistory.length === 0 ? (
                  <p style={{ color: '#9ca3af', marginTop: '1rem' }}>No interviews found. Complete an interview to see your history here.</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Position</th>
                        <th>Company</th>
                        <th>Questions</th>
                        <th>Avg Score</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviewHistory.map((interview) => {
                        const answeredCount = interview.qa_list.filter(qa => qa.answer !== 'Not answered').length;
                        const totalCount = interview.qa_list.length;
                        const isComplete = answeredCount === totalCount;
                        return (
                          <tr key={interview.interview_id}>
                            <td>{new Date(interview.date).toLocaleDateString()}</td>
                            <td style={{ fontWeight: '600', color: '#3B82F6' }}>{interview.job_role}</td>
                            <td>{interview.company}</td>
                            <td>{answeredCount}/{totalCount}</td>
                            <td className={styles.score}>
                              {interview.average_score > 0 ? (
                                <span style={{ color: interview.average_score >= 7 ? '#22c55e' : interview.average_score >= 4 ? '#f59e0b' : '#ef4444', fontWeight: '600' }}>
                                  {interview.average_score.toFixed(1)}/10
                                </span>
                              ) : '--'}
                            </td>
                            <td style={{ fontSize: '0.875rem' }}>
                              <span style={{ background: isComplete ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', color: isComplete ? '#22c55e' : '#f59e0b', padding: '0.35rem 0.65rem', borderRadius: '0.25rem', fontWeight: '600' }}>
                                {isComplete ? 'Complete' : 'In Progress'}
                              </span>
                            </td>
                            <td>
                              <button
                                style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: "#3B82F6", color: "#fff", cursor: "pointer", fontSize: '0.875rem', fontWeight: '500' }}
                                onClick={() => { toggleExpand(interview.interview_id); setActiveSection('reports'); }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeSection === "reports" && (
            <>
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>Reports</h2>
                  <p className={styles.subtitle}>Download and view your interview reports</p>
                </div>
              </div>

              <div className={styles.grid}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Performance Summary</h3>
                  {interviewHistory.length === 0 ? (
                    <div style={{ marginTop: "1rem", color: '#9ca3af' }}>
                      <p>Complete an interview to see your performance summary.</p>
                    </div>
                  ) : (
                    <div style={{ marginTop: "1rem" }}>
                      {interviewHistory[0].qa_list.map((qa, idx) => {
                        const scorePercent = qa.score > 0 ? qa.score * 10 : 0;
                        const category = idx === 0 ? 'Technical Skills' : idx === 1 ? 'Communication' : idx === 2 ? 'Problem Solving' : `Question ${idx + 1}`;
                        let color = '#3B82F6';
                        if (qa.score >= 8) color = '#22c55e';
                        else if (qa.score >= 5) color = '#f59e0b';
                        else if (qa.score > 0) color = '#ef4444';
                        
                        return (
                          <div key={idx} style={{ marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                              <span>{category}</span>
                              <span style={{ color, fontWeight: '600' }}>{scorePercent > 0 ? `${scorePercent.toFixed(0)}%` : 'Not scored'}</span>
                            </div>
                            <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: 'hidden' }}>
                              <div style={{ height: "100%", width: `${scorePercent}%`, background: color, borderRadius: "4px", transition: 'width 0.3s ease' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Interview History & Analysis</h3>
                {loading ? (
                  <p style={{ marginTop: "1rem", color: "#9ca3af" }}>Loading interview history...</p>
                ) : interviewHistory.length === 0 ? (
                  <p style={{ marginTop: "1rem", color: "#9ca3af" }}>No interview history found. Complete an interview to see your history here.</p>
                ) : (
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {interviewHistory.map((interview) => (
                      <div key={interview.interview_id} style={{ padding: "1rem", background: "rgba(0,0,0,0.3)", borderRadius: "0.5rem" }}>
                        <div 
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                          onClick={() => toggleExpand(interview.interview_id)}
                        >
                          <div>
                            <p style={{ margin: "0", fontWeight: "600", fontSize: "1.05rem" }}>
                              {interview.job_role}
                              <span style={{ color: "#9ca3af", fontSize: "0.9rem", marginLeft: "0.5rem" }}>@ {interview.company}</span>
                            </p>
                            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#9ca3af" }}>
                              Date: {new Date(interview.date).toLocaleDateString()} | Average Score: <strong style={{ color: '#3B82F6' }}>{interview.average_score.toFixed(1)}/10</strong> | Questions: <strong>{interview.qa_list.length}</strong>
                            </p>
                          </div>
                          <span style={{ fontSize: "1.5rem", color: "#9ca3af" }}>
                            {expandedInterviews[interview.interview_id] ? "▼" : "▶"}
                          </span>
                        </div>
                        {expandedInterviews[interview.interview_id] && (
                          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                            {interview.qa_list.map((qa, index) => {
                              const scoreColor = qa.score >= 7 ? '#22c55e' : qa.score >= 4 ? '#f59e0b' : '#ef4444';
                              return (
                                <div key={index} style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.375rem", borderLeft: `3px solid ${scoreColor}` }}>
                                  <p style={{ margin: "0 0 0.75rem 0", fontWeight: "600", color: "#3B82F6", fontSize: '1rem' }}>
                                    Question {index + 1}
                                  </p>
                                  <p style={{ margin: "0 0 0.75rem 0", color: "#d1d5db", lineHeight: '1.5', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(59,130,246,0.3)' }}>
                                    <strong style={{ color: '#fff' }}>Your Answer:</strong> {qa.answer || 'Not answered'}
                                  </p>
                                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginLeft: '0.5rem' }}>
                                    <span style={{ fontSize: "0.875rem", background: scoreColor + '20', color: scoreColor, padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontWeight: '600' }}>
                                      Score: {qa.score > 0 ? `${(qa.score * 10).toFixed(0)}%` : 'Not scored'}
                                    </span>
                                    {qa.feedback && (
                                      <span style={{ fontSize: "0.875rem", color: "#d1d5db", fontStyle: 'italic', padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.375rem' }}>
                                        💬 {qa.feedback}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>AI Analysis & Recommendations</h3>
              <div style={{ marginTop: "1rem" }}>
                {interviewHistory.length === 0 ? (
                  <p style={{ color: '#9ca3af' }}>Complete an interview to see AI-generated insights here.</p>
                ) : (
                  <div>
                    {interviewHistory[0].narrative_summary && (
                      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(59,130,246,0.1)', borderRadius: '0.5rem', borderLeft: '3px solid #3B82F6' }}>
                        <p style={{ margin: '0', color: '#d1d5db', lineHeight: '1.6' }}>
                          {interviewHistory[0].narrative_summary}
                        </p>
                      </div>
                    )}
                    <ul className={styles.list}>
                      <li><strong style={{ color: '#22c55e' }}>Overall Average Score:</strong> {overallAvg.toFixed(1)}/10 ({overallPct}%)</li>
                      <li><strong style={{ color: '#3B82F6' }}>Total Interviews Completed:</strong> {totalInterviews}</li>
                      <li><strong style={{ color: '#f59e0b' }}>Total Questions Answered:</strong> {allScores.length}</li>
                      {overallPct >= 80 && <li style={{ color: '#22c55e' }}>✓ <strong>Elite performance</strong> — you are in the top tier of candidates!</li>}
                      {overallPct >= 60 && overallPct < 80 && <li style={{ color: '#3B82F6' }}>✓ <strong>Good performance</strong> — focus on system design and edge cases to improve.</li>}
                      {overallPct < 60 && overallPct > 0 && <li style={{ color: '#f59e0b' }}>→ <strong>Keep practicing</strong> — review your answers in the history above for areas to improve.</li>}
                      {interviewHistory.length > 0 && (
                        <>
                          <li style={{ marginTop: '1rem', color: '#9ca3af' }}>
                            <strong>Strength Areas:</strong> Questions with scores 8+/10
                          </li>
                          <li style={{ color: '#9ca3af' }}>
                            <strong>Focus Areas:</strong> Questions with scores below 5/10
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
    </>
  );
}
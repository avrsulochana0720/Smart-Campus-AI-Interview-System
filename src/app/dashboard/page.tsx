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
      const response = await axios.get("http://127.0.0.1:8000/interview-history", {
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
                      <p>Avg Score: <strong style={{ color: '#3B82F6' }}>{overallAvg > 0 ? `${overallAvg.toFixed(1)}/10` : 'N/A'}</strong></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sectional Breakdown */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Sectional Breakdown</h3>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Difficulty</th>
                      <th>Score</th>
                      <th>AI Feedback</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Data Structures</td>
                      <td><span className={`${styles.badge} ${styles.easy}`}>Easy</span></td>
                      <td className={styles.score}>92</td>
                      <td>Excellent fundamentals</td>
                      <td className={styles.status}>✔</td>
                    </tr>
                    <tr>
                      <td>System Design</td>
                      <td><span className={`${styles.badge} ${styles.hard}`}>Hard</span></td>
                      <td className={styles.score}>78</td>
                      <td>Needs clarity in scaling</td>
                      <td className={styles.status}>✔</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Grid */}
              <div className={styles.grid}>
                <div className={styles.card}>
                <h3 className={styles.cardTitle}>Recruiter Insights</h3>
                {loading ? (
                  <p style={{ color: '#9ca3af', marginTop: '1rem' }}>Loading...</p>
                ) : interviewHistory.length === 0 ? (
                  <p style={{ color: '#9ca3af', marginTop: '1rem' }}>Complete an interview to see insights here.</p>
                ) : (
                  <ul className={styles.list}>
                    {interviewHistory[0]?.qa_list.slice(0, 3).map((qa, i) => (
                      <li key={i}>{qa.feedback || 'Good response'}</li>
                    ))}
                  </ul>
                )}
              </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>TPO Alerts</h3>
                  <div className={styles.alert}>Interview scheduled for April 2nd</div>
                  <div className={styles.alert}>Resume review pending</div>
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
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Overall Score</label>
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
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviewHistory.map((interview) => (
                        <tr key={interview.interview_id}>
                          <td>{new Date(interview.date).toLocaleDateString()}</td>
                          <td>{interview.job_role}</td>
                          <td>{interview.company}</td>
                          <td>{interview.qa_list.length}</td>
                          <td className={styles.score}>
                            {interview.average_score > 0 ? `${interview.average_score.toFixed(1)}/10` : '--'}
                          </td>
                          <td>
                            <button
                              style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: "#3B82F6", color: "#fff", cursor: "pointer" }}
                              onClick={() => { toggleExpand(interview.interview_id); setActiveSection('reports'); }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
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
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span>Technical Skills</span>
                        <span>85%</span>
                      </div>
                      <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
                        <div style={{ height: "100%", width: "85%", background: "#3B82F6", borderRadius: "4px" }}></div>
                      </div>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span>Communication</span>
                        <span>90%</span>
                      </div>
                      <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
                        <div style={{ height: "100%", width: "90%", background: "#22c55e", borderRadius: "4px" }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span>Problem Solving</span>
                        <span>78%</span>
                      </div>
                      <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
                        <div style={{ height: "100%", width: "78%", background: "#f59e0b", borderRadius: "4px" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Interview History</h3>
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
                            <p style={{ margin: "0", fontWeight: "500" }}>{interview.job_role} - {interview.company}</p>
                            <p style={{ margin: "0", fontSize: "0.875rem", color: "#9ca3af" }}>Date: {interview.date} | Average Score: {interview.average_score.toFixed(1)}/10</p>
                          </div>
                          <span style={{ fontSize: "1.5rem", color: "#9ca3af" }}>
                            {expandedInterviews[interview.interview_id] ? "▼" : "▶"}
                          </span>
                        </div>
                        {expandedInterviews[interview.interview_id] && (
                          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                            {interview.qa_list.map((qa, index) => (
                              <div key={index} style={{ marginBottom: "1.25rem", padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.375rem" }}>
                                <p style={{ margin: "0 0 0.5rem 0", fontWeight: "500", color: "#3B82F6" }}>Q{index+1}: {qa.question}</p>
                                <p style={{ margin: "0 0 0.5rem 0", color: "#d1d5db" }}>A: {qa.answer}</p>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: "0.875rem", background: qa.score >= 7 ? 'rgba(34,197,94,0.2)' : qa.score >= 4 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: qa.score >= 7 ? '#22c55e' : qa.score >= 4 ? '#f59e0b' : '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600' }}>Score: {qa.score}/10</span>
                                  {qa.feedback && <span style={{ fontSize: "0.875rem", color: "#9ca3af", fontStyle: 'italic' }}>💬 {qa.feedback}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>


            <div className={styles.card}>
              <h3 className={styles.cardTitle}>AI Analysis</h3>
              <div style={{ marginTop: "1rem" }}>
                {interviewHistory.length === 0 ? (
                  <p style={{ color: '#9ca3af' }}>Complete an interview to see AI-generated insights here.</p>
                ) : (
                  <ul className={styles.list}>
                    <li>Overall average score: {overallAvg.toFixed(1)}/10 ({overallPct}%)</li>
                    <li>Total interviews completed: {totalInterviews}</li>
                    <li>Total questions answered: {allScores.length}</li>
                    {overallPct >= 80 && <li>Elite performance — you are in the top tier of candidates!</li>}
                    {overallPct >= 60 && overallPct < 80 && <li>Good performance — focus on system design and edge cases to improve.</li>}
                    {overallPct < 60 && overallPct > 0 && <li>Keep practicing — review your answers in the history above for areas to improve.</li>}
                  </ul>
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
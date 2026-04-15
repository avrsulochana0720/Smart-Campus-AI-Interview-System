import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "../../styles/dashboard.module.css";
import Navbar from "../components/Navbar";

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

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
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
              alt="Profile"
              className={styles.avatar}
            />
            <span className={styles.username}>John Doe</span>
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
                    <span className={styles.progressText}>85%</span>
                  </div>
                  <p className={styles.accent}>Elite Candidate</p>
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Skill Radar</h3>
                  <div className={styles.radar}></div>
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
                  <p>Recruiters highlighted the following strengths and areas for improvement:</p>
                  <ul className={styles.list}>
                    <li>Strong coding fundamentals</li>
                    <li>Confident communication</li>
                    <li>Needs improvement in system design explanations</li>
                  </ul>
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
                    src="https://via.placeholder.com/100"
                    style={{ width: "100px", height: "100px", borderRadius: "50%" }}
                  />
                  <div>
                    <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>John Doe</h3>
                    <p style={{ color: "#9ca3af" }}>Senior Frontend Engineer</p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Full Name</label>
                    <input
                      type="text"
                      defaultValue="John Doe"
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
                      defaultValue="john.doe@example.com"
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
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Phone</label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
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
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>LinkedIn</label>
                    <input
                      type="url"
                      defaultValue="https://linkedin.com/in/johndoe"
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
                  <button
                    className={styles.button}
                    style={{ marginTop: "1rem" }}
                  >
                    Save Changes
                  </button>
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
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Position</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Oct 24, 2024</td>
                      <td>Senior Frontend Engineer</td>
                      <td>TechCorp Inc.</td>
                      <td><span className={`${styles.badge} ${styles.easy}`}>Completed</span></td>
                      <td className={styles.score}>85%</td>
                      <td><button style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: "#3B82F6", color: "#fff", cursor: "pointer" }}>View</button></td>
                    </tr>
                    <tr>
                      <td>Sep 15, 2024</td>
                      <td>Full Stack Developer</td>
                      <td>StartupXYZ</td>
                      <td><span className={`${styles.badge} ${styles.inProgress}`}>In Progress</span></td>
                      <td className={styles.score}>--</td>
                      <td><button style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: "#3B82F6", color: "#fff", cursor: "pointer" }}>Continue</button></td>
                    </tr>
                    <tr>
                      <td>Aug 20, 2024</td>
                      <td>React Developer</td>
                      <td>WebAgency</td>
                      <td><span className={`${styles.badge} ${styles.easy}`}>Completed</span></td>
                      <td className={styles.score}>92%</td>
                      <td><button style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: "#3B82F6", color: "#fff", cursor: "pointer" }}>View</button></td>
                    </tr>
                  </tbody>
                </table>
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

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Available Reports</h3>
                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ padding: "1rem", background: "rgba(0,0,0,0.3)", borderRadius: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: "0", fontWeight: "500" }}>Interview Report - Oct 2024</p>
                      <p style={{ margin: "0", fontSize: "0.875rem", color: "#9ca3af" }}>TechCorp Inc.</p>
                    </div>
                    <button style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: "#3B82F6", color: "#fff", cursor: "pointer" }}>Download</button>
                  </div>
                  <div style={{ padding: "1rem", background: "rgba(0,0,0,0.3)", borderRadius: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: "0", fontWeight: "500" }}>Interview Report - Aug 2024</p>
                      <p style={{ margin: "0", fontSize: "0.875rem", color: "#9ca3af" }}>WebAgency</p>
                    </div>
                    <button style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: "#3B82F6", color: "#fff", cursor: "pointer" }}>Download</button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>AI Analysis</h3>
              <div style={{ marginTop: "1rem" }}>
                <p style={{ marginBottom: "1rem" }}>Based on your recent interviews, our AI has identified the following insights:</p>
                <ul className={styles.list}>
                  <li>Strong performance in technical interviews (85% average)</li>
                  <li>Excellent communication skills with clear explanations</li>
                  <li>Areas for improvement: System design scalability concepts</li>
                  <li>Recommended focus: Distributed systems and microservices architecture</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
    </>
  );
}
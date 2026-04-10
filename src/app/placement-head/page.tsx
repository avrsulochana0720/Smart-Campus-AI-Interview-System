import { useState } from "react";
import styles from "../../styles/placement-head.module.css";

interface InterviewResult {
  id: string;
  studentName: string;
  email: string;
  jobRole: string;
  company: string;
  score: number;
  status: "Completed" | "In Progress" | "Pending";
  date: string;
  aiFeedback: string;
  technicalSkills: number;
  communication: number;
  problemSolving: number;
}

const MOCK_INTERVIEW_RESULTS: InterviewResult[] = [
  {
    id: "1",
    studentName: "Alex Chen",
    email: "alex.chen@university.edu",
    jobRole: "Frontend Developer",
    company: "Google",
    score: 92,
    status: "Completed",
    date: "Oct 24, 2024",
    aiFeedback: "Excellent technical skills with strong coding fundamentals. Good communication and problem-solving abilities.",
    technicalSkills: 95,
    communication: 90,
    problemSolving: 88,
  },
  {
    id: "2",
    studentName: "Sarah Johnson",
    email: "sarah.j@university.edu",
    jobRole: "Full Stack Developer",
    company: "Amazon",
    score: 85,
    status: "Completed",
    date: "Oct 23, 2024",
    aiFeedback: "Strong backend knowledge, needs improvement in frontend technologies. Good communication skills.",
    technicalSkills: 82,
    communication: 88,
    problemSolving: 85,
  },
  {
    id: "3",
    studentName: "Michael Brown",
    email: "m.brown@university.edu",
    jobRole: "Data Analyst",
    company: "Microsoft",
    score: 78,
    status: "Completed",
    date: "Oct 22, 2024",
    aiFeedback: "Good analytical skills, but needs more practice with data visualization tools.",
    technicalSkills: 75,
    communication: 82,
    problemSolving: 78,
  },
  {
    id: "4",
    studentName: "Emily Davis",
    email: "emily.d@university.edu",
    jobRole: "Product Manager",
    company: "Meta",
    score: 88,
    status: "Completed",
    date: "Oct 21, 2024",
    aiFeedback: "Excellent product sense and stakeholder management. Strong leadership potential.",
    technicalSkills: 80,
    communication: 95,
    problemSolving: 90,
  },
  {
    id: "5",
    studentName: "James Wilson",
    email: "j.wilson@university.edu",
    jobRole: "DevOps Engineer",
    company: "Tesla",
    score: 65,
    status: "In Progress",
    date: "Oct 20, 2024",
    aiFeedback: "Interview in progress - awaiting completion.",
    technicalSkills: 70,
    communication: 65,
    problemSolving: 60,
  },
];

export default function PlacementHeadDashboard() {
  const [selectedResult, setSelectedResult] = useState<InterviewResult | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResults = MOCK_INTERVIEW_RESULTS.filter((result) => {
    const matchesStatus = filterStatus === "all" || result.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = 
      result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.jobRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.company.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: MOCK_INTERVIEW_RESULTS.length,
    completed: MOCK_INTERVIEW_RESULTS.filter((r) => r.status === "Completed").length,
    inProgress: MOCK_INTERVIEW_RESULTS.filter((r) => r.status === "In Progress").length,
    averageScore: Math.round(
      MOCK_INTERVIEW_RESULTS
        .filter((r) => r.status === "Completed")
        .reduce((sum, r) => sum + r.score, 0) /
        MOCK_INTERVIEW_RESULTS.filter((r) => r.status === "Completed").length
    ),
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Placement Head Dashboard</h1>
          <p className={styles.subtitle}>Monitor and manage student interview results</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.total}</span>
            <span className={styles.statLabel}>Total Interviews</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.completed}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.averageScore}%</span>
            <span className={styles.statLabel}>Avg Score</span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by name, email, role, or company..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="in progress">In Progress</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Results Table */}
        <div className={styles.resultsSection}>
          <h2 className={styles.sectionTitle}>Interview Results</h2>
          <div className={styles.tableContainer}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Job Role</th>
                  <th>Company</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result) => (
                  <tr key={result.id} className={styles.tableRow}>
                    <td>
                      <div className={styles.studentInfo}>
                        <div className={styles.studentAvatar}>
                          {result.studentName.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className={styles.studentName}>{result.studentName}</div>
                          <div className={styles.studentEmail}>{result.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{result.jobRole}</td>
                    <td>{result.company}</td>
                    <td>
                      <span className={`${styles.score} ${result.score >= 80 ? styles.scoreHigh : result.score >= 60 ? styles.scoreMedium : styles.scoreLow}`}>
                        {result.score}%
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.status} ${result.status === "Completed" ? styles.statusCompleted : result.status === "In Progress" ? styles.statusInProgress : styles.statusPending}`}>
                        {result.status}
                      </span>
                    </td>
                    <td>{result.date}</td>
                    <td>
                      <button
                        className={styles.viewButton}
                        onClick={() => setSelectedResult(result)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedResult && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <h2 className={styles.detailTitle}>Interview Details</h2>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedResult(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>Student Information</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Name:</span>
                  <span className={styles.detailValue}>{selectedResult.studentName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>{selectedResult.email}</span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>Interview Details</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Job Role:</span>
                  <span className={styles.detailValue}>{selectedResult.jobRole}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Company:</span>
                  <span className={styles.detailValue}>{selectedResult.company}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Date:</span>
                  <span className={styles.detailValue}>{selectedResult.date}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Overall Score:</span>
                  <span className={`${styles.detailValue} ${styles.detailScore}`}>{selectedResult.score}%</span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>Skill Breakdown</h3>
                <div className={styles.skillBar}>
                  <div className={styles.skillLabel}>Technical Skills</div>
                  <div className={styles.skillProgress}>
                    <div
                      className={styles.skillFill}
                      style={{ width: `${selectedResult.technicalSkills}%` }}
                    />
                  </div>
                  <span className={styles.skillPercentage}>{selectedResult.technicalSkills}%</span>
                </div>
                <div className={styles.skillBar}>
                  <div className={styles.skillLabel}>Communication</div>
                  <div className={styles.skillProgress}>
                    <div
                      className={styles.skillFill}
                      style={{ width: `${selectedResult.communication}%` }}
                    />
                  </div>
                  <span className={styles.skillPercentage}>{selectedResult.communication}%</span>
                </div>
                <div className={styles.skillBar}>
                  <div className={styles.skillLabel}>Problem Solving</div>
                  <div className={styles.skillProgress}>
                    <div
                      className={styles.skillFill}
                      style={{ width: `${selectedResult.problemSolving}%` }}
                    />
                  </div>
                  <span className={styles.skillPercentage}>{selectedResult.problemSolving}%</span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>AI Feedback</h3>
                <p className={styles.feedbackText}>{selectedResult.aiFeedback}</p>
              </div>

              <div className={styles.detailActions}>
                <button className={styles.downloadButton}>Download Report</button>
                <button className={styles.contactButton}>Contact Student</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

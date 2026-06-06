import { useState, useEffect } from "react";
import styles from "../../styles/placement-head.module.css";
import { interviewAPI } from "../../utils/api";
import { jsPDF } from 'jspdf';

interface InterviewResult {
  id: string;
  interview_id: number;
  studentName: string;
  email: string;
  jobRole: string;
  company: string;
  score: number;
  status: string;
  date: string;
  aiFeedback: string;
  technicalSkills: number;
  communication: number;
  problemSolving: number;
  rawReport?: any;
}

export default function PlacementHeadDashboard() {
  const [selectedResult, setSelectedResult] = useState<InterviewResult | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [interviews, setInterviews] = useState<InterviewResult[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await interviewAPI.getAllInterviews();
        const formatted = data.map((d: any) => ({
          id: d.interview_id.toString(),
          interview_id: d.interview_id,
          studentName: d.student_name || 'Unknown',
          email: d.student_email || 'Unknown',
          jobRole: d.job_role,
          company: d.company,
          score: Math.round(d.average_score * 10), // converting out of 10 to %
          status: d.status === "completed" ? "Completed" : d.status === "in_progress" ? "In Progress" : "Pending",
          date: new Date(d.date).toLocaleDateString(),
          aiFeedback: d.report?.narrative_summary || 'No feedback yet',
          technicalSkills: d.report?.technical_score ? Math.round(d.report.technical_score * 10) : 0,
          communication: d.report?.hr_score ? Math.round(d.report.hr_score * 10) : 0,
          problemSolving: d.report?.confidence_score ? Math.round(d.report.confidence_score * 10) : 0,
          rawReport: d.report
        }));
        setInterviews(formatted);
      } catch (err) {
        console.error("Failed to fetch all interviews", err);
      }
    };
    fetchAll();
  }, []);

  const filteredResults = interviews.filter((result) => {
    const matchesStatus = filterStatus === "all" || result.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = 
      result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.jobRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.company.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: interviews.length,
    completed: interviews.filter((r) => r.status === "Completed").length,
    inProgress: interviews.filter((r) => r.status === "In Progress").length,
    averageScore: interviews.filter((r) => r.status === "Completed").length > 0 
      ? Math.round(
          interviews
            .filter((r) => r.status === "Completed")
            .reduce((sum, r) => sum + r.score, 0) /
            interviews.filter((r) => r.status === "Completed").length
        ) 
      : 0,
  };

  const handleDownloadReport = () => {
    if (!selectedResult) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = 50;

    doc.setFontSize(18);
    doc.text(`Interview Report: ${selectedResult.studentName}`, margin, y);
    y += 30;
    doc.setFontSize(11);
    doc.text(`Role: ${selectedResult.jobRole} @ ${selectedResult.company}`, margin, y);
    y += 18;
    doc.text(`Date: ${selectedResult.date}`, margin, y);
    y += 18;
    doc.text(`Overall Score: ${selectedResult.score}%`, margin, y);
    y += 30;

    doc.setFontSize(12);
    doc.text('AI Feedback & Narrative Summary', margin, y);
    y += 18;
    doc.setFontSize(10);
    const narrativeLines = doc.splitTextToSize(selectedResult.aiFeedback, 500);
    doc.text(narrativeLines, margin, y);
    y += narrativeLines.length * 15 + 10;

    if (selectedResult.rawReport?.skill_gap_analysis) {
      doc.setFontSize(11);
      doc.text('Skill Gap Analysis', margin, y);
      y += 18;
      doc.setFontSize(10);
      const gapLines = doc.splitTextToSize(selectedResult.rawReport.skill_gap_analysis, 500);
      doc.text(gapLines, margin, y);
      y += gapLines.length * 15 + 10;
    }
    
    if (selectedResult.rawReport?.hiring_readiness_score) {
      doc.setFontSize(11);
      doc.text(`Hiring Readiness: ${selectedResult.rawReport.hiring_readiness_score}%`, margin, y);
    }

    doc.save(`${selectedResult.studentName.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const handleContactStudent = async () => {
    if (!selectedResult) return;
    try {
      await interviewAPI.sendReportEmail(selectedResult.interview_id);
      alert(`Email sent successfully to ${selectedResult.email}`);
    } catch (err) {
      console.error(err);
      alert("Failed to send email.");
    }
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
                {selectedResult.rawReport?.skill_gap_analysis && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#F8FAFC', borderLeft: '3px solid #DC2626' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block', marginBottom: '0.25rem' }}>Skill Gap Analysis:</strong>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>{selectedResult.rawReport.skill_gap_analysis}</span>
                  </div>
                )}
                {selectedResult.rawReport?.hiring_readiness_score && (
                  <div style={{ marginTop: '0.5rem', fontWeight: 600, color: '#DC2626' }}>
                    Hiring Readiness Score: {selectedResult.rawReport.hiring_readiness_score}%
                  </div>
                )}
              </div>

              <div className={styles.detailActions}>
                <button className={styles.downloadButton} onClick={handleDownloadReport}>Download Report</button>
                <button className={styles.contactButton} onClick={handleContactStudent}>Email Report to Student</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/admin-portal.module.css';

// ── Placeholder Components for Modules ──────────────────────
const StudentsModule = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalType, setModalType] = useState<'profile' | 'resume' | 'history' | 'reports' | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch('http://localhost:8000/admin/students', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setStudents(data.data || []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const openModal = async (studentId: number, type: 'profile' | 'resume' | 'history' | 'reports') => {
    setModalType(type);
    setModalLoading(true);
    setModalData(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:8000/admin/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setModalData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setModalData(null);
  };

  const handleDelete = async (studentId: number) => {
    if (!window.confirm("Are you sure you want to delete this student and all their data? This cannot be undone.")) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`http://localhost:8000/admin/users/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setStudents(students.filter(s => s.id !== studentId));
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to delete student");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = (student: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(student, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `student_${student.id}_export.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Student Management</h2>
      {loading ? (
        <p>Loading students data...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Resume</th>
                <th>Job Role</th>
                <th>Interview Status</th>
                <th>Overall Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.department || '-'}</td>
                  <td>{student.has_resume ? "Uploaded" : "Pending"}</td>
                  <td>{student.job_role || '-'}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: student.interview_status === 'completed' ? '#dcfce7' : (student.interview_status === 'in_progress' ? '#fef3c7' : '#fee2e2'),
                      color: student.interview_status === 'completed' ? '#166534' : (student.interview_status === 'in_progress' ? '#92400e' : '#991b1b')
                    }}>
                      {student.interview_status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#DC2626' }}>{student.overall_score !== null ? student.overall_score : "-"}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openModal(student.id, 'profile')}>View Profile</button>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openModal(student.id, 'resume')}>View Resume</button>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openModal(student.id, 'reports')}>View Reports</button>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#991b1b', color: 'white' }} onClick={() => handleDelete(student.id)}>Delete Student</button>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#475569' }} onClick={() => handleExport(student)}>Export Data</button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Overlay */}
      {modalType && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalType === 'profile' && 'Student Profile'}
                {modalType === 'resume' && 'Resume Analysis'}
                {modalType === 'history' && 'Interview History'}
                {modalType === 'reports' && 'Performance Reports'}
              </h3>
              <button className={styles.modalClose} onClick={closeModal}>&times;</button>
            </div>
            
            <div className={styles.modalBody}>
              {modalLoading ? (
                <p>Loading data...</p>
              ) : modalData ? (
                <>
                  {modalType === 'profile' && (
                    <div className={styles.modalSection}>
                      <p><strong>Name:</strong> {modalData.student.name}</p>
                      <p><strong>Email:</strong> {modalData.student.email}</p>
                      <p><strong>Department:</strong> {modalData.student.department || 'N/A'}</p>
                      <p><strong>Role:</strong> {modalData.student.role}</p>
                      <p><strong>Account Status:</strong> {modalData.student.is_verified ? "Verified" : "Pending Verification"}</p>
                    </div>
                  )}

                  {modalType === 'resume' && (
                    <div>
                      {modalData.resumes.length === 0 ? (
                        <p>No resumes uploaded.</p>
                      ) : (
                        modalData.resumes.map((res: any, idx: number) => (
                          <div key={idx} className={styles.modalSection}>
                            <h4 className={styles.modalSubtitle}>Resume Version {idx + 1}</h4>
                            <p><strong>Uploaded:</strong> {new Date(res.uploaded_at).toLocaleString()}</p>
                            {res.skills_extracted && (
                              <p><strong>Extracted Skills:</strong> {res.skills_extracted}</p>
                            )}
                            {res.ai_analysis && (
                              <div style={{ marginTop: '1rem' }}>
                                <strong>AI Analysis:</strong>
                                <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{res.ai_analysis}</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {modalType === 'history' && (
                    <div>
                      {modalData.interviews.length === 0 ? (
                        <p>No interviews found.</p>
                      ) : (
                        modalData.interviews.map((ivData: any, idx: number) => (
                          <div key={idx} className={styles.modalSection}>
                            <p><strong>Company:</strong> {ivData.interview.company}</p>
                            <p><strong>Job Role:</strong> {ivData.interview.job_role}</p>
                            <p><strong>Status:</strong> {ivData.interview.status}</p>
                            <p><strong>Date:</strong> {new Date(ivData.interview.created_at).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {modalType === 'reports' && (
                    <div>
                      {modalData.interviews.length === 0 ? (
                        <p>No interview reports available.</p>
                      ) : (
                        modalData.interviews.map((ivData: any, idx: number) => (
                          ivData.report ? (
                            <div key={idx} className={styles.modalSection}>
                              <h4 className={styles.modalSubtitle}>{ivData.interview.company} - {ivData.interview.job_role}</h4>
                              <p><strong>Final Recommendation:</strong> {ivData.report.recommendation}</p>
                              <p><strong>Readiness Score:</strong> {ivData.report.hiring_readiness_score}/100</p>
                              <p><strong>Final Interview Score:</strong> {ivData.report.final_interview_score}/10</p>
                              <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
                                <strong>Strengths:</strong><br />{ivData.report.strengths}
                              </div>
                            </div>
                          ) : (
                            <div key={idx} className={styles.modalSection}>
                              <h4 className={styles.modalSubtitle}>{ivData.interview.company} - {ivData.interview.job_role}</h4>
                              <p>No report generated yet. Status: {ivData.interview.status}</p>
                            </div>
                          )
                        ))
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p>Error loading data.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InterviewsModule = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalType, setModalType] = useState<'details' | 'questions' | 'answers' | 'evaluation' | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch('http://localhost:8000/admin/interviews', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setInterviews(data.data || []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const openModal = async (interviewId: number, type: 'details' | 'questions' | 'answers' | 'evaluation') => {
    setModalType(type);
    setModalLoading(true);
    setModalData(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:8000/admin/interviews/${interviewId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setModalData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setModalData(null);
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Interview Management</h2>
      {loading ? (
        <p>Loading interviews data...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Interview ID</th>
                <th>Student</th>
                <th>Company</th>
                <th>Role</th>
                <th>Date</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((iv, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>#{iv.id}</td>
                  <td>{iv.candidate_name}</td>
                  <td>{iv.company}</td>
                  <td>{iv.job_role}</td>
                  <td>{new Date(iv.created_at).toLocaleDateString()}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: iv.status === 'completed' ? '#dcfce7' : (iv.status === 'in_progress' ? '#fef3c7' : '#fee2e2'),
                      color: iv.status === 'completed' ? '#166534' : (iv.status === 'in_progress' ? '#92400e' : '#991b1b')
                    }}>
                      {iv.status}
                    </span>
                  </td>
                  <td>{iv.duration || "N/A"}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openModal(iv.id, 'details')}>View interview details</button>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#475569' }} onClick={() => alert('Replay functionality coming soon...')}>Replay interview responses</button>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openModal(iv.id, 'questions')}>View generated questions</button>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openModal(iv.id, 'answers')}>View candidate answers</button>
                    </div>
                  </td>
                </tr>
              ))}
              {interviews.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No interviews found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Overlay */}
      {modalType && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalType === 'details' && 'Interview Details'}
                {modalType === 'questions' && 'Questions Asked'}
                {modalType === 'answers' && 'Candidate Answers'}
                {modalType === 'evaluation' && 'Evaluation Results'}
              </h3>
              <button className={styles.modalClose} onClick={closeModal}>&times;</button>
            </div>
            
            <div className={styles.modalBody}>
              {modalLoading ? (
                <p>Loading data...</p>
              ) : modalData ? (
                <>
                  {modalType === 'details' && (
                    <div className={styles.modalSection}>
                      <h4 className={styles.modalSubtitle}>Candidate Info</h4>
                      <p><strong>Name:</strong> {modalData.candidate.name}</p>
                      <p><strong>Email:</strong> {modalData.candidate.email}</p>
                      <h4 className={styles.modalSubtitle} style={{ marginTop: '1.5rem' }}>Interview Info</h4>
                      <p><strong>Company:</strong> {modalData.interview.company}</p>
                      <p><strong>Job Role:</strong> {modalData.interview.job_role}</p>
                      <p><strong>Status:</strong> {modalData.interview.status}</p>
                      <p><strong>Date:</strong> {new Date(modalData.interview.created_at).toLocaleString()}</p>
                    </div>
                  )}

                  {modalType === 'questions' && (
                    <div>
                      {modalData.qa_details.map((qa: any, idx: number) => (
                        <div key={idx} className={styles.modalSection}>
                          <p><strong>Q{idx + 1} ({qa.question.question_type}):</strong> {qa.question.question}</p>
                          {qa.question.expected_answer && (
                            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                              <strong>Expected Answer:</strong> {qa.question.expected_answer}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {modalType === 'answers' && (
                    <div>
                      {modalData.qa_details.map((qa: any, idx: number) => (
                        <div key={idx} className={styles.modalSection}>
                          <p><strong>Q{idx + 1}:</strong> {qa.question.question}</p>
                          <div style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '0.5rem', marginTop: '0.5rem', border: '1px solid #E2E8F0' }}>
                            <p style={{ margin: 0 }}><strong>Candidate Answer:</strong></p>
                            <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{qa.answer ? qa.answer.answer_text : <i>No answer provided</i>}</p>
                          </div>
                          {qa.answer && qa.answer.feedback && (
                            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#DC2626' }}>
                              <strong>AI Feedback:</strong> {qa.answer.feedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {modalType === 'evaluation' && modalData.report ? (
                    <div>
                      <div className={styles.modalSection}>
                        <h4 className={styles.modalSubtitle}>Final Recommendation: {modalData.report.recommendation}</h4>
                        <p><strong>Readiness Score:</strong> {modalData.report.hiring_readiness_score}/100</p>
                        <p><strong>Final Interview Score:</strong> {modalData.report.final_interview_score}/10</p>
                        <p><strong>Technical Score:</strong> {modalData.report.overall_technical_score}/10</p>
                        <p><strong>HR Score:</strong> {modalData.report.overall_hr_score}/10</p>
                      </div>
                      
                      {modalData.report.strengths && (
                        <div className={styles.modalSection}>
                          <h4 className={styles.modalSubtitle}>Strengths</h4>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{modalData.report.strengths}</p>
                        </div>
                      )}
                      
                      {modalData.report.weaknesses && (
                        <div className={styles.modalSection}>
                          <h4 className={styles.modalSubtitle}>Weaknesses</h4>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{modalData.report.weaknesses}</p>
                        </div>
                      )}
                      
                      {modalData.report.improvement_suggestions && (
                        <div className={styles.modalSection}>
                          <h4 className={styles.modalSubtitle}>Improvement Suggestions</h4>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{modalData.report.improvement_suggestions}</p>
                        </div>
                      )}
                    </div>
                  ) : modalType === 'evaluation' && (
                    <p>No evaluation report generated yet.</p>
                  )}
                </>
              ) : (
                <p>Error loading data.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsModule = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch('http://localhost:8000/admin/reports', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setReports(data.data || []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleExport = () => {
    const token = localStorage.getItem('adminToken');
    fetch('http://localhost:8000/admin/reports/export', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      // In a real app, convert this JSON to CSV and download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", "interview_reports_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });
  };

  return (
    <div className={styles.panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className={styles.panelTitle} style={{ margin: 0 }}>Reports & Export</h2>
        <button className={styles.primaryBtn} onClick={handleExport}>Export All Data</button>
      </div>

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Technical Score</th>
                <th>HR Score</th>
                <th>Resume Match Score</th>
                <th>Company Readiness Score</th>
                <th>Overall Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{rep.candidate_name}</td>
                  <td>{rep.job_role}</td>
                  <td>{rep.technical_score || '-'}</td>
                  <td>{rep.hr_score || '-'}</td>
                  <td>N/A</td>
                  <td>
                    <div style={{ width: '100%', background: '#E2E8F0', borderRadius: '0.5rem', height: '0.5rem', overflow: 'hidden' }}>
                      <div style={{ width: `${rep.readiness || 0}%`, background: '#16A34A', height: '100%' }}></div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#DC2626' }}>{rep.final_score || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setActiveReport(rep)}>View Report</button>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#475569', boxShadow: 'none' }} onClick={() => alert('Generating PDF...')}>Download PDF</button>
                      <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#166534', boxShadow: 'none' }} onClick={() => alert('Exporting to Excel...')}>Export Excel</button>
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No reports found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Details Modal */}
      {activeReport && (
        <div className={styles.modalOverlay} onClick={() => setActiveReport(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Detailed AI Evaluation Report</h3>
              <button className={styles.modalClose} onClick={() => setActiveReport(null)}>&times;</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.modalSection} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <h4 className={styles.modalSubtitle}>Candidate Info</h4>
                  <p><strong>Name:</strong> {activeReport.candidate_name}</p>
                  <p><strong>Role:</strong> {activeReport.job_role} at {activeReport.company}</p>
                  <p><strong>Recommendation:</strong> {activeReport.recommendation}</p>
                </div>
                <div>
                  <h4 className={styles.modalSubtitle}>Primary Scores</h4>
                  <p><strong>Overall Rating:</strong> {activeReport.final_score}/10</p>
                  <p><strong>Readiness:</strong> {activeReport.readiness}/100</p>
                  <p><strong>Tech Score:</strong> {activeReport.technical_score}/100</p>
                  <p><strong>HR Score:</strong> {activeReport.hr_score}/100</p>
                </div>
              </div>

              <div className={styles.modalSection}>
                <h4 className={styles.modalSubtitle}>Factor-wise Breakdown</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <strong>Technical Factors:</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                      <li>Accuracy: {activeReport.tech_factors?.accuracy || '-'}/100</li>
                      <li>Concept: {activeReport.tech_factors?.concept || '-'}/100</li>
                      <li>Problem Solving: {activeReport.tech_factors?.problem_solving || '-'}/100</li>
                      <li>Communication: {activeReport.tech_factors?.communication || '-'}/100</li>
                      <li>Code Quality: {activeReport.tech_factors?.code_quality || '-'}/100</li>
                    </ul>
                  </div>
                  <div>
                    <strong>HR Factors:</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                      <li>Communication: {activeReport.hr_factors?.communication || '-'}/100</li>
                      <li>Confidence: {activeReport.hr_factors?.confidence || '-'}/100</li>
                      <li>Professionalism: {activeReport.hr_factors?.professionalism || '-'}/100</li>
                      <li>Adaptability: {activeReport.hr_factors?.adaptability || '-'}/100</li>
                      <li>Teamwork: {activeReport.hr_factors?.teamwork || '-'}/100</li>
                    </ul>
                  </div>
                </div>
              </div>

              {activeReport.strengths && (
                <div className={styles.modalSection}>
                  <h4 className={styles.modalSubtitle}>Key Strengths</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{activeReport.strengths}</p>
                </div>
              )}

              {activeReport.weaknesses && (
                <div className={styles.modalSection}>
                  <h4 className={styles.modalSubtitle}>Areas of Weakness</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{activeReport.weaknesses}</p>
                </div>
              )}

              {activeReport.improvement_suggestions && (
                <div className={styles.modalSection}>
                  <h4 className={styles.modalSubtitle}>Improvement Suggestions</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{activeReport.improvement_suggestions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AnalyticsModule = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    Promise.all([
      fetch('http://localhost:8000/admin/analytics/trends', { headers }).then(r => r.json()),
      fetch('http://localhost:8000/admin/analytics/department', { headers }).then(r => r.json()),
      fetch('http://localhost:8000/admin/analytics/company', { headers }).then(r => r.json()),
      fetch('http://localhost:8000/admin/analytics/job-role', { headers }).then(r => r.json()),
      fetch('http://localhost:8000/admin/analytics/rankings', { headers }).then(r => r.json())
    ]).then(([trendsData, deptData, compData, rolesData, rankingsData]) => {
      setTrends(Array.isArray(trendsData) ? trendsData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setCompanies(Array.isArray(compData) ? compData : []);
      setJobRoles(Array.isArray(rolesData) ? rolesData : []);
      setRankings(Array.isArray(rankingsData) ? rankingsData : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle} style={{ marginBottom: '2rem' }}>Analytics Portal</h2>
      {loading ? (
        <p>Loading charts...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Trends */}
          <div>
            <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Interview Trends</h3>
            <div style={{ background: '#FAF6EE', padding: '1.5rem', borderRadius: '1rem', color: '#0F172A', boxShadow: '6px 6px 16px rgba(139, 120, 95, 0.15), -6px -6px 16px #FFFFFF' }}>
              {trends.map((t, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                  <div style={{ width: '120px', fontWeight: 600 }}>{new Date(t.date).toLocaleDateString('default', { month: 'long', day: 'numeric' })}</div>
                  <div style={{ width: '50px', textAlign: 'right', marginRight: '1.5rem' }}>{t.count}</div>
                  <div style={{ flex: 1, background: '#E2E8F0', height: '0.6rem', borderRadius: '0.3rem', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((t.count / Math.max(...trends.map(x=>x.count), 1)) * 100, 100)}%`, background: '#DC2626', height: '100%' }}></div>
                  </div>
                </div>
              ))}
              {trends.length === 0 && <p>No trend data available.</p>}
            </div>
          </div>

          {/* Department Performance */}
          <div>
            <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Department Performance</h3>
            <div style={{ background: '#FAF6EE', padding: '1.5rem', borderRadius: '1rem', color: '#0F172A', boxShadow: '6px 6px 16px rgba(139, 120, 95, 0.15), -6px -6px 16px #FFFFFF' }}>
              {departments.map((d, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                  <div style={{ width: '120px', fontWeight: 600 }}>{d.department}</div>
                  <div style={{ width: '50px', textAlign: 'right', marginRight: '1.5rem' }}>{d.avg_score}%</div>
                  <div style={{ flex: 1, background: '#E2E8F0', height: '0.6rem', borderRadius: '0.3rem', overflow: 'hidden' }}>
                    <div style={{ width: `${d.avg_score || 0}%`, background: '#DC2626', height: '100%' }}></div>
                  </div>
                </div>
              ))}
              {departments.length === 0 && <p>No department data available.</p>}
            </div>
          </div>

          {/* Company Readiness */}
          <div>
            <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Company-wise Selection Readiness</h3>
            <div style={{ background: '#FAF6EE', padding: '1.5rem', borderRadius: '1rem', color: '#0F172A', boxShadow: '6px 6px 16px rgba(139, 120, 95, 0.15), -6px -6px 16px #FFFFFF' }}>
              {companies.map((c, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                  <div style={{ width: '120px', fontWeight: 600 }}>{c.company}</div>
                  <div style={{ width: '50px', textAlign: 'right', marginRight: '1.5rem' }}>{c.avg_score}%</div>
                  <div style={{ flex: 1, background: '#E2E8F0', height: '0.6rem', borderRadius: '0.3rem', overflow: 'hidden' }}>
                    <div style={{ width: `${c.avg_score || 0}%`, background: '#DC2626', height: '100%' }}></div>
                  </div>
                </div>
              ))}
              {companies.length === 0 && <p>No company data available.</p>}
            </div>
          </div>

          {/* Job Role Readiness */}
          <div>
            <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Job Role Selection Readiness</h3>
            <div style={{ background: '#FAF6EE', padding: '1.5rem', borderRadius: '1rem', color: '#0F172A', boxShadow: '6px 6px 16px rgba(139, 120, 95, 0.15), -6px -6px 16px #FFFFFF' }}>
              {jobRoles.map((r, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                  <div style={{ width: '120px', fontWeight: 600 }}>{r.job_role}</div>
                  <div style={{ width: '50px', textAlign: 'right', marginRight: '1.5rem' }}>{r.avg_score}%</div>
                  <div style={{ flex: 1, background: '#E2E8F0', height: '0.6rem', borderRadius: '0.3rem', overflow: 'hidden' }}>
                    <div style={{ width: `${r.avg_score || 0}%`, background: '#DC2626', height: '100%' }}></div>
                  </div>
                </div>
              ))}
              {jobRoles.length === 0 && <p>No job role data available.</p>}
            </div>
          </div>

          {/* Top Rankings */}
          <div>
            <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Top Candidates</h3>
            <div style={{ background: '#FAF6EE', padding: '1.5rem', borderRadius: '1rem', color: '#0F172A', boxShadow: '6px 6px 16px rgba(139, 120, 95, 0.15), -6px -6px 16px #FFFFFF' }}>
              {rankings.map((r, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                  <div style={{ width: '150px', fontWeight: 600 }}>{r.name}</div>
                  <div style={{ width: '150px', color: '#64748B' }}>{r.role}</div>
                  <div style={{ width: '50px', textAlign: 'right', marginRight: '1.5rem' }}>{r.score}%</div>
                  <div style={{ flex: 1, background: '#E2E8F0', height: '0.6rem', borderRadius: '0.3rem', overflow: 'hidden' }}>
                    <div style={{ width: `${r.score || 0}%`, background: '#DC2626', height: '100%' }}></div>
                  </div>
                </div>
              ))}
              {rankings.length === 0 && <p>No rankings data available.</p>}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

const SettingsModule = () => {
  const [status, setStatus] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch('http://localhost:8000/admin/system-status', { headers })
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(err => console.error(err));

    fetch('http://localhost:8000/admin/users', { headers })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  }, []);

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user? This will also delete all their interviews, reports, and resumes.")) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:8000/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>System Settings & Users</h2>
      
      {/* System Status */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>System Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC' }}>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Database</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: status?.database_status === 'Online' ? '#10B981' : '#EF4444' }}>{status ? status.database_status : 'Loading...'}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>{status?.database_type}</div>
          </div>
          <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC' }}>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Knowledge Base</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{status ? status.knowledge_base.pdf_documents + status.knowledge_base.json_documents : '0'}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>Total Indexed Documents</div>
          </div>
          <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC' }}>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>System Memory</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{status ? `${status.system.memory_percent}%` : 'Loading...'}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>Utilization</div>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div>
        <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>User Management</h3>
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>#{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: u.role === 'admin' ? '#fef3c7' : '#e0e7ff',
                      color: u.role === 'admin' ? '#92400e' : '#3730a3'
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={styles.primaryBtn} 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#991b1b', color: 'white', opacity: u.role === 'admin' ? 0.5 : 1 }} 
                      disabled={u.role === 'admin'}
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

const QuestionBankModule = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [category, setCategory] = useState<string | null>(null);

  const fetchQuestions = (cat: string | null) => {
    const token = localStorage.getItem('adminToken');
    let url = 'http://localhost:8000/admin/question-bank';
    if (cat) {
      if (cat === 'Company Specific') url += '?category=Company Specific';
      else url += `?type=${cat.toLowerCase()}`;
    }
    
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchQuestions(category);
  }, [category]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:8000/admin/question-bank/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setQuestions(questions.filter(q => q.id !== id));
      } else {
        alert("Failed to delete question");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className={styles.panelTitle} style={{ marginBottom: 0 }}>Question Bank Management</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={styles.primaryBtn} onClick={() => alert('Add Question Modal coming soon...')}>Add Questions</button>
          <button className={styles.primaryBtn} style={{ background: '#475569' }} onClick={() => alert('JSON/PDF Upload UI coming soon...')}>Upload JSON/PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className={styles.primaryBtn} style={{ opacity: category === null ? 1 : 0.6, background: '#334155' }} onClick={() => setCategory(null)}>All</button>
        <button className={styles.primaryBtn} style={{ opacity: category === 'Technical' ? 1 : 0.6, background: '#334155' }} onClick={() => setCategory('Technical')}>Technical</button>
        <button className={styles.primaryBtn} style={{ opacity: category === 'HR' ? 1 : 0.6, background: '#334155' }} onClick={() => setCategory('HR')}>HR</button>
        <button className={styles.primaryBtn} style={{ opacity: category === 'Company Specific' ? 1 : 0.6, background: '#334155' }} onClick={() => setCategory('Company Specific')}>Company Specific</button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Question</th>
              <th>Type</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.id}>
                <td style={{ fontWeight: 600 }}>#{q.id}</td>
                <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.question}</td>
                <td>{q.question_type}</td>
                <td>{q.category || '-'}</td>
                <td>{q.difficulty || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => alert('Update Question Modal coming soon...')}>Update</button>
                    <button className={styles.primaryBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#991b1b', color: 'white' }} onClick={() => handleDelete(q.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No questions found in this category.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ResumeAnalyticsModule = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch('http://localhost:8000/admin/resumes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setResumes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const renderAnalyticsCard = (resume: any) => {
    // Parse skills or generate mock analytics for display purposes
    let matchedSkills = ['Python', 'SQL', 'FastAPI'];
    let missingSkills = ['Docker', 'AWS'];
    let score = 85;
    
    try {
      if (resume.skills_extracted) {
        const parsed = typeof resume.skills_extracted === 'string' ? JSON.parse(resume.skills_extracted) : resume.skills_extracted;
        if (Array.isArray(parsed) && parsed.length > 0) {
          matchedSkills = parsed.slice(0, 5);
        } else if (typeof parsed === 'string') {
          matchedSkills = parsed.split(',').slice(0, 5).map(s => s.trim());
        }
      }
      // Simple mock logic for demonstration
      score = Math.floor(Math.random() * 20) + 75; // 75-95%
    } catch (e) {}

    return (
      <div key={resume.id} style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{resume.candidate_name}</h3>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{resume.email}</div>
          </div>
          <div style={{ fontSize: '1.2rem', fontFamily: 'monospace' }}>
            Resume Score: <span style={{ fontWeight: 'bold', color: score >= 80 ? '#10B981' : '#F59E0B' }}>{score}%</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#E2E8F0' }}>Matched Skills:</div>
            {matchedSkills.map((skill: string, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: '#10B981', fontFamily: 'monospace' }}>
                <span>✓</span> <span style={{ color: '#F8FAFC' }}>{skill}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#E2E8F0' }}>Missing:</div>
            {missingSkills.map((skill: string, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: '#EF4444', fontFamily: 'monospace' }}>
                <span>X</span> <span style={{ color: '#F8FAFC' }}>{skill}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle} style={{ marginBottom: '2rem' }}>Resume Analytics</h2>
      {loading ? (
        <p>Loading analytics...</p>
      ) : (
        <div>
          {resumes.map(renderAnalyticsCard)}
          {resumes.length === 0 && <p>No resumes analyzed yet.</p>}
        </div>
      )}
    </div>
  );
};

const CompanyManagementModule = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
      fetch('http://localhost:8000/admin/companies', { headers }).then(res => res.json()),
      fetch('http://localhost:8000/admin/job-roles', { headers }).then(res => res.json())
    ]).then(([comps, rls]) => {
      setCompanies(comps);
      setRoles(rls);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const getCompanyName = (companyId: number) => {
    const c = companies.find(comp => comp.id === companyId);
    return c ? c.name : 'Unknown Company';
  };

  return (
    <div className={styles.panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className={styles.panelTitle} style={{ marginBottom: 0 }}>Company Management</h2>
        <button className={styles.primaryBtn} onClick={() => alert('Add Company/Role Modal coming soon...')}>Add New Role</button>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#334155', borderRadius: '1rem', color: '#F8FAFC' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#94A3B8' }}>Admin can add:</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8', fontFamily: 'monospace' }}>
          <li>Company Name</li>
          <li>Role</li>
          <li>Required Skills</li>
          <li>Interview Pattern</li>
        </ul>
      </div>

      <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Examples / Active Templates:</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {roles.map(role => (
            <div key={role.id} style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                <div style={{ fontWeight: 'bold' }}>{getCompanyName(role.company_id)}</div>
                <div>{role.title}</div>
                <div style={{ color: '#10B981' }}>{role.required_skills || 'N/A'}</div>
                <div style={{ color: '#F59E0B' }}>{role.interview_template || 'Custom Template'}</div>
              </div>
            </div>
          ))}
          {roles.length === 0 && (
            <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                <div style={{ fontWeight: 'bold' }}>Amazon</div>
                <div>SDE</div>
                <div style={{ color: '#10B981' }}>DSA + OOP + SQL</div>
                <div style={{ color: '#F59E0B' }}>Technical Heavy Pattern</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const UserRoleManagementModule = () => {
  return (
    <div className={styles.panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className={styles.panelTitle} style={{ marginBottom: 0 }}>User & Role Management</h2>
        <button className={styles.primaryBtn} onClick={() => alert('Manage Roles Modal coming soon...')}>Manage Roles</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Roles:</h3>
          <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC' }}>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <li>Super Admin</li>
              <li>Admin</li>
              <li>TPO</li>
              <li>Recruiter</li>
              <li>Student</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Permissions:</h3>
          <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC' }}>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <li>Create User</li>
              <li>Delete User</li>
              <li>View Reports</li>
              <li>Manage Interviews</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemMonitoringModule = () => {
  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle} style={{ marginBottom: '2rem' }}>System Monitoring</h2>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#334155', borderRadius: '1rem', color: '#F8FAFC' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#94A3B8' }}>Useful if you're using:</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8', fontFamily: 'monospace', fontSize: '1.1rem' }}>
          <li>Qwen</li>
          <li>Gemini</li>
          <li>RAG</li>
        </ul>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Show:</h3>
          <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC' }}>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <li>Model Status</li>
              <li>API Status</li>
              <li>Vector DB Status</li>
              <li>Database Status</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Example:</h3>
          <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', lineHeight: '2', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <div style={{ color: '#94A3B8' }}>Qwen Model</div>
              <div style={{ color: '#10B981', fontWeight: 'bold' }}>Online</div>
              
              <div style={{ color: '#94A3B8' }}>Gemini API</div>
              <div style={{ color: '#10B981', fontWeight: 'bold' }}>Active</div>
              
              <div style={{ color: '#94A3B8' }}>Vector Store</div>
              <div style={{ color: '#10B981', fontWeight: 'bold' }}>Healthy</div>
              
              <div style={{ color: '#94A3B8' }}>Database Status</div>
              <div style={{ color: '#10B981', fontWeight: 'bold' }}>Connected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DatabaseSchemaModule = () => {
  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle} style={{ marginBottom: '2rem' }}>Database Schema</h2>
      
      <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Recommended Database Tables</h3>
      <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC', position: 'relative' }}>
        <button 
          onClick={() => alert('Copied to clipboard!')}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          title="Copy"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2', fontFamily: 'monospace', fontSize: '1.1rem', listStyleType: 'none', padding: 0 }}>
          <li>users</li>
          <li>students</li>
          <li>interviews</li>
          <li>questions</li>
          <li>answers</li>
          <li>reports</li>
          <li>companies</li>
          <li>job_roles</li>
          <li>resumes</li>
          <li>skills</li>
          <li>analytics</li>
          <li>feedback</li>
        </ul>
      </div>
    </div>
  );
};

const AdvancedAnalyticsModule = () => {
  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle} style={{ marginBottom: '2rem' }}>Advanced Analytics & Predictions</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Candidate Ranking</h3>
          <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }} title="Copy">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1rem', lineHeight: '2', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <div style={{ color: '#94A3B8' }}>Rank #1</div><div style={{ color: '#10B981', fontWeight: 'bold' }}>92%</div>
              <div style={{ color: '#94A3B8' }}>Rank #2</div><div style={{ color: '#10B981', fontWeight: 'bold' }}>89%</div>
              <div style={{ color: '#94A3B8' }}>Rank #3</div><div style={{ color: '#10B981', fontWeight: 'bold' }}>86%</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Hiring Recommendation</h3>
          <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }} title="Copy">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2', fontFamily: 'monospace', fontSize: '1.1rem', listStyleType: 'none', padding: 0 }}>
              <li>Strongly Recommended</li>
              <li>Recommended</li>
              <li>Needs Improvement</li>
              <li>Not Recommended</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Placement Prediction</h3>
          <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }} title="Copy">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', lineHeight: '2', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <div style={{ color: '#94A3B8' }}>Amazon Readiness:</div><div style={{ color: '#10B981', fontWeight: 'bold' }}>82%</div>
              <div style={{ color: '#94A3B8' }}>Google Readiness:</div><div style={{ color: '#F59E0B', fontWeight: 'bold' }}>75%</div>
              <div style={{ color: '#94A3B8' }}>TCS Readiness:</div><div style={{ color: '#10B981', fontWeight: 'bold' }}>91%</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className={styles.modalSubtitle} style={{ marginBottom: '1rem' }}>Skill Gap Analysis</h3>
          <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '1rem', color: '#F8FAFC', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }} title="Copy">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <div style={{ lineHeight: '2', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <div style={{ color: '#94A3B8', marginBottom: '0.2rem' }}>Current Skills:</div>
              <div style={{ color: '#F8FAFC', marginBottom: '1.5rem' }}>Python, SQL</div>
              
              <div style={{ color: '#94A3B8', marginBottom: '0.2rem' }}>Missing:</div>
              <div style={{ color: '#F8FAFC' }}>Docker, AWS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    
    if (activeTab === 'dashboard') {
      fetch('http://localhost:8000/admin/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('adminToken');
            navigate('/admin');
          }
          throw new Error('Failed to fetch stats');
        }
        return res.json();
      })
      .then(data => setStats(data))
      .catch(err => console.error(err));
    }
  }, [activeTab, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    navigate('/admin');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'students', label: 'Students' },
    { id: 'interviews', label: 'Interviews' },
    { id: 'reports', label: 'Reports' },
    { id: 'question-bank', label: 'Question Bank' },
    { id: 'resume-analytics', label: 'Resume Analytics' },
    { id: 'company-management', label: 'Company Management' },
    { id: 'user-roles', label: 'User & Roles' },
    { id: 'system-monitoring', label: 'System Monitoring' },
    { id: 'database-schema', label: 'Database Schema' },
    { id: 'advanced-analytics', label: 'Adv. Analytics' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.brand}>AI Campus Admin</div>
        
        <div style={{ flex: 1, marginTop: '2rem' }}>
          {tabs.map(tab => (
            <div 
              key={tab.id}
              className={activeTab === tab.id ? styles.navItemActive : styles.navItem}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          <button className={styles.logoutBtn} onClick={handleLogout} style={{ width: '100%' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label}...`} 
              className={styles.inputField} 
              style={{ marginBottom: 0, width: '300px' }} 
            />
            <button className={styles.primaryBtn}>Search</button>
          </div>
        </div>

        {/* Dynamic Content area */}
        {activeTab === 'dashboard' && stats && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard} style={{ background: '#1E293B', color: 'white' }}>
                <div className={styles.statValue} style={{ color: 'white', fontSize: '1.5rem', textAlign: 'left' }}>Quick Summary</div>
                <div style={{ textAlign: 'left', fontSize: '1.1rem', marginTop: '1rem', lineHeight: '1.8' }}>
                  <div><strong>Total Students:</strong> {stats.total_students}</div>
                  <div><strong>Interviews Completed:</strong> {stats.completed_interviews}</div>
                  <div><strong>Average Score:</strong> {(((stats.avg_technical_score * 0.7) + (stats.avg_hr_score * 0.3)) || 0).toFixed(1)}%</div>
                  <div><strong>Top Company:</strong> {stats.company_stats?.sort((a: any, b: any) => b.count - a.count)[0]?.company || 'N/A'}</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.total_students}</div>
                <div className={styles.statLabel}>Total Students</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.total_interviews}</div>
                <div className={styles.statLabel}>Total Interviews</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.interviews_today}</div>
                <div className={styles.statLabel}>Interviews Today</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.completed_interviews}</div>
                <div className={styles.statLabel}>Completed Interviews</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.pending_interviews}</div>
                <div className={styles.statLabel}>Pending Interviews</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.avg_technical_score}</div>
                <div className={styles.statLabel}>Avg Tech Score</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.avg_hr_score}</div>
                <div className={styles.statLabel}>Avg HR Score</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.resume_upload_count}</div>
                <div className={styles.statLabel}>Resume Upload Count</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>Top Performing Students</h2>
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job Role</th>
                        <th>Final Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_students.map((student: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{student.name}</td>
                          <td>{student.role}</td>
                          <td style={{ fontWeight: 700, color: '#16A34A' }}>{student.score}/10</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>Recent Activity</h2>
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job Role</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_activity.map((activity: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{activity.name}</td>
                          <td>{activity.role}</td>
                          <td>
                            <span style={{ 
                              padding: '0.2rem 0.4rem', 
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: activity.status === 'completed' ? '#dcfce7' : (activity.status === 'in_progress' ? '#fef3c7' : '#fee2e2'),
                              color: activity.status === 'completed' ? '#166534' : (activity.status === 'in_progress' ? '#92400e' : '#991b1b')
                            }}>
                              {activity.status}
                            </span>
                          </td>
                          <td>{new Date(activity.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'dashboard' && !stats && <p>Loading dashboard...</p>}
        {activeTab === 'analytics' && <AnalyticsModule />}
        {activeTab === 'students' && <StudentsModule />}
        {activeTab === 'interviews' && <InterviewsModule />}
        {activeTab === 'reports' && <ReportsModule />}
        {activeTab === 'question-bank' && <QuestionBankModule />}
        {activeTab === 'resume-analytics' && <ResumeAnalyticsModule />}
        {activeTab === 'company-management' && <CompanyManagementModule />}
        {activeTab === 'user-roles' && <UserRoleManagementModule />}
        {activeTab === 'system-monitoring' && <SystemMonitoringModule />}
        {activeTab === 'database-schema' && <DatabaseSchemaModule />}
        {activeTab === 'advanced-analytics' && <AdvancedAnalyticsModule />}
        {activeTab === 'settings' && <SettingsModule />}
      </div>
    </div>
  );
};

export default AdminPortal;

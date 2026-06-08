import styles from "../../styles/resume.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resumeAPI } from "../../utils/api";
import Navbar from "../components/Navbar";

export default function ResumeUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState({ skills_match: "", experience: "", readiness: "" });
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const handleBrowseClick = () => {
    document.getElementById("fileInput")?.click();
  };

  const handleContinue = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    if (resumeUploaded) {
      navigate("/job");
      return;
    }

    setUploading(true);
    setError("");
    setUploadMessage("");

    try {
      const result = await resumeAPI.upload(selectedFile);
      if (result?.resume_id || result?.id) {
        localStorage.setItem("resume_id", String(result?.resume_id || result?.id));
      }

      const analysisData = result?.analysis || {};
      setAnalysis({
        skills_match: analysisData.skills_match || analysisData.impact || "Upload a resume to identify your key skills and job-fit strengths.",
        experience: analysisData.experience || analysisData.motive || "Upload a resume to evaluate your experience and project impact.",
        readiness: analysisData.readiness || analysisData.system || "Upload a resume to assess your interview readiness and improvement areas.",
      });
      setResumeUploaded(true);
      setUploadMessage("Resume uploaded and analyzed. Click continue to proceed to job setup.");
      setUploading(false);
    } catch (err: any) {
      console.error("Upload failed:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Upload failed. Please try again.";
      setError(errorMessage);
      setUploading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Elevate Your Career Narrative</h1>
          <p className={styles.subtitle}>
            Our AI-powered engine analyzes your experience for a personalized interview pitch
            tailored to your specific strengths.
          </p>
        </header>

        {/* Upload Section */}
        <section className={styles.uploadSection}>
          <div className={styles.uploadBox}>
            <p>Drag and drop your resume here (PDF, DOCX, TXT format)</p>
            <input
              type="file"
              id="fileInput"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <button onClick={handleBrowseClick}>Browse Files</button>
            {selectedFile && (
              <p style={{ marginTop: "1rem", color: "#DC2626" }}>
                Selected: {selectedFile.name}
              </p>
            )}
            {error && (
              <p style={{ marginTop: "1rem", color: "#EF4444" }}>
                {error}
              </p>
            )}
          </div>
        </section>

        {/* Modules */}
        <section className={styles.modules}>
          <div className={styles.moduleCard}>
            <h2>EQUITY</h2>
            <p>Enhancing Metadata</p>
          </div>
          <div className={styles.moduleCard}>
            <h2>QUANTITATIVE</h2>
            <p>Mapping Skills</p>
          </div>
          <div className={styles.moduleCard}>
            <h2>DIFFERENCE</h2>
            <p>Structuring Trendline</p>
          </div>
        </section>

        {/* Profile Card */}
        <section className={styles.profileCard}>
          <h3>{localStorage.getItem('token') ? JSON.parse(atob(localStorage.getItem('token')!.split('.')[1])).name || 'User' : 'Guest'}</h3>
          <p>Candidate Profile</p>
          <div className={styles.analysisButtons}>
            <div className={styles.analysisButton}>
              <span className={styles.insightLabel}>🎯 <strong>Skills Match</strong></span>
              <p className={styles.analysisDesc}>Analyze technical skills, tools, programming languages, certifications, and role alignment.</p>
              <div className={styles.analysisContent}>
                <strong>{analysis.skills_match || "Upload a resume to identify your key skills and job-fit strengths."}</strong>
              </div>
            </div>
            <div className={styles.analysisButton}>
              <span className={styles.insightLabel}>📈 <strong>Experience & Projects</strong></span>
              <p className={styles.analysisDesc}>Analyze internships, projects, achievements, leadership, and practical experience.</p>
              <div className={styles.analysisContent}>
                <strong>{analysis.experience || "Upload a resume to evaluate your experience and project impact."}</strong>
              </div>
            </div>
            <div className={styles.analysisButton}>
              <span className={styles.insightLabel}>🚀 <strong>Interview Readiness</strong></span>
              <p className={styles.analysisDesc}>Analyze overall profile strength, resume quality, and interview preparedness.</p>
              <div className={styles.analysisContent}>
                <strong>{analysis.readiness || "Upload a resume to assess your interview readiness and improvement areas."}</strong>
              </div>
            </div>
          </div>
          {uploadMessage && <p className={styles.analysisNote}>{uploadMessage}</p>}
          <div className={styles.actions}>
            <label>
              <input type="checkbox" /> Re-upload
            </label>
            <button
              className={styles.confirm}
              onClick={handleContinue}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : resumeUploaded ? "Continue to Job Setup" : "Upload & Analyze"}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            {/* Brand Section */}
            <div className={styles.footerBrand}>
              <h3>SmartCampus AI</h3>
              <p>Elevate your career with AI-powered interview preparation</p>
              <div className={styles.socialLinks}>
                <a href="#linkedin">LinkedIn</a>
                <a href="#twitter">Twitter</a>
                <a href="#facebook">Facebook</a>
              </div>
            </div>

            {/* Product Links */}
            <div className={styles.footerColumn}>
              <h4>Product</h4>
              <ul>
                <li><a href="#resume">Resume Analyzer</a></li>
                <li><a href="#interview">Interview Prep</a></li>
                <li><a href="#dashboard">Dashboard</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className={styles.footerColumn}>
              <h4>Resources</h4>
              <ul>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#guides">Guides</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#help">Help Center</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className={styles.footerColumn}>
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#press">Press</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div className={styles.footerColumn}>
              <h4>Legal</h4>
              <ul>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#cookies">Cookie Policy</a></li>
                <li><a href="#disclaimer">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className={styles.footerDivider}></div>

          <div className={styles.footerBottom}>
            <p>&copy; 2024 SmartCampus AI. All rights reserved.</p>
            <p>Empowering careers through intelligent technology.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
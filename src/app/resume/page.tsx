import styles from "../../styles/resume.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resumeAPI } from "../../utils/api";
import Navbar from "../components/Navbar";

export default function ResumeUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
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

    setUploading(true);
    setError("");

    try {
      await resumeAPI.upload(selectedFile);
    } catch (err) {
      console.error("Upload failed, but continuing:", err);
      setError("Upload failed, but continuing to next page...");
    } finally {
      setUploading(false);
      // Navigate regardless of upload result for testing
      navigate("/job");
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
              <p style={{ marginTop: "1rem", color: "#3B82F6" }}>
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
          <h3>Alex Chen</h3>
          <p>Computer Science '25 – Stanford University</p>
          <div className={styles.tags}>
            <span>IMPACT</span>
            <span>MOTIVE</span>
            <span>SYSTEM</span>
          </div>
          <div className={styles.actions}>
            <label>
              <input type="checkbox" /> Re-upload
            </label>
            <button
              className={styles.confirm}
              onClick={handleContinue}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Confirm & Continue"}
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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/job.module.css";
import { interviewAPI } from "../../utils/api";

const JOB_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "DevOps Engineer",
  "Product Manager",
  "Mobile Developer",
  "UI/UX Designer",
  "HR Professional",
];

const COMPANIES = [
  "Google",
  "Amazon",
  "Microsoft",
  "Apple",
  "Meta",
  "Tesla",
  "Netflix",
  "Stripe",
  "Airbnb",
];

export default function JobPage() {
  const navigate = useNavigate();
  const [jobRole, setJobRole] = useState("");
  const [company, setCompany] = useState("");
  const [customCompany, setCustomCompany] = useState(false);
  const [customJobRole, setCustomJobRole] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [jobRoleOpen, setJobRoleOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [searchJobRole, setSearchJobRole] = useState("");
  const [searchCompany, setSearchCompany] = useState("");

  const isFormValid = jobRole && company;

  const filteredJobRoles = JOB_ROLES.filter((role) =>
    role.toLowerCase().includes(searchJobRole.toLowerCase())
  );

  const filteredCompanies = COMPANIES.filter((c) =>
    c.toLowerCase().includes(searchCompany.toLowerCase())
  );

  const handleStartInterview = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      const result = await interviewAPI.create(jobRole, company);
      localStorage.setItem("interview_id", result.interview_id);
      localStorage.setItem("job_role", jobRole);
      localStorage.setItem("company", company);
      navigate("/instructions");
    } catch (error: any) {
      console.log("FULL ERROR:", error);
      console.log("ERROR RESPONSE:", error.response);
      console.log("ERROR DATA:", error.response?.data);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || "Interview creation failed";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.jobContainer}>
      <div className={styles.jobCard}>
        {/* Header */}
        <div className={styles.jobCardHeader}>
          <h1 className={styles.jobTitle}>Choose Your Interview Setup</h1>
          <p className={styles.jobHelper}>
            We'll tailor questions based on your selection
          </p>
        </div>

        {/* Form */}
        <div className={styles.jobForm}>
          {/* Job Role Selection */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Job Role</label>
            {!customJobRole ? (
              <div className={`${styles.selectWrapper} ${jobRoleOpen ? styles.active : ''}`}>
                <button
                  className={styles.selectButton}
                  onClick={() => {
                    setJobRoleOpen(!jobRoleOpen);
                    setCompanyOpen(false);
                  }}
                >
                  <span className={styles.selectValue}>
                    {jobRole || "Select a job role"}
                  </span>
                  <svg
                    className={`${styles.selectIcon} ${jobRoleOpen ? styles.selectIconOpen : ""}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M7 8L10 11L13 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {jobRoleOpen && (
                  <div className={styles.dropdown}>
                    <input
                      type="text"
                      placeholder="Search roles..."
                      className={styles.searchInput}
                      value={searchJobRole}
                      onChange={(e) => setSearchJobRole(e.target.value)}
                      autoFocus
                    />
                    <div className={styles.dropdownList}>
                      {filteredJobRoles.map((role) => (
                        <button
                          key={role}
                          className={`${styles.dropdownItem} ${
                            jobRole === role ? styles.dropdownItemActive : ""
                          }`}
                          onClick={() => {
                            setJobRole(role);
                            setJobRoleOpen(false);
                            setSearchJobRole("");
                          }}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                className={styles.textInput}
                placeholder="Enter job role"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
              />
            )}
            <button
              className={styles.toggleCustom}
              onClick={() => {
                setCustomJobRole(!customJobRole);
                setJobRoleOpen(false);
                setSearchJobRole("");
              }}
            >
              {customJobRole ? "Choose from list" : "Enter custom job role"}
            </button>
          </div>

          {/* Company Selection */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Company Name</label>
            {!customCompany ? (
              <div className={`${styles.selectWrapper} ${companyOpen ? styles.active : ''}`}>
                <button
                  className={styles.selectButton}
                  onClick={() => {
                    setCompanyOpen(!companyOpen);
                    setJobRoleOpen(false);
                  }}
                >
                  <span className={styles.selectValue}>
                    {company || "Select a company"}
                  </span>
                  <svg
                    className={`${styles.selectIcon} ${companyOpen ? styles.selectIconOpen : ""}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M7 8L10 11L13 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {companyOpen && (
                  <div className={styles.dropdown}>
                    <input
                      type="text"
                      placeholder="Search companies..."
                      className={styles.searchInput}
                      value={searchCompany}
                      onChange={(e) => setSearchCompany(e.target.value)}
                      autoFocus
                    />
                    <div className={styles.dropdownList}>
                      {filteredCompanies.map((c) => (
                        <button
                          key={c}
                          className={`${styles.dropdownItem} ${
                            company === c ? styles.dropdownItemActive : ""
                          }`}
                          onClick={() => {
                            setCompany(c);
                            setCompanyOpen(false);
                            setSearchCompany("");
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                className={styles.textInput}
                placeholder="Enter company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            )}
            <button
              className={styles.toggleCustom}
              onClick={() => {
                setCustomCompany(!customCompany);
                setCompanyOpen(false);
                setSearchCompany("");
              }}
            >
              {customCompany ? "Choose from list" : "Enter custom company"}
            </button>
          </div>
        </div>

        {/* Button */}
        <button
          className={styles.startButton}
          onClick={handleStartInterview}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <span className={styles.loadingText}>
              <span className={styles.spinner}></span>
              Setting up interview...
            </span>
          ) : (
            "Start Interview"
          )}
        </button>
      </div>
    </div>
  );
}
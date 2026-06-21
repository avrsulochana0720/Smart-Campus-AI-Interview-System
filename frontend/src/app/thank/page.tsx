import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "../../styles/thank.module.css";

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const score = searchParams.get("score") || "0";

  return (
    <div className={styles.container}>
      <div className={styles.background}></div>

      <div className={styles.card}>
        {/* Left side: glowing icon + text */}
        <div className={styles.left}>
          <div className={styles.icon}>
            <span>✔</span>
          </div>
          <h1 className={styles.heading}>Interview Submitted!</h1>
          <p className={styles.subtext}>
            Your responses have been securely uploaded and the AI analysis is now in progress.
          </p>
        </div>

        {/* Right side: details + next steps */}
        <div className={styles.right}>
          <div className={styles.details}>
            <p><span className={styles.label}>Reference ID:</span> SI-9823-TXQ</p>
            <p><span className={styles.label}>Timestamp:</span> Oct 24, 2024 • 14:32</p>
            <p><span className={styles.label}>Position:</span> Senior Frontend Engineer</p>
          </div>

          <div className={styles.next}>
            <h2>What happens next?</h2>
            <p>
              Our recruitment team will review the AI-generated report alongside your video responses.
              You will receive an update via your campus portal within 3–5 business days.
            </p>
          </div>

          <div className={styles.buttons}>
            <button className={styles.primary} onClick={() => navigate(`/dashboard?score=${score}`)}>Go to Dashboard</button>
            <button className={styles.secondary} onClick={async () => {
              try {
                const { supabase } = await import('../../lib/supabase');
                await supabase.auth.signOut();
              } catch(e) {}
              localStorage.removeItem("token");
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminRole");
              localStorage.removeItem("resume_id");
              localStorage.removeItem("interview_id");
              localStorage.removeItem("job_role");
              localStorage.removeItem("interview_mode");
              navigate("/login");
            }}>Logout</button>
          </div>

          <footer className={styles.footer}>
            <p className={styles.secured}>Secured by SmartInterview AI Infrastructure</p>
            <p>Support | Privacy Policy | System Status</p>
            <p> 2024 SmartInterview AI, Kinetic Nexus Systems.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
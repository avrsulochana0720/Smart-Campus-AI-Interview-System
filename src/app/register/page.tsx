import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../utils/api";
import styles from "../../styles/login.module.css";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [otp, setOtp] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.register(name, email, password, photo || undefined);
      if (response.verification_otp) {
        alert(`Your Verification OTP is: ${response.verification_otp} (It is valid for 30 seconds)`);
      }
      setStep(2);
    } catch (err: any) {
      console.error("Register error:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Registration failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await authAPI.verifyEmail(email, otp);
      navigate("/candidate-dashboard"); 
    } catch (err: any) {
      console.error("Verify error:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Verification failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      const response = await authAPI.resendOtp(email);
      if (response.verification_otp) {
        alert(`Your new Verification OTP is: ${response.verification_otp} (It is valid for 30 seconds)`);
      }
    } catch (err: any) {
      console.error("Resend OTP error:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to resend OTP";
      setError(errorMessage);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Register</h1>
        
        {step === 1 && (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={styles.input}
                placeholder="Enter your name"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
                placeholder="Enter your email"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={styles.input}
                placeholder="Enter your password (min 6 characters)"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Profile Photo:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className={styles.input}
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} className={styles.form}>
            <p style={{ color: '#475569', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
              We've sent a 6-digit verification code to <strong>{email}</strong>. 
              <br/>(For this demo, check the backend terminal for the OTP code)
            </p>
            <div className={styles.formGroup}>
              <label className={styles.label}>Verification Code:</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className={styles.input}
                placeholder="Enter 6-digit OTP"
                style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.2rem', fontWeight: 'bold' }}
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                className={styles.button}
                style={{ flex: 1 }}
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <button
                type="button"
                disabled={loading}
                className={styles.button}
                style={{ flex: 1, backgroundColor: '#64748b' }}
                onClick={handleResendOtp}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <p className={styles.registerText}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../utils/api";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import axios from "axios";

import styles from "../../styles/login.module.css";
import { useToast } from "../../admin/ToastContext";

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export default function RegisterPage() {
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | null>(null);
  const [step, setStep] = useState(1);
  
  // Email flow state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  


  const [error, setError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const redirectChecked = useRef(false);

  useEffect(() => {
    // If already authenticated via JWT, skip Supabase bridge to prevent refresh loop
    if (localStorage.getItem('token') || localStorage.getItem('adminToken')) {
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (redirectChecked.current) return;
        redirectChecked.current = true;
        
        // Bridge: exchange Supabase session for backend JWT
        try {
          const res = await axios.post("http://localhost:8000/supabase-login", {
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          });
          if (res.data.access_token) {
            const role = res.data.role || "student";
            if (["admin", "tpo", "super_admin"].includes(role)) {
              localStorage.setItem("adminToken", res.data.access_token);
              localStorage.setItem("adminRole", role);
              navigate("/admin/dashboard");
            } else {
              localStorage.setItem("token", res.data.access_token);
              navigate("/dashboard?tab=Profile");
            }
          }
        } catch (err) {
          console.error("Backend bridge login failed:", err);
          navigate("/dashboard?tab=Profile");
        }
      }
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: "google",
        options: { redirectTo: window.location.origin + "/register" }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google login error details:", err);
      setError(err.message || "Google login failed");
      setLoading(false);
    }
  };



  const handleEmailInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authAPI.registerInitiate(name, email, phone);
      setStep(2);
    } catch (err: any) {
      console.error("Register error:", err);
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'string' && (detail.includes('SMTP') || detail.includes('email'))) {
        setError("Unable to send verification email. Please try again later.");
      } else {
        setError(detail || err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authAPI.verifyEmail(email, otp);
      showToast("Email verified successfully! Please login.", "success");
      navigate("/login");
    } catch (err: any) {
      console.error("Verify error:", err);
      setError(err.response?.data?.detail || err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailResendOtp = async () => {
    setError("");
    try {
      const data = await authAPI.resendOtp(email);
      if (data.email_warning) {
        setEmailWarning(data.email_warning);
        showToast("OTP regenerated. Check backend console.", "info");
      } else {
        setEmailWarning("");
        showToast("OTP resent to your email.", "success");
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'string' && (detail.includes('SMTP') || detail.includes('email'))) {
        setError("Unable to send verification email. Please try again later.");
      } else {
        setError(detail || err.message || "Failed to resend OTP");
      }
    }
  };

  const { showToast } = useToast();
  const handleEmailSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authAPI.setPassword(email, password, photo || undefined);
      showToast("Registration successful.", "success");
      const role = data.role || "student";
      if (["admin", "tpo", "super_admin"].includes(role)) {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard?tab=Profile");
      }
    } catch (err: any) {
      console.error("Set password error:", err);
      setError(err.response?.data?.detail || err.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailWarning("");
    setLoading(true);
    try {
      const data = await authAPI.register(name, email, password);
      if (data.email_warning) {
        setEmailWarning(data.email_warning);
        showToast("Registration successful. " + data.email_warning, "info");
      } else {
        showToast("Registration successful. Please check your email for OTP.", "success");
      }
      if (data.require_otp || !data.access_token) {
        setStep(2);
      } else {
        const role = data.role || "student";
        if (["admin", "tpo", "super_admin"].includes(role)) {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard?tab=Profile");
        }
      }
    } catch (err: any) {
      console.error("Register error:", err);
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'string' && (detail.includes('SMTP') || detail.includes('email'))) {
        setError("Unable to send verification email. Please try again later.");
      } else {
        setError(detail || err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Verify Your Email</h1>
          {emailWarning ? (
            <p style={{ textAlign: 'center', color: '#d97706', backgroundColor: '#fef3c7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              ⚠️ {emailWarning}
            </p>
          ) : (
            <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              We've sent a 6-digit code to <strong>{email}</strong>. Please enter it below.
            </p>
          )}
          {error && <p className={styles.error} style={{ textAlign: 'center' }}>{error}</p>}
          <form onSubmit={handleEmailVerifyOtp} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Verification Code:</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className={styles.input}
                placeholder="123456"
                style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.2rem' }}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.button} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              onClick={handleEmailResendOtp}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Didn't receive code? Resend
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create an Account</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <p className={styles.error} style={{ textAlign: 'center' }}>{error}</p>}
          
          {isSupabaseConfigured && (
            <button 
              className={styles.button} 
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ backgroundColor: '#fff', color: '#000', border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? "Please wait..." : "Sign up with Google"}
            </button>
          )}
        </div>

        {isSupabaseConfigured && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #334155' }} />
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>OR EMAIL</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #334155' }} />
          </div>
        )}

        <form onSubmit={handleEmailRegister} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={styles.input}
              placeholder="Enter your full name"
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
              placeholder="Create a password (min 6 chars)"
            />
          </div>
          <button type="submit" disabled={loading} className={styles.button} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className={styles.registerText} style={{ marginTop: '1.5rem' }}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

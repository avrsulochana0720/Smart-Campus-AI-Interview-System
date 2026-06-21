import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { authAPI } from "../../utils/api";
import axios from "axios";
import styles from "../../styles/login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectChecked = useRef(false);

  // Show a message if the user was redirected here due to an expired session
  const wasExpired = (location.state as any)?.expired;
  const returnTo = (location.state as any)?.from || "/resume";

  useEffect(() => {
    if (!isSupabaseConfigured) return; // Skip Supabase listener if not configured

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
              navigate(returnTo);
            }
          }
        } catch (err) {
          console.error("Backend bridge login failed:", err);
          navigate(returnTo);
        }
      }
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate, returnTo]);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/login" }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google login error details:", err);
      setError(err.message || "Google login failed");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authAPI.login(email, password);
      const role = data.role || "student";
      if (["admin", "tpo", "super_admin"].includes(role)) {
        localStorage.setItem("adminToken", data.access_token);
        localStorage.setItem("adminRole", role);
        navigate("/admin/dashboard");
      } else {
        navigate(returnTo);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Invalid email or password";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Login</h1>
        {wasExpired && <p className={styles.error} style={{ textAlign: 'center', color: '#F59E0B' }}>Your session expired. Please log in again.</p>}
        {error && <p className={styles.error} style={{ textAlign: 'center' }}>{error}</p>}

        {/* Google Login — only shown if Supabase is configured */}
        {isSupabaseConfigured && (
          <>
            <button
              className={styles.button}
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ backgroundColor: '#fff', color: '#000', border: '2px solid #0F172A', width: '100%' }}
            >
              {loading ? "Please wait..." : "Continue with Google"}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #334155' }} />
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>or</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #334155' }} />
            </div>
          </>
        )}

        <form onSubmit={handleLogin} className={styles.form}>
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
              className={styles.input}
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" disabled={loading} className={styles.button} style={{ width: '100%' }}>
            {loading ? "Logging in..." : "Login with Email"}
          </button>
        </form>

        <p className={styles.registerText}>
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}

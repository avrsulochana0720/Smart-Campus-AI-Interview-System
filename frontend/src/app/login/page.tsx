import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  const bridgeFiredRef = useRef(false);

  const wasExpired = (location.state as any)?.expired;
  const returnTo = (location.state as any)?.from || "/dashboard";

  // ── 1. Redirect already-authenticated users away immediately ──────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);
        if (!payload.exp || payload.exp > now) {
          navigate(returnTo, { replace: true });
          return;
        }
      } catch {
        // malformed — fall through to clear it
      }
      localStorage.removeItem("token");
    }

    if (adminToken) {
      try {
        const payload = JSON.parse(atob(adminToken.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);
        if (!payload.exp || payload.exp > now) {
          navigate("/admin/dashboard", { replace: true });
          return;
        }
      } catch {
        // malformed
      }
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRole");
    }
  }, []); // runs only on first mount

  // ── 2. Supabase OAuth bridge — ONLY for Google / OAuth sign-ins ───────────
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) return;

        // Ignore if this is an email/password Supabase user (we use our own backend for that)
        const provider = session.user.app_metadata?.provider;
        const isOAuth = provider && provider !== "email";
        if (!isOAuth) return;

        // Guard against double-firing
        if (bridgeFiredRef.current) return;
        bridgeFiredRef.current = true;

        setLoading(true);
        setError("");

        try {
          const res = await axios.post("http://localhost:8000/supabase-login", {
            email: session.user.email,
            name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "User",
          });

          if (res.data?.access_token) {
            const role = res.data.role || "student";
            if (["admin", "tpo", "super_admin"].includes(role)) {
              localStorage.setItem("adminToken", res.data.access_token);
              localStorage.setItem("adminRole", role);
              navigate("/admin/dashboard", { replace: true });
            } else {
              localStorage.setItem("token", res.data.access_token);
              localStorage.setItem("role", role);
              navigate(returnTo, { replace: true });
            }
          } else {
            throw new Error("No token received from server.");
          }
        } catch (err: any) {
          console.error("OAuth bridge failed:", err);
          setError(
            "Google sign-in failed: " +
              (err.response?.data?.detail ||
                err.message ||
                "Server unreachable. Please try email login.")
          );
          // Sign out of Supabase so the stale session doesn't keep firing
          await supabase.auth.signOut();
          bridgeFiredRef.current = false;
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [navigate, returnTo]);

  // ── 3. Google OAuth button ────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/login" },
      });
      if (oauthErr) throw oauthErr;
      // Loading stays true — page will redirect to Google
    } catch (err: any) {
      setError(err.message || "Google login failed");
      setLoading(false);
    }
  };

  // ── 4. Email / password login (uses our backend directly) ─────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // authAPI.login already stores the token in localStorage
      const data = await authAPI.login(email, password);
      const role = data.role || "student";

      if (["admin", "tpo", "super_admin"].includes(role)) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate(returnTo, { replace: true });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Login</h1>

        {wasExpired && (
          <p
            className={styles.error}
            style={{ textAlign: "center", color: "#F59E0B" }}
          >
            Your session expired. Please log in again.
          </p>
        )}
        {error && (
          <p className={styles.error} style={{ textAlign: "center" }}>
            {error}
          </p>
        )}

        {/* Google Login — only shown when Supabase is configured */}
        {isSupabaseConfigured && (
          <>
            <button
              className={styles.button}
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                backgroundColor: "#fff",
                color: "#000",
                border: "2px solid #0F172A",
                width: "100%",
              }}
            >
              {loading ? "Please wait…" : "Continue with Google"}
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                margin: "1rem 0",
              }}
            >
              <hr
                style={{
                  flex: 1,
                  border: "none",
                  borderTop: "1px solid #334155",
                }}
              />
              <span style={{ color: "#64748b", fontSize: "0.85rem" }}>or</span>
              <hr
                style={{
                  flex: 1,
                  border: "none",
                  borderTop: "1px solid #334155",
                }}
              />
            </div>
          </>
        )}

        {/* Email / password form */}
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
              autoComplete="email"
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
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.button}
            style={{ width: "100%" }}
          >
            {loading ? "Logging in…" : "Login with Email"}
          </button>
        </form>

        <p className={styles.registerText}>
          Don&apos;t have an account?{" "}
          <Link to="/register" style={{ color: "#DC2626" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

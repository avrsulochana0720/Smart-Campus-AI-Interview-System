import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../utils/api";
import styles from "../../styles/login.module.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authAPI.register(name, email, password);
      navigate("/login");
    } catch (err: any) {
      console.error("Register error:", err);
      console.error("Error response:", err.response);
      console.error("Error data:", err.response?.data);
      const errorMessage = err.response?.data?.detail || err.message || "Registration failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Register</h1>
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
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={styles.button}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className={styles.registerText}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "../../styles/Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token") || !!localStorage.getItem("adminToken"));
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch(e) {}
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("resume_id");
    localStorage.removeItem("interview_id");
    localStorage.removeItem("job_role");
    localStorage.removeItem("interview_mode");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-icon">
            <div className="navbar-icon-inner" />
          </div>
          <span className="navbar-title">SmartCampus AI</span>
        </Link>

        {/* Links + Button */}
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/resume">Resume</Link>
          <Link to="/job">Job</Link>
          <Link to="/instructions">Instructions</Link>
          <Link to="/interview">Interview</Link>
          {isLoggedIn && <Link to="/dashboard">Dashboard</Link>}
          
          {isLoggedIn ? (
            <button 
              onClick={handleLogout} 
              style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', padding: '0.5rem' }}
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/resume" style={{ fontWeight: 600 }}>Login</Link>
              <Link to="/register" style={{ fontWeight: 600 }}>Sign Up</Link>
            </>
          )}

          {isHomePage && !isLoggedIn && (
            <Link to="/resume" className="navbar-button">
              <span>Get Started</span>
              <div className="navbar-button-hover" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
import { Link, useLocation } from "react-router-dom";
import "../../styles/Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

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
          <Link to="/dashboard">Dashboard</Link>
          {isHomePage && (
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
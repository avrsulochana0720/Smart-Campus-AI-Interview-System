import { Link } from "react-router-dom";
import "../../styles/Navbar.css";

export default function Navbar() {
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
          <Link to="/placement-head">Placement Head</Link>
          <Link to="/dashboard?section=profile" className="navbar-profile">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
              alt="Profile"
              className="navbar-profile-image"
            />
          </Link>
        </div>
      </div>
    </nav>
  );
}
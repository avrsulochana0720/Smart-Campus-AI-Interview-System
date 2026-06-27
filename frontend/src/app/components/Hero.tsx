import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../utils/api";
import "../../styles/Hero.css";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  profilePhoto: File | null;
}

interface LoginData {
  email: string;
  password: string;
}

export default function Hero() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // left intentionally empty or removed since we use full page now
  };

  return (
    <section className="hero">
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-text">Smart Campus AI</span>
        </div>
        <div className="navbar-links">
          <a href="#" className="nav-link">Home</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#contact" className="nav-link">Contact</a>
        </div>
        <div className="navbar-right">
          <div className="navbar-profile">
            <div className="profile-avatar-nav" onClick={() => navigate('/dashboard?section=profile')} style={{ cursor: 'pointer' }}>
              <svg width="40" height="40" viewBox="0 0 40 40" className="avatar-svg-nav">
                <defs>
                  <linearGradient id="avatarGradientNav" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#DC2626', stopOpacity: 1}} />
                    <stop offset="50%" style={{stopColor: '#EF4444', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#F59E0B', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="18" fill="url(#avatarGradientNav)" />
                <circle cx="20" cy="15" r="6" fill="#ffffff" opacity="0.9" />
                <ellipse cx="20" cy="28" rx="8" ry="5" fill="#ffffff" opacity="0.9" />
              </svg>
            </div>
          </div>
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <a href="#" className="mobile-nav-link">Home</a>
          <a href="#features" className="mobile-nav-link">Features</a>
          <a href="#about" className="mobile-nav-link">About</a>
          <a href="#contact" className="mobile-nav-link">Contact</a>
        </div>
      )}
      <div className="hero-content">
        <h1 className="hero-title">
          AI-Powered Smart Campus Interview Platform
        </h1>
        <p className="hero-subtitle">
          Automating campus recruitment with intelligent interview flow. Scale your talent discovery with ethereal precision and bias-free evaluation.
        </p>
        <div className="hero-buttons">
          <button className="hero-button-primary" onClick={() => navigate('/register')}>
            Register
          </button>
          <button className="hero-button-secondary" onClick={() => navigate('/resume')}>
            Login
          </button>
          <button className="hero-button-primary">Launch Recruitment</button>
          <button className="hero-button-secondary">Watch Demo</button>
        </div>
      </div>

      {/* Modals removed in favor of dedicated pages */}
    </section>
  );
}
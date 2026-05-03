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
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [registerData, setRegisterData] = useState<RegisterData>({ name: '', email: '', password: '', profilePhoto: null });
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authAPI.register(registerData.name, registerData.email, registerData.password);
      setShowRegister(false);
      setRegisterData({ name: '', email: '', password: '', profilePhoto: null });
      setProfilePhotoPreview(null);
      navigate('/login');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Registration failed';
      alert(errorMessage);
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRegisterData({ ...registerData, profilePhoto: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authAPI.login(loginData.email, loginData.password);
      setShowLogin(false);
      setLoginData({ email: '', password: '' });
      navigate('/resume');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Invalid email or password';
      alert(errorMessage);
    }
  };

  return (
    <section className="hero">
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-text">Smart Campus AI</span>
        </div>
        <div className="navbar-links">
          <a href="#" className="nav-link">Home</a>
          <a href="#" className="nav-link">Features</a>
          <a href="#" className="nav-link">About</a>
          <a href="#" className="nav-link">Contact</a>
        </div>
        <div className="navbar-right">
          <div className="navbar-profile">
            <div className="profile-avatar-nav" onClick={() => navigate('/dashboard?section=profile')} style={{ cursor: 'pointer' }}>
              <svg width="40" height="40" viewBox="0 0 40 40" className="avatar-svg-nav">
                <defs>
                  <linearGradient id="avatarGradientNav" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 1}} />
                    <stop offset="50%" style={{stopColor: '#8b5cf6', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#ec4899', stopOpacity: 1}} />
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
          <a href="#" className="mobile-nav-link">Features</a>
          <a href="#" className="mobile-nav-link">About</a>
          <a href="#" className="mobile-nav-link">Contact</a>
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
          <button className="hero-button-primary" onClick={() => setShowRegister(true)}>
            Register
          </button>
          <button className="hero-button-secondary" onClick={() => setShowLogin(true)}>
            Login
          </button>
          <button className="hero-button-primary">Launch Recruitment</button>
          <button className="hero-button-secondary">Watch Demo</button>
        </div>
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div className="auth-modal">
          <div className="auth-modal-content">
            <div className="auth-header">
              <h2>Create Account</h2>
              <button className="auth-close" onClick={() => setShowRegister(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label htmlFor="register-profile-photo">Profile Photo</label>
                <div className="profile-photo-upload">
                  {profilePhotoPreview ? (
                    <div className="profile-photo-preview">
                      <img src={profilePhotoPreview} alt="Profile preview" className="profile-preview-image" />
                      <button 
                        type="button" 
                        className="remove-photo-btn"
                        onClick={() => {
                          setProfilePhotoPreview(null);
                          setRegisterData({ ...registerData, profilePhoto: null });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="profile-photo-placeholder">
                      <div className="upload-icon">📷</div>
                      <span>Click to upload photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="register-profile-photo"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="profile-photo-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="register-name">Full Name</label>
                <input
                  type="text"
                  id="register-name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="register-email">Email</label>
                <input
                  type="email"
                  id="register-email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="register-password">Password</label>
                <input
                  type="password"
                  id="register-password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  placeholder="Enter your password"
                />
              </div>
              <button type="submit" className="auth-submit">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="auth-modal">
          <div className="auth-modal-content">
            <div className="auth-header">
              <h2>Login</h2>
              <button className="auth-close" onClick={() => setShowLogin(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  type="email"
                  id="login-email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  type="password"
                  id="login-password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="auth-submit">
                Login
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
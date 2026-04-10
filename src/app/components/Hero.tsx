import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Hero.css";

interface RegisterData {
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
  const [registerData, setRegisterData] = useState<RegisterData>({ email: '', password: '', profilePhoto: null });
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Register:', registerData);
    alert('Registration successful!');
    setShowRegister(false);
    setRegisterData({ email: '', password: '', profilePhoto: null });
    setProfilePhotoPreview(null);
    navigate('/resume');
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', loginData);
    setShowLogin(false);
    setLoginData({ email: '', password: '' });
    navigate('/resume');
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          AI-Powered Smart Campus Interview Platform
        </h1>
        <p className="hero-subtitle">
          Automating campus recruitment with intelligent interview flow. Scale your talent discovery with etheral precision and bias-free evaluation.
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
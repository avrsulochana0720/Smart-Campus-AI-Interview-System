import "../../styles/Footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-copy">© 2024 SmartCampus AI. All rights reserved.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <span className="footer-divider">|</span>
          <a href="#terms">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
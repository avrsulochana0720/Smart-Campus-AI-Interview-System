import { Twitter, Linkedin, Github, Mail } from "lucide-react";
import "../../styles/FooterNew.css";

export default function FooterNew() {
  return (
    <footer id="contact" className="footer">
      <div className="footer-container">
        {/* Copy */}
        <p className="footer-copy">
          © 2024 SmartCampus AI. All rights reserved.
        </p>

        {/* Social icons */}
        <div className="footer-social">
          <a href="#twitter" className="footer-icon">
            <Twitter size={18} className="footer-icon-svg" />
          </a>
          <a href="#linkedin" className="footer-icon">
            <Linkedin size={18} className="footer-icon-svg" />
          </a>
          <a href="#github" className="footer-icon">
            <Github size={18} className="footer-icon-svg" />
          </a>
          <a href="#email" className="footer-icon">
            <Mail size={18} className="footer-icon-svg" />
          </a>
        </div>
      </div>
    </footer>
  );
}
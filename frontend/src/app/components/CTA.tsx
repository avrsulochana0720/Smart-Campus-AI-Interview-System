import "../../styles/CTA.css";

export default function CTA() {
  return (
    <section id="about" className="cta">
      {/* Background glow effects */}
      <div className="cta-glow cta-glow-blue" />
      <div className="cta-glow cta-glow-violet" />

      {/* CTA content */}
      <div className="cta-content">
        <h2 className="cta-title">
          Ready to evolve your campus strategy?
        </h2>
        <p className="cta-subtitle">
          Join leading institutions transforming their recruitment process with AI-powered intelligence and automation.
        </p>

        <div className="cta-buttons">
          <button className="cta-primary">
            <span>Enter Corporate Email</span>
            <div className="cta-primary-hover" />
          </button>

          <button className="cta-secondary">
            <span>Request Access</span>
            <div className="cta-secondary-hover" />
          </button>
        </div>
      </div>
    </section>
  );
}
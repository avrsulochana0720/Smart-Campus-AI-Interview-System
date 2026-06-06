import "../../styles/Features.css";

export default function Features() {
  const features = [
    {
      title: "Intelligent Proctoring",
      description:
        "Advanced AI surveillance that detects non-verbal cues,environmental anomalies,and unauthorized assistance with 99.9% accuracy.",
    },
    {
      title: "Real-time Evaluation",
      description:
        "Instant scoring based on technical proficiency,cognitive ability,and culture fit indicators.",
    },
    {
      title: "Adaptive Questioning",
      description:
        "Dynamic question sets adjust difficulty based on candidate responses for accurate skill assessment.",
    },
    {
      title: "Seamless Integration",
      description:
        "Effortlessly connect with your existing campus systems and workflows without disruption.",
    },
  ];

  return (
    <section className="features">
      <div className="features-header">
        <h2 className="features-title">Powerful Features</h2>
        <p className="features-subtitle">
          Everything you need to revolutionize your campus recruitment process
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">✔</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
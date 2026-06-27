import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/instructions.module.css";

export default function InstructionsPage() {
  const [systemChecks, setSystemChecks] = useState([false, false, false, false]);
  const [checkedInstructions, setCheckedInstructions] = useState([false, false, false]);
  const [showErrors, setShowErrors] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate system checks one by one
    const checkItems = [
      { name: "Camera initialized", delay: 500 },
      { name: "Microphone detected", delay: 1200 },
      { name: "Stable connection", delay: 1900 },
      { name: "Power connected", delay: 2600 },
    ];

    checkItems.forEach((item, index) => {
      setTimeout(() => {
        setSystemChecks(prev => {
          const updated = [...prev];
          updated[index] = true;
          return updated;
        });
      }, item.delay);
    });
  }, []);

  const handleCheckboxChange = (index: number) => {
    setCheckedInstructions(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const handleNext = () => {
    if (checkedInstructions.every(v => v === true)) {
      navigate("/interview");
    } else {
      setShowErrors(true);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}></div>

      <div className={styles.main}>
        {/* Left Card */}
        <div className={styles.card}>
          <h2 className={styles.title}>Important Instructions</h2>

          <div className={styles.section} style={{ position: 'relative' }}>
            <input 
              type="checkbox" 
              className={styles.instructionCheckbox} 
              checked={checkedInstructions[0]}
              onChange={() => handleCheckboxChange(0)}
            />
            <div className={styles.icon}>1</div>
            <div>
              <p className={styles.itemTitle}>Stable Environment</p>
              <p className={styles.itemDesc}>
                Ensure you are in a quiet, well-lit space with minimal distractions.
              </p>
              {showErrors && !checkedInstructions[0] && (
                <p style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>* Required</p>
              )}
            </div>
          </div>

          <div className={styles.section} style={{ position: 'relative' }}>
            <input 
              type="checkbox" 
              className={styles.instructionCheckbox} 
              checked={checkedInstructions[1]}
              onChange={() => handleCheckboxChange(1)}
            />
            <div className={styles.icon}>2</div>
            <div>
              <p className={styles.itemTitle}>Device Setup</p>
              <p className={styles.itemDesc}>
                Test your camera and microphone before starting the interview.
              </p>
              {showErrors && !checkedInstructions[1] && (
                <p style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>* Required</p>
              )}
            </div>
          </div>

          <div className={styles.section} style={{ position: 'relative' }}>
            <input 
              type="checkbox" 
              className={styles.instructionCheckbox} 
              checked={checkedInstructions[2]}
              onChange={() => handleCheckboxChange(2)}
            />
            <div className={styles.icon}>3</div>
            <div>
              <p className={styles.itemTitle}>Time Management</p>
              <p className={styles.itemDesc}>
                Keep track of allotted time and pace yourself during responses.
              </p>
              {showErrors && !checkedInstructions[2] && (
                <p style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>* Required</p>
              )}
            </div>
          </div>

          <div className={styles.notice}>
            <p>
              Permissions Notice: Please allow access to your camera and microphone for the system
              check and interview process.
            </p>
          </div>
        </div>

        {/* Right Card */}
        <div className={styles.card}>
          <h2 className={styles.title}>System Check</h2>

          <div className={styles.checklist}>
            <label className={styles.checkItem}>
              <span>Camera initialized</span>
              <input type="checkbox" checked={systemChecks[0]} readOnly className={styles.checkbox} />
            </label>
            <label className={styles.checkItem}>
              <span>Microphone detected</span>
              <input type="checkbox" checked={systemChecks[1]} readOnly className={styles.checkbox} />
            </label>
            <label className={styles.checkItem}>
              <span>Stable connection</span>
              <input type="checkbox" checked={systemChecks[2]} readOnly className={styles.checkbox} />
            </label>
            <label className={styles.checkItem}>
              <span>Power connected</span>
              <input type="checkbox" checked={systemChecks[3]} readOnly className={styles.checkbox} />
            </label>
          </div>

          <div className={styles.preview}>
            <img
              src="https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=600&q=80"
              alt="Preview"
            />
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className={styles.footer}>
        <button className={styles.nextButton} onClick={handleNext}>Next</button>
      </div>
    </div>
  );
}
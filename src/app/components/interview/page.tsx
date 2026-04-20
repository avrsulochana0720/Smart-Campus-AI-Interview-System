import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../../styles/interview.module.css";
import { interviewAPI } from "../../../utils/api";

export default function InterviewPage() {
  const [transcript, setTranscript] = useState("");
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const navigate = useNavigate();

  const interviewId = parseInt(localStorage.getItem("interview_id") || "0");

  useEffect(() => {
    if (interviewId) {
      loadFirstQuestion();
    }
  }, [interviewId]);

  const loadFirstQuestion = async () => {
    try {
      setLoading(true);
      const result = await interviewAPI.generateQuestions(interviewId);
      setCurrentQuestionText(result.question);
      setCurrentQuestionId(result.question_id);
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      setTranscript(speechText);
    };

    recognition.start();
  };

  const handleNextQuestion = async () => {
    if (!currentQuestionId || !transcript.trim()) {
      alert("Please provide an answer before proceeding.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await interviewAPI.submitAnswer(interviewId, currentQuestionId, transcript);
      setScore(result.score);
      setFeedback(result.feedback);
      setShowFeedback(true);

      if (result.is_complete) {
        setTimeout(() => {
          navigate("/thank");
        }, 2000);
      } else {
        setTimeout(() => {
          setCurrentQuestionText(result.next_question);
          setCurrentQuestionId(result.question_id);
          setTranscript("");
          setShowFeedback(false);
          setScore(null);
          setFeedback("");
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Failed to submit answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipQuestion = async () => {
    if (!currentQuestionId) return;

    setSubmitting(true);
    try {
      const result = await interviewAPI.submitAnswer(interviewId, currentQuestionId, "Skipped");
      if (result.is_complete) {
        navigate("/thank");
      } else {
        setCurrentQuestionText(result.next_question);
        setCurrentQuestionId(result.question_id);
        setTranscript("");
      }
    } catch (error) {
      console.error("Error skipping question:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Left Panel */}
      <div className={styles.left}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              className={styles.avatar}
            >
              <circle cx="100" cy="100" r="90" fill="#1e293b" />
              <circle cx="100" cy="80" r="35" fill="#fdbcb4" />
              <path d="M 65 60 Q 100 40 135 60 Q 140 70 135 80 L 65 80 Q 60 70 65 60" fill="#4a4a4a" />
              <circle cx="85" cy="75" r="3" fill="#333" />
              <circle cx="115" cy="75" r="3" fill="#333" />
              <path d="M 90 90 Q 100 95 110 90" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 50 120 Q 100 110 150 120 L 140 160 Q 100 150 60 160 Z" fill="#1e40af" />
              <path d="M 80 120 L 100 130 L 120 120" stroke="#fff" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <div className={styles.avatarLabel}>AI Interviewer</div>
        </div>

        <div className={styles.progress}>
          <h3>Interview Progress</h3>
          <p>Answer the question to proceed</p>
          <p>Verified Identity</p>
          <p className={styles.focus}>Focus Score: 98% High</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className={styles.right}>
        {/* Question Box */}
        <div className={styles.questionBox}>
          <div className={styles.questionHeader}>
            <h2>Interview Question</h2>
            <div className={styles.timer}>Session Timer: 24:45</div>
          </div>

          <p>{currentQuestionText}</p>

          {/* 🎤 Voice Input Section */}
          <div className={styles.voiceSection}>
            <button onClick={startListening} className={styles.save} disabled={submitting}>
              🎤 Start Speaking
            </button>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your answer will appear here..."
              className={styles.transcript}
            />
          </div>

          {/* Feedback Section */}
          {showFeedback && score !== null && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(59, 130, 246, 0.1)", borderRadius: "0.5rem" }}>
              <p><strong>Score: {score}/10</strong></p>
              <p>{feedback}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button onClick={handleSkipQuestion} className={styles.skip} disabled={submitting}>Skip Question</button>
          <button onClick={handleNextQuestion} className={styles.next} disabled={submitting}>
            {submitting ? "Submitting..." : "Next Question"}
          </button>
        </div>

        <div className={styles.voice}>
          <span className={styles.voiceDot}></span>
          Voice Mode Ready to listen
        </div>
      </div>
    </div>
  );
}
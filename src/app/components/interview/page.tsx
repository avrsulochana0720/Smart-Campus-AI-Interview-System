import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../../styles/interview.module.css";
import { interviewAPI } from "../../../utils/api";

export default function InterviewPage() {
  const [transcript, setTranscript] = useState("");
  const [questions, setQuestions] = useState<Array<any>>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [interviewPhase, setInterviewPhase] = useState<"hr" | "technical">("hr");
  const navigate = useNavigate();

  const interviewId = parseInt(localStorage.getItem("interview_id") || "0");

  useEffect(() => {
    if (interviewId) {
      loadAllQuestions();
    }
  }, [interviewId]);
  
  // Fetch 5 technical questions then 5 HR questions and combine them
  const loadAllQuestions = async () => {
    try {
      setLoading(true);

      // 1) Technical questions
      const techResp = await interviewAPI.generateQuestions(interviewId, "technical");
      let techQuestions: any[] = [];
      if (Array.isArray(techResp.questions)) techQuestions = techResp.questions;
      else if (techResp.question) techQuestions = [{ id: techResp.question_id, question: techResp.question, question_type: techResp.question_type || 'technical' }];

      // 2) HR questions
      const hrResp = await interviewAPI.generateQuestions(interviewId, "hr");
      let hrQuestions: any[] = [];
      if (Array.isArray(hrResp.questions)) hrQuestions = hrResp.questions;
      else if (hrResp.question) hrQuestions = [{ id: hrResp.question_id, question: hrResp.question, question_type: hrResp.question_type || 'hr' }];

      // Limit to 5 each and combine: Technical first, then HR
      const combined = [...techQuestions.slice(0, 5).map((q: any) => ({ ...q, question_type: (q.question_type || 'technical') })), ...hrQuestions.slice(0, 5).map((q: any) => ({ ...q, question_type: (q.question_type || 'hr') }))];

      if (combined.length === 0) {
        alert('No questions generated for this interview.');
        return;
      }

      setQuestions(combined);
      setCurrentIndex(0);
      setCurrentQuestionText(combined[0].question || '');
      setCurrentQuestionId(combined[0].id || null);
      setInterviewPhase((combined[0].question_type || 'hr') === 'technical' ? 'technical' : 'hr');
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load interview questions. Please try again.');
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
    // ensure questions loaded
    if (questions.length === 0) return;

    if (!transcript.trim()) {
      alert("Please provide an answer before proceeding.");
      return;
    }

    setSubmitting(true);
    try {
      const q = questions[currentIndex];
      const result = await interviewAPI.submitAnswer(interviewId, q.id, transcript);
      setScore(result.score);
      setFeedback(result.feedback);
      setShowFeedback(true);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= questions.length) {
        // finished all questions
        setTimeout(() => navigate('/thank'), 1200);
      } else {
        const nextQ = questions[nextIndex];
        setTimeout(() => {
          setCurrentIndex(nextIndex);
          setCurrentQuestionText(nextQ.question || '');
          setCurrentQuestionId(nextQ.id || null);
          setInterviewPhase((nextQ.question_type || 'hr') === 'technical' ? 'technical' : 'hr');
          setTranscript('');
          setShowFeedback(false);
          setScore(null);
          setFeedback('');
        }, 600);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Previous button behaviour: navigate back locally without submitting
  const handleSkipQuestion = async () => {
    if (questions.length === 0) return;
    if (currentIndex === 0) return;

    const prevIndex = currentIndex - 1;
    const prevQ = questions[prevIndex];
    setCurrentIndex(prevIndex);
    setCurrentQuestionText(prevQ.question || '');
    setCurrentQuestionId(prevQ.id || null);
    setInterviewPhase((prevQ.question_type || 'hr') === 'technical' ? 'technical' : 'hr');
    setTranscript('');
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
            <img
              src={interviewPhase === "technical" ? "/down.jpeg" : "/im.jpeg"}
              alt={interviewPhase === "technical" ? "Technical Interviewer" : "HR Interviewer"}
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid rgba(59, 130, 246, 0.5)"
              }}
            />
          </div>
          <div className={styles.avatarLabel}>
            {interviewPhase === "technical" ? "Technical Interviewer" : "HR Interviewer"}
          </div>
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
          <button onClick={handleSkipQuestion} className={styles.skip} disabled={submitting}>Previous Question</button>
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
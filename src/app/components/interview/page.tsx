import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../../styles/interview.module.css";

const questions = [
  {
    id: 1,
    category: "Technical Architecture",
    question: "Explain the CAP theorem and how you would apply it when choosing a database for a global real-time notification system?"
  },
  {
    id: 2,
    category: "System Design",
    question: "Design a URL shortening service like bit.ly. What would be your database schema, API endpoints, and how would you handle scalability?"
  },
  {
    id: 3,
    category: "Algorithms",
    question: "Given a large dataset of user transactions, how would you detect fraudulent patterns in real-time? Describe your approach and data structures."
  },
  {
    id: 4,
    category: "Cloud Architecture",
    question: "How would you design a microservices architecture for an e-commerce platform? Discuss service communication, data consistency, and deployment strategies."
  },
  {
    id: 5,
    category: "Performance Optimization",
    question: "A web application is experiencing slow load times. Walk me through your systematic approach to identify and resolve the performance bottlenecks."
  }
];

export default function InterviewPage() {
  const [transcript, setTranscript] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const navigate = useNavigate();

  // Calculate score based on answers answered
  const calculateScore = () => {
    const answeredCount = answers.filter(a => a && a.trim().length > 0).length;
    const score = Math.round((answeredCount / questions.length) * 100);
    return score;
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

  const handleNextQuestion = () => {
    // Save current answer
    if (transcript.trim()) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = transcript;
      setAnswers(newAnswers);
    }

    // Clear transcript for next question
    setTranscript("");

    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Interview completed - navigate to thank you page with score
      const score = calculateScore();
      navigate(`/thank?score=${score}`);
    }
  };

  const handleSkipQuestion = () => {
    setTranscript("");
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Interview completed - navigate to thank you page with score
      const score = calculateScore();
      navigate(`/thank?score=${score}`);
    }
  };

  const handleSaveDraft = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = transcript;
    setAnswers(newAnswers);
    alert("Draft saved!");
  };

  const currentQuestion = questions[currentQuestionIndex];

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
              {/* Background circle */}
              <circle cx="100" cy="100" r="90" fill="#1e293b" />
              
              {/* Head */}
              <circle cx="100" cy="80" r="35" fill="#fdbcb4" />
              
              {/* Hair */}
              <path
                d="M 65 60 Q 100 40 135 60 Q 140 70 135 80 L 65 80 Q 60 70 65 60"
                fill="#4a4a4a"
              />
              
              {/* Eyes */}
              <circle cx="85" cy="75" r="3" fill="#333" />
              <circle cx="115" cy="75" r="3" fill="#333" />
              
              {/* Mouth */}
              <path
                d="M 90 90 Q 100 95 110 90"
                stroke="#333"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              
              {/* Body/Shoulders */}
              <path
                d="M 50 120 Q 100 110 150 120 L 140 160 Q 100 150 60 160 Z"
                fill="#1e40af"
              />
              
              {/* Collar */}
              <path
                d="M 80 120 L 100 130 L 120 120"
                stroke="#fff"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
          <div className={styles.avatarLabel}>AI Interviewer</div>
        </div>

        <div className={styles.progress}>
          <h3>Interview Progress</h3>
          <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
          <p>Verified Identity</p>
          <p className={styles.focus}>Focus Score: 98% High</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className={styles.right}>
        {/* Question Box */}
        <div className={styles.questionBox}>
          <div className={styles.questionHeader}>
            <h2>{currentQuestion.category}</h2>
            <div className={styles.timer}>Session Timer: 24:45</div>
          </div>

          <p>
            {currentQuestion.question}
          </p>

          {/* 🎤 Voice Input Section */}
          <div className={styles.voiceSection}>
            <button onClick={startListening} className={styles.save}>
              🎤 Start Speaking
            </button>

            <textarea
              value={transcript}
              readOnly
              placeholder="Your answer will appear here..."
              className={styles.transcript}
            />
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button onClick={handleSkipQuestion} className={styles.skip}>Skip Question</button>
          <button onClick={handleSaveDraft} className={styles.save}>Save Draft</button>
          <button onClick={handleNextQuestion} className={styles.next}>Next Question</button>
        </div>

        <div className={styles.voice}>
          <span className={styles.voiceDot}></span>
          Voice Mode Ready to listen
        </div>
      </div>
    </div>
  );
}
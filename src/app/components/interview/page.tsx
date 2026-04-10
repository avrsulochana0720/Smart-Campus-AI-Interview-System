import { useState, useEffect, useRef } from "react";
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
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleCamera = async (on: boolean) => {
    setCameraOn(on);
    
    if (on) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Unable to access camera. Please ensure camera permissions are granted.");
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
      // Interview completed
      alert("Interview completed! Thank you for your responses.");
    }
  };

  const handleSkipQuestion = () => {
    setTranscript("");
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      alert("Interview completed! Thank you for your responses.");
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
            <img
              src="/Professional HR avat.png"
              alt="AI Interviewer"
              className={styles.avatarImage}
            />
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

          {/* Camera Section */}
          <div className={styles.cameraSection}>
            <div className={styles.cameraIcon}>📷</div>
            <div className={styles.cameraStatus}>{cameraOn ? "Camera Active" : "Camera Off"}</div>
            <div className={styles.cameraButtons}>
              <button
                onClick={() => toggleCamera(true)}
                className={`${styles.cameraButton} ${styles.cameraButtonOn} ${cameraOn ? styles.cameraButtonActive : ""}`}
              >
                On
              </button>
              <button
                onClick={() => toggleCamera(false)}
                className={`${styles.cameraButton} ${styles.cameraButtonOff} ${!cameraOn ? styles.cameraButtonActive : ""}`}
              >
                Off
              </button>
            </div>
          </div>

          {/* Camera Video Feed */}
          {cameraOn && (
            <div className={styles.cameraVideoContainer}>
              <video
                ref={videoRef}
                className={styles.cameraVideo}
                autoPlay
                playsInline
                muted
              />
            </div>
          )}

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
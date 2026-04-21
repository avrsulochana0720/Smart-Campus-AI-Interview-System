import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/interview.module.css';
import thankStyles from '../../styles/thank.module.css';
import { interviewAPI } from '../../utils/api';

const Interview: React.FC = () => {
  const navigate = useNavigate();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [answer, setAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(24 * 60 + 45); // 24:45 in seconds
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]); // Array of {id, question}
  const [isLoading, setIsLoading] = useState(true);
  const [interviewId, setInterviewId] = useState<number | null>(null);

  useEffect(() => {
    const storedInterviewId = localStorage.getItem('interview_id');
    if (storedInterviewId) {
      const id = parseInt(storedInterviewId);
      setInterviewId(id);
      loadInterviewData(id);
    }
  }, []);

  const loadInterviewData = async (id: number) => {
    try {
      setIsLoading(true);
      // 1. Generate/Get questions
      const genData = await interviewAPI.generateQuestions(id);
      const questionList = genData.questions || [];
      setQuestions(questionList);
      setAnswers(new Array(questionList.length).fill(''));

      // 2. Get current unanswered question to set initial index
      const questionData = await interviewAPI.getQuestion(id);
      if (questionData.is_complete || questionData.message === 'All questions answered') {
        setIsCompleted(true);
      } else {
        // Find the index of the question we got from the server
        const index = questionList.findIndex((q: any) => q.id === questionData.question_id);
        if (index !== -1) {
          setCurrentQuestionIndex(index);
        } else if (questionData.order_index !== undefined) {
          setCurrentQuestionIndex(questionData.order_index);
        }
      }
    } catch (error) {
      console.error('Error loading interview data:', error);
      alert('Failed to load interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || !interviewId || !answer.trim()) return;

    try {
      const result = await interviewAPI.submitAnswer(interviewId, currentQ.id, answer);
      
      // Update answers array
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = answer;
      setAnswers(newAnswers);

      if (result.is_complete || currentQuestionIndex === questions.length - 1) {
        setIsCompleted(true);
      } else {
        // Move to next
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setAnswer(answers[nextIndex] || '');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [stream, setStream] = useState<MediaStream | null>(null);

  const toggleCamera = async () => {
    try {
      if (!cameraEnabled) {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(newStream);
        setCameraEnabled(true);
      } else {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        setCameraEnabled(false);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  useEffect(() => {
    if (cameraEnabled && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraEnabled, stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }
    } else {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
          if (finalTranscript) {
            setAnswer(prev => prev + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      } else {
        alert('Speech recognition is not supported in your browser.');
      }
    }
  };

  const handleNextQuestion = async () => {
    if (answer.trim()) {
      await submitAnswer();
    } else {
      // Just skip to next if possible
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setAnswer(answers[nextIndex] || '');
      } else {
        setIsCompleted(true);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setAnswer(answers[prevIndex] || '');
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswer(value);
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
  };

  const currentQText = questions[currentQuestionIndex]?.question;

  return (
    <div className={styles.interviewContainer}>
      {isCompleted ? (
        // Thank You Card
        <div className={thankStyles.container}>
          <div className={thankStyles.background}></div>

          <div className={thankStyles.card}>
            {/* Left side: glowing icon + text */}
            <div className={thankStyles.left}>
              <div className={thankStyles.icon}>
                <span>✔</span>
              </div>
              <h1 className={thankStyles.heading}>Interview Submitted!</h1>
              <p className={thankStyles.subtext}>
                Your responses have been securely uploaded and the AI analysis is now in progress.
              </p>
            </div>

            {/* Right side: details + next steps */}
            <div className={thankStyles.right}>
              <div className={thankStyles.details}>
                <p><span className={thankStyles.label}>Reference ID:</span> SI-9823-TXQ</p>
                <p><span className={thankStyles.label}>Timestamp:</span> Oct 24, 2024 • 14:32</p>
                <p><span className={thankStyles.label}>Position:</span> Senior Frontend Engineer</p>
              </div>

              <div className={thankStyles.next}>
                <h2>What happens next?</h2>
                <p>
                  Our recruitment team will review the AI-generated report alongside your video responses.
                  You will receive an update via your campus portal within 3–5 business days.
                </p>
              </div>

              <div className={thankStyles.buttons}>
                <button className={thankStyles.primary} onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
                <button className={thankStyles.secondary}>Logout</button>
              </div>

              <footer className={thankStyles.footer}>
                <p className={thankStyles.secured}>Secured by SmartInterview AI Infrastructure</p>
                <p>Support | Privacy Policy | System Status</p>
                <p>© 2024 SmartInterview AI, Kinetic Nexus Systems.</p>
              </footer>
            </div>
          </div>
        </div>
      ) : (
        // Main Content
        <div className={styles.mainContent}>
          {/* Left Side */}
          <div className={styles.leftPanel}>
            <div className={styles.interviewerCard}>
              {/* Circular Interviewer Image */}
              <div className={styles.flexColCenter}>
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face"
                  alt="AI Interviewer"
                  className={styles.interviewerImage}
                />
                {/* Label with gradient background */}
                <div className={styles.interviewerLabel}>
                  <span>AI Interviewer</span>
                </div>
              </div>
            </div>

            {/* Interview Progress Section */}
            <div className={styles.progressCard}>
              <h3 className={styles.progressTitle}>Interview Progress</h3>
              <div className={styles.spaceY3}>
                <div className={styles.progressItem}>
                  <span>Question</span>
                  <span className={styles.progressValue}>
                    {questions.length > 0 ? `${currentQuestionIndex + 1} / ${questions.length}` : '...'}
                  </span>
                </div>
                <div className={styles.progressItem}>
                  <span>Verified Identity</span>
                  <span className={styles.progressValue}>✓</span>
                </div>
                <div className={styles.progressItem}>
                  <span>Focus Score</span>
                  <span className={`${styles.progressValue} ${styles.green}`}>98% High</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className={styles.rightPanel}>
            <div className={styles.techCard}>
              {/* Card Header */}
              <div className={styles.techCardHeader}>
                <h2 className={styles.techTitle}>Technical Architecture</h2>
                {/* Purple gradient badge */}
                <div className={styles.timerBadge}>
                  <span>Session Timer: {formatTime(timeRemaining)}</span>
                </div>
              </div>

              {/* Camera Section */}
              <div className={styles.cameraSection}>
                {/* Left side: Camera icon + text */}
                <div className={styles.cameraLeft}>
                  <svg className={styles.cameraIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className={styles.cameraStatus}>{cameraEnabled ? 'Camera On' : 'Camera Off'}</span>
                </div>

                {/* Right side: ON/OFF buttons */}
                <div className={styles.cameraButtons}>
                  <button
                    onClick={() => { if (!cameraEnabled) toggleCamera(); }}
                    disabled={cameraEnabled}
                    className={`${styles.cameraButton} ${styles.on}`}
                  >
                    On
                  </button>
                  <button
                    onClick={() => { if (cameraEnabled) toggleCamera(); }}
                    disabled={!cameraEnabled}
                    className={`${styles.cameraButton} ${styles.off}`}
                  >
                    Off
                  </button>
                </div>
              </div>

              {/* Camera Preview - Only shown when ON */}
              {cameraEnabled && (
                <div className={styles.mt4}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={styles.cameraPreview}
                  />
                </div>
              )}

              {/* Question Text */}
              <p className={styles.questionText}>
                {currentQText || (isLoading ? 'Loading question...' : 'No question available')}
              </p>

              {/* Voice Recorder */}
              <div className={styles.voiceRecorder}>
                <button
                  onClick={toggleRecording}
                  className={isRecording ? styles.recordingButton : styles.micButton}
                >
                  {isRecording ? (
                    <>
                      <span className={styles.recordingIndicator}></span>
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <svg className={styles.micIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Start Speaking
                    </>
                  )}
                </button>
              </div>

              {/* Textarea */}
              <textarea
                value={answer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Your answer will appear here..."
                className={styles.answerTextarea}
              />

              {/* Bottom Buttons */}
              <div className={styles.bottomButtons}>
                <button 
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`${styles.bottomButton} ${styles.skipButton}`}
                >
                  Previous
                </button>
                <button className={`${styles.bottomButton} ${styles.saveDraftButton}`}>
                  Save Draft
                </button>
                <button 
                  onClick={handleNextQuestion}
                  className={`${styles.bottomButton} ${styles.nextQuestionButton}`}
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next Question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interview;

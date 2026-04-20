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
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [interviewId, setInterviewId] = useState<number | null>(null);

  useEffect(() => {
    const storedInterviewId = localStorage.getItem('interview_id');
    if (storedInterviewId) {
      setInterviewId(parseInt(storedInterviewId));
      generateQuestions(parseInt(storedInterviewId));
    }
  }, []);

  const generateQuestions = async (id: number) => {
    try {
      console.log('Generating questions for interview:', id);
      await interviewAPI.generateQuestions(id);
      fetchNextQuestion(id);
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions. Please try again.');
    }
  };

  const fetchNextQuestion = async (id: number) => {
    try {
      console.log('Fetching next question for interview:', id);
      const questionData = await interviewAPI.getQuestion(id);
      if (questionData.message === 'All questions answered') {
        setIsCompleted(true);
      } else {
        setCurrentQuestion(questionData);
        setAnswer('');
        setAnswers(prev => [...prev, '']);
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      alert('Failed to fetch question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !interviewId || !answer.trim()) return;

    try {
      console.log('Submitting answer for question:', currentQuestion.question_id);
      const result = await interviewAPI.submitAnswer(interviewId, currentQuestion.question_id, answer);
      console.log('Answer submitted:', result);
      
      if (result.next_question) {
        setCurrentQuestion(result.next_question);
        setAnswer('');
        setCurrentQuestionIndex(prev => prev + 1);
        setAnswers(prev => [...prev, '']);
      } else if (result.is_complete) {
        setIsCompleted(true);
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

  const toggleCamera = async () => {
    try {
      if (!cameraEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
      } else {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        setCameraEnabled(false);
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

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
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          setAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[currentQuestionIndex] = newAnswers[currentQuestionIndex] + finalTranscript;
            return newAnswers;
          });
          setAnswer(answers[currentQuestionIndex] + finalTranscript);
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
      if (currentQuestion) {
        await fetchNextQuestion(interviewId!);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setAnswer(answers[currentQuestionIndex - 1]);
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswer(value);
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = value;
      return newAnswers;
    });
  };

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
                  <span className={styles.progressValue}>{currentQuestionIndex + 1}</span>
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
                  <span className={styles.cameraStatus}>Camera Off</span>
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
                    className={styles.cameraPreview}
                  />
                </div>
              )}

              {/* Question Text */}
              <p className={styles.questionText}>
                {currentQuestion?.question || (isLoading ? 'Loading question...' : 'No question available')}
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

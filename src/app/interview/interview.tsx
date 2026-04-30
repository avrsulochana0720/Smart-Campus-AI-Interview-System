import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, Clock, User } from 'lucide-react';
import styles from '../../styles/interview.module.css';
import thankStyles from '../../styles/thank.module.css';
import { interviewAPI } from '../../utils/api';

const Interview: React.FC = () => {
  const navigate = useNavigate();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [answer, setAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(24 * 60 + 45);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interviewId, setInterviewId] = useState<number | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<'hr' | 'technical' | null>(null);

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

      // Dynamically update the NEXT question if provided by AI
      if (result.next_question && result.question_id && currentQuestionIndex < questions.length - 1) {
        const newQuestions = [...questions];
        const nextIndex = currentQuestionIndex + 1;
        // Update the next question record in our local state
        newQuestions[nextIndex] = {
          ...newQuestions[nextIndex],
          id: result.question_id,
          question: result.next_question
        };
        setQuestions(newQuestions);
      }

      if (result.is_complete || currentQuestionIndex === questions.length - 1) {
        setIsCompleted(true);
      } else {
        // Move to next
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setAnswer(newAnswers[nextIndex] || '');
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
    <div className={styles.container}>
      {isCompleted ? (
        <div className={thankStyles.container}>
          <div className={thankStyles.background}></div>
          <div className={thankStyles.card}>
            <div className={thankStyles.left}>
              <div className={thankStyles.icon}>
                <span>✔</span>
              </div>
              <h1 className={thankStyles.heading}>Interview Submitted!</h1>
              <p className={thankStyles.subtext}>
                Your responses have been securely uploaded and the AI analysis is now in progress.
              </p>
            </div>
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
        <div className={styles.layout}>
          {/* COLUMN 1 - Candidate Profile + Progress */}
          <div className={styles.column1}>
            {/* Candidate Profile Card */}
            <div className={styles.profileCard}>
              <div className={styles.avatar}>
                <User />
              </div>
              <span className={styles.candidateName}>John Doe</span>
              <span className={styles.candidateRole}>Frontend Developer</span>
              <button className={styles.aiInterviewerButton}>
                AI Interviewer
              </button>
            </div>

            {/* Interview Progress Card */}
            <div className={styles.progressCard}>
              <h3 className={styles.progressTitle}>Interview Progress</h3>
              <div className={styles.progressItem}>
                <span className={styles.progressLabel}>HR Round</span>
                <span className={`${styles.progressBadge} ${styles.progressBadgeActive}`}>Active</span>
              </div>
              <div className={styles.progressItem}>
                <span className={styles.progressLabel}>Technical Round</span>
                <span className={`${styles.progressBadge} ${styles.progressBadgePending}`}>Pending</span>
              </div>
              <div className={styles.progressItem}>
                <span className={styles.progressLabel}>Focus Score</span>
                <span className={`${styles.progressBadge} ${styles.progressBadgeHigh}`}>92% High</span>
              </div>
              <div className={styles.progressItem}>
                <span className={styles.progressLabel}>Question</span>
                <span className={styles.progressBadge}>
                  {questions.length > 0 ? `${currentQuestionIndex + 1} / ${questions.length}` : '...'}
                </span>
              </div>
            </div>

            {/* Interview Tips Card */}
            <div className={styles.tipsCard}>
              <h3 className={styles.tipsTitle}>Interview Tips</h3>
              <p className={styles.tipItem}>Speak clearly and confidently</p>
              <p className={styles.tipItem}>Maintain eye contact with camera</p>
              <p className={styles.tipItem}>Take time to think before answering</p>
              <p className={styles.tipItem}>Be honest about your experience</p>
              <p className={styles.tipItem}>Show enthusiasm for the role</p>
            </div>
          </div>

          {/* COLUMN 2 - Interviewers Stacked */}
          <div className={styles.column2}>
            {/* HR Interviewer */}
            <div className={styles.interviewerCard}>
              <div className={`${styles.interviewerAvatar} ${styles.hrAvatar} ${activeSpeaker === 'hr' ? styles.activeSpeaker : styles.inactiveSpeaker}`}>
                <User />
              </div>
              <span className={styles.interviewerLabel}>HR Interviewer</span>
            </div>

            {/* Technical Interviewer */}
            <div className={styles.interviewerCard}>
              <div className={`${styles.interviewerAvatar} ${styles.technicalAvatar} ${activeSpeaker === 'technical' ? styles.activeSpeaker : styles.inactiveSpeaker}`}>
                <User />
              </div>
              <span className={styles.interviewerLabel}>Technical Interviewer</span>
            </div>
          </div>

          {/* COLUMN 3 - Question, Controls, Answer, Buttons */}
          <div className={styles.column3}>
            {/* Question Card */}
            <div className={styles.questionCard}>
              <span className={styles.questionLabel}>Question</span>
              <p className={styles.questionText}>
                {currentQText || (isLoading ? 'Loading question...' : 'No question available')}
              </p>
            </div>

            {/* Controls Card */}
            <div className={styles.controlsCard}>
              <div className={styles.controls}>
                {/* Camera Toggle */}
                <button
                  onClick={toggleCamera}
                  className={`${styles.controlButton} ${cameraEnabled ? styles.controlButtonCameraOn : styles.controlButtonInactive}`}
                >
                  {cameraEnabled ? <Video /> : <VideoOff />}
                  <span>{cameraEnabled ? 'Camera On' : 'Camera Off'}</span>
                </button>

                {/* Timer */}
                <div className={styles.timer}>
                  <Clock />
                  <span className={styles.timerText}>{formatTime(timeRemaining)}</span>
                </div>

                {/* Microphone Toggle */}
                <button
                  onClick={toggleRecording}
                  className={`${styles.controlButton} ${isRecording ? styles.controlButtonRecording : styles.controlButtonInactive}`}
                >
                  {isRecording ? <MicOff /> : <Mic />}
                  <span>{isRecording ? 'Recording...' : 'Start Speaking'}</span>
                </button>
              </div>

              {/* Camera Preview */}
              {cameraEnabled && (
                <div className={styles.cameraPreview}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                  />
                </div>
              )}
            </div>

            {/* Answer Card */}
            <div className={styles.answerCard}>
              <span className={styles.answerLabel}>Your Answer</span>
              <textarea
                value={answer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Your answer will appear here..."
                className={styles.textarea}
              />
            </div>

            {/* Buttons Card */}
            <div className={styles.buttonsCard}>
              <div className={styles.bottomButtons}>
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`${styles.button} ${styles.buttonPrevious}`}
                >
                  Previous
                </button>
                <button className={`${styles.button} ${styles.buttonSave}`}>
                  Save Draft
                </button>
                <button
                  onClick={handleNextQuestion}
                  className={`${styles.button} ${styles.buttonNext}`}
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

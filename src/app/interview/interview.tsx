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
  const [activeSpeaker, setActiveSpeaker] = useState<'hr' | 'technical' | null>('hr');
  const [interviewPhase, setInterviewPhase] = useState<'hr' | 'technical'>('hr');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [performanceScore, setPerformanceScore] = useState('0');
  const [scores, setScores] = useState<number[]>([]);
  const [candidateInfo, setCandidateInfo] = useState({ name: 'Candidate', role: 'Applicant', profile_image: null as string | null });
  const [interviewDetails, setInterviewDetails] = useState({ job_role: '', company: '', created_at: '' });

  useEffect(() => {
    const storedInterviewId = localStorage.getItem('interview_id');
    if (storedInterviewId) {
      const id = parseInt(storedInterviewId);
      setInterviewId(id);
      loadInterviewData(id);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCandidateInfo({
          name: payload.name || payload.sub?.split('@')[0] || 'Candidate',
          role: localStorage.getItem('job_role') || 'Applicant',
          profile_image: payload.profile_image || null
        });
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
  }, []);

  // Real-time Dual Interviewer Voice + Highlight Synchronization
  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex]?.question;
    if (!currentQuestion || isLoading || isCompleted) return;

    const qType = (questions[currentQuestionIndex].type || questions[currentQuestionIndex].question_type || '').toLowerCase();
    const speakerToActivate = (qType === 'hr' || qType === 'behavioral') ? 'hr' : 'technical';
    
    const speak = () => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(currentQuestion);
      
      // Find a professional-sounding voice
      const voices = window.speechSynthesis.getVoices();
      
      // Different voices for HR vs Technical for better AI feel
      const preferredVoice = speakerToActivate === 'hr' 
        ? voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Microsoft Zira'))
        : voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Microsoft David'));
      
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setActiveSpeaker(speakerToActivate);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    // Voice synchronization
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }

    return () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [currentQuestionIndex, questions, isLoading, isCompleted]);

  const loadInterviewData = async (id: number) => {
    try {
      setIsLoading(true);
      setActiveSpeaker('hr');
      
      // Get interview report/details first
      const report = await interviewAPI.getReport(id);
      setInterviewDetails({
        job_role: report.job_role,
        company: report.company,
        created_at: report.created_at
      });

      // 1. Generate/Get HR questions
      const genData = await interviewAPI.generateQuestions(id, 'hr');
      const questionList = genData.questions || [];
      
      // 2. Check if we already have technical questions too
      const currentStatus = await interviewAPI.getQuestion(id);
      
      setQuestions(questionList);
      setAnswers(new Array(questionList.length).fill(''));

      if (currentStatus.is_complete) {
        setIsCompleted(true);
      } else {
        const index = questionList.findIndex((q: any) => q.id === (currentStatus.question_id || currentStatus.id));
        if (index !== -1) {
          setCurrentQuestionIndex(index);
          updateSpeaker(questionList[index]);
        }
      }
    } catch (error) {
      console.error('Error loading interview data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSpeaker = (question: any) => {
    if (!question) return;
    const qType = (question.type || question.question_type || '').toLowerCase();
    if (qType === 'behavioral' || qType === 'hr') {
      setActiveSpeaker('hr');
      setInterviewPhase('hr');
    } else {
      setActiveSpeaker('technical');
      setInterviewPhase('technical');
    }
  };

  const submitAnswer = async () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || !interviewId) return;

    // Fast skip if answer is empty
    if (!answer.trim()) {
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setAnswer(answers[nextIndex] || '');
        updateSpeaker(questions[nextIndex]);
      } else if (interviewPhase === 'hr') {
        // Force transition if last HR question skipped
        setIsLoading(true);
        setActiveSpeaker('technical');
        setInterviewPhase('technical');
        try {
          const techData = await interviewAPI.generateQuestions(interviewId, 'technical');
          const newQuestions = [...questions, ...techData.questions];
          setQuestions(newQuestions);
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          setAnswer('');
          updateSpeaker(newQuestions[nextIndex]);
        } catch (err) {
          setIsCompleted(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsCompleted(true);
      }
      return;
    }

    try {
      const result = await interviewAPI.submitAnswer(interviewId, currentQ.id, answer);
      
      // Update answers array
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = answer;
      setAnswers(newAnswers);

      // Update performance score
      if (result.score !== undefined) {
        const newScores = [...scores, result.score];
        setScores(newScores);
        const avg = newScores.reduce((a, b) => a + b, 0) / newScores.length;
        setPerformanceScore((avg * 10).toFixed(0)); // Convert to percentage
      }

      if (currentQuestionIndex === questions.length - 1) {
        // End of current questions list
        if (interviewPhase === 'hr') {
          // Transition to Technical
          setIsLoading(true);
          setActiveSpeaker('technical');
          setInterviewPhase('technical');
          
          try {
            const techData = await interviewAPI.generateQuestions(interviewId, 'technical');
            const newQuestions = [...questions, ...techData.questions];
            setQuestions(newQuestions);
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            setAnswer('');
            updateSpeaker(newQuestions[nextIndex]);
          } catch (err) {
            console.error("Failed to generate technical questions", err);
            setIsCompleted(true);
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsCompleted(true);
        }
      } else {
        // Move to next
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setAnswer(newAnswers[nextIndex] || '');
        updateSpeaker(questions[nextIndex]);
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

  const [interimAnswer, setInterimAnswer] = useState('');

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
        setInterimAnswer('');
      }
    } else {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + ' ';
            } else {
              interim += transcript;
            }
          }

          if (final) {
            setAnswer(prev => {
              const base = prev.endsWith(' ') ? prev : prev + (prev ? ' ' : '');
              const newVal = base + final;
              // Sync with answers array
              const newAnswers = [...answers];
              newAnswers[currentQuestionIndex] = newVal;
              setAnswers(newAnswers);
              return newVal;
            });
            setInterimAnswer('');
          } else {
            setInterimAnswer(interim);
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

  const handleNextQuestion = () => {
    // Move to next question "fastly" as requested
    submitAnswer();
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
                <p><span className={thankStyles.label}>Reference ID:</span> SI-{interviewId || '0000'}-AI</p>
                <p><span className={thankStyles.label}>Timestamp:</span> {interviewDetails.created_at ? new Date(interviewDetails.created_at).toLocaleString() : new Date().toLocaleString()}</p>
                <p><span className={thankStyles.label}>Position:</span> {interviewDetails.job_role} at {interviewDetails.company}</p>
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
                {candidateInfo.profile_image ? (
                  <img src={candidateInfo.profile_image} alt={candidateInfo.name} className={styles.avatarImage} />
                ) : (
                  <User />
                )}
              </div>
              <span className={styles.candidateName}>{candidateInfo.name}</span>
              <span className={styles.candidateRole}>{candidateInfo.role}</span>
              <button className={styles.aiInterviewerButton}>
                Interviewee
              </button>
            </div>

            {/* Interview Progress Card */}
            <div className={styles.progressCard}>
              <h3 className={styles.progressTitle}>Interview Progress</h3>
              <div className={styles.progressItem}>
                <span className={styles.progressLabel}>HR Round</span>
                <span className={`${styles.progressBadge} ${interviewPhase === 'hr' ? styles.progressBadgeActive : styles.progressBadgeCompleted}`}>
                  {interviewPhase === 'hr' ? 'Active' : 'Completed'}
                </span>
              </div>
              <div className={styles.progressItem}>
                <span className={styles.progressLabel}>Technical Round</span>
                <span className={`${styles.progressBadge} ${interviewPhase === 'technical' ? styles.progressBadgeActive : styles.progressBadgePending}`}>
                  {interviewPhase === 'technical' ? 'Active' : 'Pending'}
                </span>
              </div>
              <div className={styles.progressItem}>
                <span className={styles.progressLabel}>Performance</span>
                <span className={`${styles.progressBadge} ${parseFloat(performanceScore) > 80 ? styles.progressBadgeHigh : styles.progressBadgeMedium}`}>
                  {performanceScore}% {parseFloat(performanceScore) > 80 ? 'High' : 'Stable'}
                </span>
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
            {/* Technical Interviewer */}
            <div className={styles.interviewerCard}>
              <div className={`
                ${styles.interviewerAvatar} 
                ${styles.technicalAvatar} 
                ${activeSpeaker === 'technical' ? styles.activeSpeaker : styles.inactiveSpeaker}
                ${activeSpeaker === 'technical' && isSpeaking ? styles.speakingEffect : ''}
              `}>
                <img 
                  src="/down.jpeg" 
                  alt="Technical Interviewer" 
                  className={styles.interviewerImage} 
                />
                {activeSpeaker === 'technical' && isSpeaking && (
                  <>
                    <div className={styles.pulseRing} />
                    <div className={styles.speakingIndicator} />
                  </>
                )}
              </div>
              <span className={styles.interviewerLabel}>Technical Interviewer</span>
            </div>

            {/* HR Interviewer */}
            <div className={styles.interviewerCard}>
              <div className={`
                ${styles.interviewerAvatar} 
                ${styles.hrAvatar} 
                ${activeSpeaker === 'hr' ? styles.activeSpeaker : styles.inactiveSpeaker}
                ${activeSpeaker === 'hr' && isSpeaking ? styles.speakingEffect : ''}
              `}>
                <img 
                  src="/im.jpeg" 
                  alt="HR Interviewer" 
                  className={styles.interviewerImage} 
                />
                {activeSpeaker === 'hr' && isSpeaking && (
                  <>
                    <div className={styles.pulseRing} />
                    <div className={styles.speakingIndicator} />
                  </>
                )}
              </div>
              <span className={styles.interviewerLabel}>HR Interviewer</span>
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
                value={answer + (interimAnswer ? (answer && !answer.endsWith(' ') ? ' ' : '') + interimAnswer : '')}
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
                  {currentQuestionIndex === questions.length - 1 && interviewPhase === 'technical' ? 'Complete' : 'Next Question'}
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

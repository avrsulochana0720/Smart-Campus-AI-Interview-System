import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import styles from '../../styles/interview.module.css';
import thankStyles from '../../styles/thank.module.css';
import { interviewAPI } from '../../utils/api';

const isPlaceholderQuestion = (qText: string) => {
  if (!qText) return false;
  return qText.includes("AI is personalizing") || qText.includes("Loading question");
};

const isErrorQuestion = (qText: string) => {
  if (!qText) return false;
  return qText.startsWith("ERROR:");
};

const Interview: React.FC = () => {
  const navigate = useNavigate();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [answer, setAnswer] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const answerRef = useRef('');
  const hasSpokenRef = useRef(-1);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interviewId, setInterviewId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isCompleted && interviewId) {
      // Trigger report generation in background
      interviewAPI.generateReport(interviewId).catch(err => console.error("Report generation failed", err));
    }
  }, [isCompleted, interviewId]);

  useEffect(() => {
    const unsubscribe = interviewAPI.onQuestionUpdate?.((techData, hrData) => {
      if (techData && hrData) {
        const combinedQuestions = [
          ...(techData.questions || []),
          ...(hrData.questions || [])
        ].sort((a: any, b: any) => a.order_index - b.order_index);
        setQuestions(combinedQuestions);
      } else {
        setQuestions(prev => [...prev]);
      }
    });
    return unsubscribe;
  }, []);
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
      // Auto-start camera for real interview feel
      startCamera();
    }
  }, []);

  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(newStream);
      setCameraEnabled(true);
    } catch (error) {
      console.error('Camera error:', error);
      // Log as a proctoring issue if camera fails to start in a real interview
      if (interviewId) {
        interviewAPI.logProctoringEvent(interviewId, 'camera_off', {
          error: 'Camera access denied or failed on startup'
        });
      }
    }
  };

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

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
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
        
        if (finalTranscript) {
          setAnswer(prev => {
            const newVal = prev + finalTranscript;
            answerRef.current = newVal;
            return newVal;
          });
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // Handle various error cases and continue listening
        if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'not-allowed') {
          // Try to restart after a delay for continuous listening
          setTimeout(() => {
            if (isRecording) {
              try {
                recognition.start();
              } catch (e) {
                console.log('Failed to restart recognition:', e);
              }
            }
          }, 1000);
        }
      };
      
      recognition.onend = () => {
        // Always restart if we're still in recording mode
        if (isRecording) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log('Failed to restart recognition on end:', e);
            }
          }, 100);
        }
      };
      
      recognitionRef.current = recognition;
    }
  }, [isRecording]);

  // Real-time Dual Interviewer Voice + Highlight Synchronization
  const currentQuestionText = questions[currentQuestionIndex]?.question;
  
  useEffect(() => {
    if (!currentQuestionText || isLoading || isCompleted || isPlaceholderQuestion(currentQuestionText) || isErrorQuestion(currentQuestionText)) return;
    
    // Check if we already spoke this question to prevent continuous repeating bugs
    if (hasSpokenRef.current === currentQuestionIndex) return;
    hasSpokenRef.current = currentQuestionIndex;

    const qType = (questions[currentQuestionIndex]?.type || questions[currentQuestionIndex]?.question_type || '').toLowerCase();
    const speakerToActivate = (qType === 'hr' || qType === 'behavioral') ? 'hr' : 'technical';
    
    const speak = () => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(currentQuestionText);
      
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
  }, [currentQuestionIndex, currentQuestionText, isLoading, isCompleted]);

  const loadInterviewData = async (id: number) => {
    try {
      setIsLoading(true);
      setActiveSpeaker('technical');
      setInterviewPhase('technical');

      // Use localStorage for details since report doesn't exist yet
      setInterviewDetails({
        job_role: localStorage.getItem('job_role') || 'Applicant',
        company: localStorage.getItem('company') || 'Company',
        created_at: new Date().toISOString()
      });

      // 1. Generate/Get Technical questions first
      const techData = await interviewAPI.generateQuestions(id, 'technical');
      const techQuestions = techData.questions || [];

      // 2. Generate/Get HR questions too
      const hrData = await interviewAPI.generateQuestions(id, 'hr');
      const hrQuestions = hrData.questions || [];

      // Combine them: 5 technical followed by 5 HR
      const combinedQuestions = [
        ...techQuestions.slice(0, 5).map((q: any) => ({ ...q, type: q.type || q.question_type || 'technical' })),
        ...hrQuestions.slice(0, 5).map((q: any) => ({ ...q, type: q.type || q.question_type || 'hr' }))
      ];

      // Check where candidate is in the interview
      const currentStatus = await interviewAPI.getQuestion(id);

      setQuestions(combinedQuestions);
      setAnswers(new Array(combinedQuestions.length).fill(''));

      if (currentStatus.is_complete) {
        setIsCompleted(true);
      } else {
        const index = combinedQuestions.findIndex((q: any) => q.id === (currentStatus.question_id || currentStatus.id));
        if (index !== -1) {
          setCurrentQuestionIndex(index);
          updateSpeaker(combinedQuestions[index]);
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

    const currentAnswer = answerRef.current;

    // Fast skip if answer is empty
    if (!currentAnswer.trim()) {
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setAnswer('');
        answerRef.current = '';
        updateSpeaker(questions[nextIndex]);
      } else {
        // We are at the end of the current questions list
        setIsCompleted(true);
      }
      return;
    }

    try {
      setIsSubmitting(true);
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
        setPerformanceScore((avg * 10).toFixed(0));
      }

      if (currentQuestionIndex === questions.length - 1) {
        // HR phase complete - interview done
        setIsCompleted(true);
      } else {
        // Move to next question
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setAnswer('');
        answerRef.current = '';
        updateSpeaker(questions[nextIndex]);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer logic removed per user request

  const [stream, setStream] = useState<MediaStream | null>(null);

  const toggleCamera = async () => {
    try {
      if (!cameraEnabled) {
        await startCamera();
      } else {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        setCameraEnabled(false);
        
        // Log violation for turning off camera during interview
        if (interviewId && !isCompleted) {
          interviewAPI.logProctoringEvent(interviewId, 'camera_off', {
            timestamp: new Date().toISOString(),
            action: 'User manually disabled camera'
          });
        }
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

  // Proctoring Listeners
  useEffect(() => {
    if (!interviewId || isCompleted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        interviewAPI.logProctoringEvent(interviewId, 'tab_switch', {
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      }
    };

    const handleBlur = () => {
      interviewAPI.logProctoringEvent(interviewId, 'window_change', {
        timestamp: new Date().toISOString()
      });
    };

    const handleResize = () => {
      interviewAPI.logProctoringEvent(interviewId, 'browser_resize', {
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    const handleCopy = (e: ClipboardEvent) => {
      interviewAPI.logProctoringEvent(interviewId, 'copy_paste', {
        action: 'copy'
      });
    };

    const handlePaste = (e: ClipboardEvent) => {
      interviewAPI.logProctoringEvent(interviewId, 'copy_paste', {
        action: 'paste'
      });
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      interviewAPI.logProctoringEvent(interviewId, 'screenshot_attempt', {
        action: 'Right-click context menu attempt'
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [interviewId, isCompleted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const [interimAnswer, setInterimAnswer] = useState('');

  const toggleRecording = async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
        setInterimAnswer('');
      }
    } else {
      // Request microphone access (works with both built-in and Bluetooth microphones)
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        console.error('Microphone access error:', error);
        alert('Could not access microphone. Please check permissions.');
        return;
      }

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
              answerRef.current = newVal;
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
          // Continue listening even on errors for robust voice capture
          if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'not-allowed') {
            setTimeout(() => {
              if (recognitionRef.current && isRecording) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.log('Failed to restart recognition:', e);
                }
              }
            }, 1000);
          }
        };

        recognition.onend = () => {
          // Always restart for continuous listening
          if (isRecording && recognitionRef.current) {
            setTimeout(() => {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Failed to restart recognition on end:', e);
              }
            }, 100);
          }
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
    answerRef.current = value;
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
  };

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
                  {performanceScore}%
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
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.6; }
                }
              `}</style>
              <span className={styles.questionLabel}>Question</span>
              <p className={styles.questionText} style={isErrorQuestion(questions[currentQuestionIndex]?.question) ? { color: '#dc3545' } : undefined}>
                {questions[currentQuestionIndex]?.question || (isLoading ? 'Loading question...' : 'No question available')}
              </p>
              {questions[currentQuestionIndex] && isErrorQuestion(questions[currentQuestionIndex].question) && (
                <div style={{ marginTop: '15px' }}>
                  <button 
                    onClick={() => {
                       if (interviewId) {
                         interviewAPI.retryQuestion(interviewId, questions[currentQuestionIndex].id);
                         const updated = [...questions];
                         updated[currentQuestionIndex].question = "AI is personalizing your question. Please wait... [Retrying]";
                         setQuestions(updated);
                       }
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    Retry Generation
                  </button>
                </div>
              )}
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
                  disabled={currentQuestionIndex === 0 || isSubmitting}
                  className={`${styles.button} ${styles.buttonPrevious}`}
                >
                  Previous
                </button>
                <button 
                  disabled={isSubmitting}
                  className={`${styles.button} ${styles.buttonSave}`}
                >
                  Save Draft
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={isSubmitting || (currentQuestionIndex < questions.length - 1 && isPlaceholderQuestion(questions[currentQuestionIndex + 1]?.question))}
                  className={`${styles.button} ${styles.buttonNext}`}
                >
                  {isSubmitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '50%',
                        borderTopColor: '#ffffff',
                        animation: 'spin 1s linear infinite'
                      }} />
                      AI Evaluating...
                    </span>
                  ) : currentQuestionIndex < questions.length - 1 && isPlaceholderQuestion(questions[currentQuestionIndex + 1]?.question) ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '50%',
                        borderTopColor: '#ffffff',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Generating Next...
                    </span>
                  ) : (
                    currentQuestionIndex === questions.length - 1 && interviewPhase === 'technical' ? 'Complete' : 'Next Question'
                  )}
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

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
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [finalReport, setFinalReport] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const isRecordingRef = useRef(false);
  const currentQuestionIndexRef = useRef(0);

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Keep answerRef always in sync with answer state
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  const startSpeechRecognition = () => {
    if (isRecordingRef.current) return;
    
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
            
            setAnswers(prevAnswers => {
              const newAnswers = [...prevAnswers];
              newAnswers[currentQuestionIndexRef.current] = newVal;
              return newAnswers;
            });
            return newVal;
          });
          setInterimAnswer('');
        } else {
          setInterimAnswer(interim);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
        }
        if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'not-allowed') {
          setTimeout(() => {
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                // Silently ignore InvalidStateError
              }
            }
          }, 1000);
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current && recognitionRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Silently ignore InvalidStateError
            }
          }, 100);
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsRecording(true);
        isRecordingRef.current = true;
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  const stopSpeechRecognition = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
    }
    setInterimAnswer('');
  };

  useEffect(() => {
    if (isCompleted && interviewId) {
      setIsGeneratingReport(true);
      // Trigger report generation synchronously
      interviewAPI.generateReport(interviewId)
        .then(() => {
          const pollReport = async () => {
            try {
              const reportData = await interviewAPI.fetchSavedReport(interviewId);
              if (reportData && reportData.status === 'completed') {
                setFinalReport(reportData);
                setIsGeneratingReport(false);
              } else if (reportData && reportData.status === 'failed') {
                console.error("Report generation failed");
                setIsGeneratingReport(false);
              } else {
                // Keep polling every 3 seconds if pending
                setTimeout(pollReport, 3000);
              }
            } catch (err) {
              console.error("Error polling report:", err);
              setTimeout(pollReport, 3000);
            }
          };
          pollReport();
        })
        .catch(err => {
          console.error("Report generation failed", err);
          setIsGeneratingReport(false);
        });
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
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
            mode: localStorage.getItem('interview_mode') || 'Practice',
            profile_image: payload.profile_image || null
          });
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
  }, []);

  // Real-time Dual Interviewer Voice + Highlight Synchronization
  const currentQuestionText = questions[currentQuestionIndex]?.question;
  
  useEffect(() => {
    if (!currentQuestionText || isLoading || isCompleted || isPlaceholderQuestion(currentQuestionText) || isErrorQuestion(currentQuestionText)) {
      stopSpeechRecognition();
      return;
    }
    
    // Check if we already spoke this question to prevent continuous repeating bugs
    if (hasSpokenRef.current === currentQuestionIndex) return;
    hasSpokenRef.current = currentQuestionIndex;

    const qType = (questions[currentQuestionIndex]?.type || questions[currentQuestionIndex]?.question_type || '').toLowerCase();
    const speakerToActivate = (qType === 'hr' || qType === 'behavioral') ? 'hr' : 'technical';
    
    const speak = () => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      stopSpeechRecognition();

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
        stopSpeechRecognition();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        startSpeechRecognition();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        startSpeechRecognition();
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
      stopSpeechRecognition();
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

      // Session Recovery
      const recoveredAnswers = new Array(combinedQuestions.length).fill('');
      const recoveredScores: number[] = [];
      
      combinedQuestions.forEach((q, idx) => {
        if (q.answer_text) {
          recoveredAnswers[idx] = q.answer_text;
        }
        if (q.score !== null && q.score !== undefined) {
          recoveredScores.push(q.score);
        }
      });

      setQuestions(combinedQuestions);
      setAnswers(recoveredAnswers);
      setScores(recoveredScores);
      
      if (recoveredScores.length > 0) {
        const avg = recoveredScores.reduce((a, b) => a + b, 0) / recoveredScores.length;
        setPerformanceScore((avg * 10).toFixed(0));
      }

      if (currentStatus.is_complete) {
        setIsCompleted(true);
      } else {
        const index = combinedQuestions.findIndex((q: any) => q.id === (currentStatus.question_id || currentStatus.id));
        if (index !== -1) {
          setCurrentQuestionIndex(index);
          // Sync answer + answerRef with the recovered answer for this question
          const recoveredAnswer = recoveredAnswers[index] || '';
          setAnswer(recoveredAnswer);
          answerRef.current = recoveredAnswer;
          updateSpeaker(combinedQuestions[index]);
        } else {
          // Resuming at question 0 — sync its recovered answer too
          const recoveredAnswer = recoveredAnswers[0] || '';
          setAnswer(recoveredAnswer);
          answerRef.current = recoveredAnswer;
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

    const finalAnswer = currentAnswer.trim() || "No answer provided";

    try {
      setIsSubmitting(true);
      stopSpeechRecognition();
      const result = await interviewAPI.submitAnswer(interviewId, currentQ.id, finalAnswer);

      // Update answers array
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = finalAnswer;
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
      stopSpeechRecognition();
    } else {
      // Request microphone access (works with both built-in and Bluetooth microphones)
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        console.error('Microphone access error:', error);
        alert('Could not access microphone. Please check permissions.');
        return;
      }
      startSpeechRecognition();
    }
  };

  const handleNextQuestion = () => {
    // Move to next question "fastly" as requested
    submitAnswer();
  };

  const handleSaveDraft = async () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || !interviewId) return;
    const currentAnswer = answerRef.current;
    if (!currentAnswer.trim()) return;
    try {
      setIsSavingDraft(true);
      await interviewAPI.saveDraft(interviewId, currentQ.id, currentAnswer.trim());
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      const prevAnswer = answers[prevIndex] || '';
      setAnswer(prevAnswer);
      answerRef.current = prevAnswer;
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
            {isGeneratingReport ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#1E293B', marginBottom: '1rem' }}>Analyzing Interview...</h2>
                <p style={{ color: '#64748B' }}>Please wait while our AI engine grades your responses and generates your final report.</p>
                <div style={{ marginTop: '2rem', display: 'inline-block', width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              </div>
            ) : (
              <>
                <div className={thankStyles.left}>
                  <div className={thankStyles.icon} style={{ background: '#059669', color: '#fff', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '1.5rem' }}>
                    <span>✔</span>
                  </div>
                  <h1 className={thankStyles.heading}>Interview Complete</h1>
                  <p className={thankStyles.subtext}>
                    Your responses have been successfully analyzed by AI. The final results are logged.
                  </p>
                </div>
                <div className={thankStyles.right}>
                   {finalReport?.email_delivery_status === 'failed' && (
                     <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #EF4444', borderRadius: '0.5rem', color: '#991B1B', fontSize: '0.8rem', fontWeight: 500, marginBottom: '1rem', lineHeight: '1.4' }}>
                       ❌ Error: Report email delivery failed ({finalReport?.email_delivery_error || 'Unknown SMTP error'}).
                     </div>
                   )}
                   {finalReport?.email_delivery_status === 'sent' && (
                     <div style={{ padding: '0.75rem 1rem', background: '#F0FDF4', border: '1px solid #10B981', borderRadius: '0.5rem', color: '#15803D', fontSize: '0.8rem', fontWeight: 500, marginBottom: '1rem', lineHeight: '1.4' }}>
                       ✅ A copy of this report has been sent to your email.
                     </div>
                   )}
                   <div className={thankStyles.details} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}><span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Candidate</span><span style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>{candidateInfo.name}</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}><span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Company</span><span style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>{finalReport?.company || interviewDetails.company}</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}><span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Role</span><span style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>{finalReport?.job_role || interviewDetails.job_role}</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}><span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Duration</span><span style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>{Math.round((new Date().getTime() - new Date(interviewDetails.created_at).getTime()) / 60000) || 30} mins</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}><span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Questions Answered</span><span style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>{finalReport?.answered_questions || questions.length}</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}><span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Completion Time</span><span style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>{finalReport?.generated_at ? new Date(finalReport.generated_at).toLocaleTimeString() : new Date().toLocaleTimeString()}</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', gridColumn: '1 / -1', background: '#fff', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Overall Score</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{finalReport?.hiring_readiness_score || finalReport?.final_interview_score || finalReport?.average_score || performanceScore}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', gridColumn: '1 / -1', background: '#fff', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Recommendation</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>{finalReport?.recommendation || 'Analysis Complete'}</span>
                    </div>
                  </div>
                  <div className={thankStyles.buttons} style={{ marginTop: '2rem' }}>
                    <button className={thankStyles.primary} onClick={() => navigate("/dashboard")} style={{ width: '100%' }}>Return to Dashboard</button>
                  </div>
                </div>
              </>
            )}
          </div>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
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
              <button className={styles.aiInterviewerButton} style={{ background: candidateInfo.mode === 'Real' ? '#059669' : '#DC2626' }}>
                {candidateInfo.mode === 'Real' ? 'Real Interview' : 'Practice Test'}
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
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || isSavingDraft}
                  className={`${styles.button} ${styles.buttonSave}`}
                >
                  {isSavingDraft ? 'Saving...' : 'Save Draft'}
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

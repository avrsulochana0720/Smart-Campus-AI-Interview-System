import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Question {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  content: string;
  isFollowUp?: boolean;
}

interface TestCase {
  input: string;
  expected: string;
}

const InterviewPlatform: React.FC = () => {
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes in seconds
  const [selectedLanguage, setSelectedLanguage] = useState('JavaScript');
  const [code, setCode] = useState(`function solution() {
  // Write your code here
}`);
  const [activeTab, setActiveTab] = useState<'testcases' | 'output' | 'expected'>('testcases');
  const [focusMode, setFocusMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(true); // AI starts speaking
  
  // AI Feedback metrics
  const [aiMetrics, setAiMetrics] = useState({
    confidence: 75,
    communication: 82,
    technical: 68,
    problemSolving: 70,
    clarity: 85
  });

  // No camera refs needed

  // Sample data - Realistic AI Interview Questions
  const questions: Question[] = [
    {
      id: 1,
      title: "React Component Optimization",
      difficulty: "Medium",
      tags: ["React", "Performance", "JavaScript"],
      content: "Hello! I'm Alex, your AI interviewer today. Let's start with a practical React question.\n\nImagine you're working on a large React application that's experiencing performance issues. Your task is to optimize a component that renders a list of 10,000 items.\n\nRequirements:\n1. Implement virtual scrolling to only render visible items\n2. Add memoization to prevent unnecessary re-renders\n3. Optimize state management for the large dataset\n4. Add loading states and error handling\n\nPlease explain your approach and write the optimized component code. Take your time to think through the solution.",
      isFollowUp: false
    },
    {
      id: 2,
      title: "System Design - Real-time Chat",
      difficulty: "Hard",
      tags: ["System Design", "WebSockets", "Scalability"],
      content: "Great! Now let's move to a system design challenge.\n\nDesign a real-time chat application similar to Slack or Discord that can handle:\n\n• 1 million concurrent users\n• Real-time message delivery with <100ms latency\n• Message persistence and history\n• File sharing capabilities\n• Online presence indicators\n• Push notifications\n\nPlease explain:\n1. Your overall architecture\n2. Database choices and schema\n3. Scaling strategy\n4. How you'll handle real-time communication\n5. Security considerations\n\nStart with the high-level architecture and then dive into specific components.",
      isFollowUp: true
    }
  ];

  const testCases: TestCase[] = [
    { input: "nums = [2,7,11,15], target = 9", expected: "[0,1]" },
    { input: "nums = [3,2,4], target = 6", expected: "[1,2]" },
    { input: "nums = [3,3], target = 6", expected: "[0,1]" }
  ];

  const currentQuestion = questions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // AI speaking simulation
  useEffect(() => {
    const speakingInterval = setInterval(() => {
      setAiSpeaking(prev => !prev);
    }, 3000 + Math.random() * 2000); // Random speaking patterns

    return () => clearInterval(speakingInterval);
  }, []);

  // Simulate AI analysis
  useEffect(() => {
    const interval = setInterval(() => {
      setAiMetrics(prev => ({
        confidence: Math.min(100, Math.max(0, prev.confidence + (Math.random() - 0.5) * 5)),
        communication: Math.min(100, Math.max(0, prev.communication + (Math.random() - 0.5) * 3)),
        technical: Math.min(100, Math.max(0, prev.technical + (Math.random() - 0.5) * 4)),
        problemSolving: Math.min(100, Math.max(0, prev.problemSolving + (Math.random() - 0.5) * 3)),
        clarity: Math.min(100, Math.max(0, prev.clarity + (Math.random() - 0.5) * 2))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleRunCode = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setActiveTab('output');
      showToastMessage('Code executed successfully!');
    }, 2000);
  };

  const handleSubmit = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      showToastMessage('Solution submitted successfully!');
    }, 2000);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCode(`function solution() {
  // Write your code here
}`);
    }
  };

  const handleEndInterview = () => {
    showToastMessage('Interview ended successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Frontend Developer - React
                </h1>
                <p className="text-sm text-gray-400">Google Inc.</p>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">AI Interview in Progress</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Progress</p>
                <p className="font-semibold">Question {currentQuestionIndex + 1}/{questions.length}</p>
              </div>
              <div className={`text-center ${timeRemaining < 300 ? 'text-red-400' : ''}`}>
                <p className="text-sm text-gray-400">Time Remaining</p>
                <p className={`font-bold text-lg ${timeRemaining < 300 ? 'animate-pulse' : ''}`}>
                  {formatTime(timeRemaining)}
                </p>
              </div>
              <button
                onClick={() => setFocusMode(!focusMode)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                {focusMode ? 'Exit Focus' : 'Focus Mode'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-screen pt-20 pb-20">
        {/* Left Panel - Question (35%) */}
        <div className="w-[35%] border-r border-white/10 bg-slate-900/40 backdrop-blur-sm">
          {/* AI Avatar - Left Side */}
          <div className="p-6 pb-0">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <div className="relative">
                {/* 3D Avatar Container - Enhanced */}
                <div className={`relative ${aiSpeaking ? 'animate-pulse' : ''}`}>
                  <svg width="140" height="140" viewBox="0 0 140 140" className="drop-shadow-2xl">
                    <defs>
                      {/* Enhanced background gradient */}
                      <radialGradient id="bgRadial" cx="50%" cy="40%" r="70%">
                        <stop offset="0%" style={{stopColor: '#6366F1', stopOpacity: 0.4}} />
                        <stop offset="50%" style={{stopColor: '#4F46E5', stopOpacity: 0.3}} />
                        <stop offset="100%" style={{stopColor: '#1E293B', stopOpacity: 1}} />
                      </radialGradient>
                      
                      {/* Enhanced face gradient */}
                      <radialGradient id="faceRadial" cx="50%" cy="40%" r="50%">
                        <stop offset="0%" style={{stopColor: '#FEF3C7', stopOpacity: 1}} />
                        <stop offset="50%" style={{stopColor: '#FDE68A', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#F59E0B', stopOpacity: 1}} />
                      </radialGradient>
                      
                      {/* Enhanced hair gradient */}
                      <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#111827', stopOpacity: 1}} />
                        <stop offset="50%" style={{stopColor: '#1F2937', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#374151', stopOpacity: 1}} />
                      </linearGradient>
                      
                      {/* Enhanced suit gradient */}
                      <linearGradient id="suitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#1E3A8A', stopOpacity: 1}} />
                        <stop offset="30%" style={{stopColor: '#1E40AF', stopOpacity: 1}} />
                        <stop offset="70%" style={{stopColor: '#3730A3', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#312E81', stopOpacity: 1}} />
                      </linearGradient>
                      
                      {/* Tie gradient */}
                      <linearGradient id="tieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#DC2626', stopOpacity: 1}} />
                        <stop offset="50%" style={{stopColor: '#EF4444', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#B91C1C', stopOpacity: 1}} />
                      </linearGradient>
                      
                      {/* Enhanced shadow filter */}
                      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                        <feOffset dx="0" dy="6" result="offsetblur"/>
                        <feFlood floodColor="#000000" floodOpacity="0.4"/>
                        <feComposite in2="offsetblur" operator="in"/>
                        <feMerge>
                          <feMergeNode/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      
                      {/* Glow effect */}
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* Enhanced background circle */}
                    <circle cx="70" cy="70" r="65" fill="url(#bgRadial)" />
                    
                    {/* Subtle glow effect */}
                    <circle cx="70" cy="70" r="63" fill="none" stroke="url(#bgRadial)" strokeWidth="1" opacity="0.5" />
                    
                    {/* Enhanced head/face */}
                    <ellipse cx="70" cy="55" rx="26" ry="30" fill="url(#faceRadial)" filter="url(#shadow)" />
                    
                    {/* Enhanced professional hair */}
                    <path d="M 42 38 Q 70 18 98 38 Q 102 46 98 54 L 42 54 Q 38 46 42 38" fill="url(#hairGradient)" />
                    
                    {/* Hair details - more realistic */}
                    <path d="M 45 40 Q 70 25 95 40" stroke="#111827" strokeWidth="1" fill="none" opacity="0.5" />
                    <path d="M 48 42 Q 70 30 92 42" stroke="#111827" strokeWidth="1" fill="none" opacity="0.3" />
                    
                    {/* Enhanced sideburns */}
                    <path d="M 42 50 L 40 62 L 45 62 Z" fill="url(#hairGradient)" />
                    <path d="M 98 50 L 100 62 L 95 62 Z" fill="url(#hairGradient)" />
                    
                    {/* Enhanced eyes - more realistic */}
                    <ellipse cx="58" cy="52" rx="4" ry="5" fill="#1F2937" />
                    <ellipse cx="82" cy="52" rx="4" ry="5" fill="#1F2937" />
                    
                    {/* Eye details - pupils and reflections */}
                    <circle cx="59" cy="51" r="1.5" fill="#FFFFFF" opacity="0.9" />
                    <circle cx="83" cy="51" r="1.5" fill="#FFFFFF" opacity="0.9" />
                    <circle cx="58" cy="53" r="0.8" fill="#1F2937" />
                    <circle cx="82" cy="53" r="0.8" fill="#1F2937" />
                    
                    {/* Enhanced eyebrows */}
                    <path d="M 52 46 Q 58 43 64 46" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M 76 46 Q 82 43 88 46" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    
                    {/* Enhanced nose */}
                    <path d="M 70 55 L 67 61 L 70 62 L 73 61 Z" fill="#F97316" opacity="0.4" />
                    <path d="M 68 58 L 70 59 L 72 58" stroke="#EA580C" strokeWidth="1" fill="none" opacity="0.5" />
                    
                    {/* Enhanced mouth - more expressive */}
                    <path 
                      d={aiSpeaking ? "M 58 65 Q 70 71 82 65" : "M 58 65 Q 70 67 82 65"} 
                      stroke="#1F2937" 
                      strokeWidth="2.5" 
                      fill="none" 
                      strokeLinecap="round"
                    />
                    
                    {/* Teeth detail when speaking */}
                    {aiSpeaking && (
                      <rect x="65" y="66" width="10" height="3" rx="1" fill="#FFFFFF" opacity="0.8" />
                    )}
                    
                    {/* Enhanced professional suit */}
                    <path d="M 35 80 Q 70 70 105 80 L 100 120 Q 70 112 40 120 Z" fill="url(#suitGradient)" filter="url(#shadow)" />
                    
                    {/* Suit details - lapels */}
                    <path d="M 50 80 L 70 90 L 90 80" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.8" />
                    <path d="M 45 85 L 70 95 L 95 85" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.4" />
                    
                    {/* Enhanced tie */}
                    <path d="M 67 80 L 70 105 L 73 80 L 71.5 88 L 70 95 L 68.5 88 Z" fill="url(#tieGradient)" filter="url(#shadow)" />
                    
                    {/* Tie knot detail */}
                    <ellipse cx="70" cy="82" rx="4" ry="3" fill="url(#tieGradient)" />
                    
                    {/* Enhanced collar */}
                    <path d="M 55 80 L 70 88 L 85 80" stroke="#FFFFFF" strokeWidth="4" fill="none" filter="url(#shadow)" />
                    
                    {/* Shoulder details - more realistic */}
                    <path d="M 35 85 Q 42 80 50 85" stroke="#3B82F6" strokeWidth="2" fill="none" opacity="0.6" />
                    <path d="M 90 85 Q 98 80 105 85" stroke="#3B82F6" strokeWidth="2" fill="none" opacity="0.6" />
                    
                    {/* Shoulder pads detail */}
                    <ellipse cx="45" cy="88" rx="8" ry="4" fill="#1E40AF" opacity="0.3" />
                    <ellipse cx="95" cy="88" rx="8" ry="4" fill="#1E40AF" opacity="0.3" />
                  </svg>
                  
                  {/* Speaking indicator */}
                  {aiSpeaking && (
                    <div className="absolute -top-2 -right-2">
                      <div className="relative">
                        <div className="w-6 h-6 bg-blue-500 rounded-full animate-ping"></div>
                        <div className="absolute top-0 left-0 w-6 h-6 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Status indicators */}
                <div className="absolute -bottom-2 -right-2 flex space-x-1">
                  <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full border-2 border-slate-800"></div>
                </div>
              </div>
              
              {/* Interviewer info */}
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-white">Alex Chen</p>
                <p className="text-xs text-gray-400">Senior AI Interviewer</p>
                <div className="mt-2 flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">
                    {aiSpeaking ? 'Speaking...' : 'Listening...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 h-full overflow-y-auto">
                        
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2">{currentQuestion.title}</h2>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(currentQuestion.difficulty)}`}>
                      {currentQuestion.difficulty}
                    </span>
                    {currentQuestion.isFollowUp && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        AI Follow-up Question
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {currentQuestion.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                      {currentQuestion.content}
                    </pre>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel - Code Editor (65%) */}
        <div className="w-[65%] bg-slate-900/40 backdrop-blur-sm relative">
          
          
          {/* Code Editor */}
          <div className="h-full flex flex-col">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
              <div className="flex items-center space-x-4">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>JavaScript</option>
                  <option>Python</option>
                  <option>Java</option>
                  <option>C++</option>
                </select>
                <div className="flex space-x-2">
                  <button
                    onClick={handleRunCode}
                    disabled={isAnalyzing}
                    className="px-4 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{isAnalyzing ? 'Running...' : 'Run Code'}</span>
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isAnalyzing}
                    className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Submit</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex">
              <div className="w-12 bg-slate-800/50 border-r border-white/10 text-xs text-gray-500 p-2 text-right select-none">
                {code.split('\n').map((_, i) => (
                  <div key={i} className="leading-6">{i + 1}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-slate-800/30 p-4 font-mono text-sm leading-6 resize-none focus:outline-none"
                style={{ tabSize: 2 }}
                spellCheck={false}
              />
            </div>

            {/* Bottom Tabs */}
            <div className="border-t border-white/10">
              <div className="flex space-x-1 px-6 pt-2">
                {(['testcases', 'output', 'expected'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === tab
                        ? 'bg-slate-700/50 text-white border-t border-x border-white/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="p-6 bg-slate-800/30 min-h-[200px]">
                {activeTab === 'testcases' && (
                  <div className="space-y-3">
                    {testCases.map((testCase, index) => (
                      <div key={index} className="bg-slate-900/50 rounded-lg p-3 border border-white/10">
                        <div className="text-sm">
                          <div className="text-gray-400 mb-1">Input:</div>
                          <div className="font-mono text-white">{testCase.input}</div>
                          <div className="text-gray-400 mb-1 mt-2">Expected:</div>
                          <div className="font-mono text-green-400">{testCase.expected}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'output' && (
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-green-400">Execution completed</span>
                    </div>
                    <pre className="font-mono text-sm text-white">
{`[0, 1]
Execution time: 45ms
Memory usage: 38.2 MB`}
                    </pre>
                  </div>
                )}
                
                {activeTab === 'expected' && (
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-white/10">
                    <div className="text-sm text-gray-400 mb-2">Expected Output:</div>
                    <pre className="font-mono text-sm text-green-400">[0, 1]</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Feedback Panel - Enhanced */}
      {!focusMode && (
        <div className="fixed left-6 bottom-24 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">AI Performance Analysis</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          
          {/* Overall Score */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Overall Score</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round((aiMetrics.confidence + aiMetrics.communication + aiMetrics.technical + aiMetrics.problemSolving + aiMetrics.clarity) / 5)}%
                </p>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                  <motion.circle
                    cx="32" cy="32" r="28"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(Math.round((aiMetrics.confidence + aiMetrics.communication + aiMetrics.technical + aiMetrics.problemSolving + aiMetrics.clarity) / 5) / 100) * 176} 176`}
                    initial={{ strokeDasharray: "0 176" }}
                    animate={{ strokeDasharray: `${(Math.round((aiMetrics.confidence + aiMetrics.communication + aiMetrics.technical + aiMetrics.problemSolving + aiMetrics.clarity) / 5) / 100) * 176} 176` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor: '#3B82F6', stopOpacity: 1}} />
                      <stop offset="100%" style={{stopColor: '#8B5CF6', stopOpacity: 1}} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Detailed Metrics */}
          <div className="space-y-4">
            {Object.entries(aiMetrics).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className={`text-sm font-bold ${
                    value >= 80 ? 'text-green-400' : 
                    value >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {value}%
                  </span>
                </div>
                <div className="relative">
                  <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        value >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                        value >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* AI Analysis Status */}
          <div className="mt-6 p-3 bg-slate-700/30 rounded-xl border border-white/10">
            {isAnalyzing ? (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                  <div className="absolute top-0 left-0 w-3 h-3 bg-blue-400 rounded-full"></div>
                </div>
                <span className="text-sm text-blue-400 font-medium">AI is analyzing your solution...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-green-400 font-medium">Analysis complete</span>
              </div>
            )}
          </div>
          
          {/* Insights */}
          <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <p className="text-xs text-blue-300">
              <span className="font-semibold">AI Insight:</span> Your problem-solving approach shows strong analytical thinking. Consider optimizing your time complexity for better performance.
            </p>
          </div>
        </div>
      )}

      {/* Bottom Controls - Enhanced */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl border-t border-white/20 z-40">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={handleNextQuestion}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold transition-all transform hover:scale-105 hover:shadow-lg flex items-center space-x-3 text-white"
              >
                <span>Next Question</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => showToastMessage('Question skipped')}
                className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 rounded-xl font-semibold transition-all transform hover:scale-105 hover:shadow-lg text-white"
              >
                Skip Question
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl font-semibold transition-all transform hover:scale-105 hover:shadow-lg flex items-center space-x-3 text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Submit Answer</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                <span className="font-medium">Time:</span> {formatTime(timeRemaining)}
              </div>
              <button
                onClick={handleEndInterview}
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl font-semibold transition-all transform hover:scale-105 hover:shadow-lg text-white"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed top-24 right-6 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-xl border border-white/10 z-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewPlatform;

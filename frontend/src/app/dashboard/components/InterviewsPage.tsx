import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Play, ChevronDown, ChevronUp } from 'lucide-react';
import '../../../styles/CandidateDashboard.css';

interface QA {
  question: string;
  answer: string;
  score: number;
  feedback?: string;
}

interface ReportData {
  narrative_summary?: string;
  strengths?: string;
  weaknesses?: string;
  recommendation?: string;
  proctoring_analysis?: any;
  email_delivery_status?: string;
  email_delivery_error?: string | null;
}

interface InterviewHistoryItem {
  interview_id: number;
  job_role: string;
  company: string;
  date: string;
  qa_list: QA[];
  total_score: number;
  average_score: number;
  report_url?: string | null;
  report?: ReportData;
}

interface InterviewsPageProps {
  interviewHistory: InterviewHistoryItem[];
  loading: boolean;
}

const EMPTY_HISTORY: InterviewHistoryItem[] = [];

function buildInterviewCards(history: InterviewHistoryItem[]) {
  return history.map((item) => {
    let score = item.report?.final_interview_score || item.report?.hiring_readiness_score || 0;
    if (score === 0) {
      score = item.average_score || 0;
      if (score > 0 && score <= 10) {
        score = score * 10;
      }
    } else if (score > 0 && score <= 10) {
      score = score * 10;
    }
    const scorePercent = Math.round(score);
    const strengths = item.report?.strengths ? item.report.strengths.split(/[\n;]+/).filter(Boolean) : [];
    const weaknesses = item.report?.weaknesses ? item.report.weaknesses.split(/[\n;]+/).filter(Boolean) : [];
    const sentiment = item.report?.recommendation || 'Interview completed';
    const sentimentColor = scorePercent >= 80 ? '#10B981' : scorePercent >= 60 ? '#F59E0B' : '#64748B';
    const sentimentBg = scorePercent >= 80 ? 'rgba(16, 185, 129, 0.1)' : scorePercent >= 60 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(100, 116, 139, 0.1)';
    const summary = item.report?.narrative_summary || item.qa_list.slice(0, 2).map((qa) => qa.feedback || qa.question).join(' | ');
    const questions = item.qa_list.map((qa) => ({
      question: qa.question,
      answer: qa.answer,
      score: qa.score,
      feedback: qa.feedback
    }));
    return {
      interviewId: item.interview_id,
      role: item.job_role,
      company: item.company,
      date: new Date(item.date).toLocaleDateString(),
      score: scorePercent,
      sentiment,
      sentimentColor,
      sentimentBg,
      summary,
      strengths,
      weaknesses,
      recommendation: item.report?.recommendation,
      report_url: item.report_url,
      questions
    };
  });
}

function buildPerformanceTrend(history: InterviewHistoryItem[]) {
  return history
    .map((item) => {
      let score = item.report?.final_interview_score || item.report?.hiring_readiness_score || 0;
      if (score === 0) {
        score = item.average_score || 0;
        if (score > 0 && score <= 10) {
          score = score * 10;
        }
      } else if (score > 0 && score <= 10) {
        score = score * 10;
      }
      return {
        name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round(score)
      };
    })
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
}

export default function InterviewsPage({ interviewHistory, loading }: InterviewsPageProps) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const interviewCards = buildInterviewCards(interviewHistory || EMPTY_HISTORY);
  const performanceData = buildPerformanceTrend(interviewHistory || EMPTY_HISTORY);
  
  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="candidate-dashboard" style={{ padding: '2rem', minHeight: 'calc(100vh - 2rem)', borderRadius: '1rem', overflowY: 'auto', backgroundColor: '#FDFBF7' }}>
      <div className="cd-container">
        
        <div className="cd-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h1 className="cd-title" style={{ fontSize: '2.5rem', color: '#0F172A', letterSpacing: '-0.025em' }}>My Interviews Hub</h1>
          <p className="cd-subtitle" style={{ color: '#64748B' }}>Analyze your AI evaluations, narrative reviews, and speaking transcript breakdowns.</p>
        </div>

        <div className="flex flex-col gap-6 mb-8">
          <div className="w-full flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1" style={{ textAlign: 'left' }}>Completed Sessions</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {interviewCards.length ? interviewCards.map((item) => {
                const isExpanded = expandedId === item.interviewId;
                return (
                  <div
                    key={item.interviewId}
                    className="transition-all duration-200 border border-[#E5E7EB]"
                    style={{ 
                      padding: '1.5rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1rem',
                      backgroundColor: '#F4F1EA',
                      borderRadius: '16px',
                      boxShadow: 'inset 2px 2px 5px rgba(255, 255, 255, 0.7), inset -3px -3px 7px rgba(0, 0, 0, 0.03), 4px 4px 10px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div className="flex justify-between items-start cursor-pointer" onClick={(e) => toggleExpand(item.interviewId, e)}>
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                          style={{
                            background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                            boxShadow: '4px 4px 10px rgba(220, 38, 38, 0.2)'
                          }}
                        >
                          {item.company?.charAt(0) || 'I'}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <h4 className="font-extrabold text-[#0F172A]" style={{ margin: 0, fontSize: '1.25rem' }}>{item.role}</h4>
                          <p className="text-sm text-[#64748B]" style={{ margin: '0.2rem 0 0 0', fontWeight: 600 }}>{item.company} &bull; {item.date}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span 
                          className="text-[11px] font-bold px-3 py-1.5 rounded-full border shadow-sm"
                          style={{
                            color: item.sentimentColor,
                            backgroundColor: item.sentimentBg,
                            borderColor: `${item.sentimentColor}30`
                          }}
                        >
                          {item.sentiment}
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Score:</span>
                          <span className="font-extrabold text-lg text-[#DC2626]">{item.score}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-[#475569] leading-relaxed text-left p-4 rounded-xl m-0 overflow-y-auto custom-scrollbar" style={{ maxHeight: '180px', backgroundColor: '#FDFBF7', border: '1px solid #E2E8F0', boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.02)' }}>
                      <ol className="list-decimal list-outside ml-4 space-y-2 m-0 p-0 font-medium">
                        {item.summary.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim().length > 5).slice(0, 5).map((point, idx) => (
                          <li key={idx} className="pl-1">{point.trim().replace(/^[-*•]\s*/, '')}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex justify-center mt-2 border-t border-[#E2E8F0] pt-4">
                      <button 
                        onClick={(e) => toggleExpand(item.interviewId, e)}
                        className="flex items-center gap-2 text-sm font-bold text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                      >
                        {isExpanded ? 'Hide Details' : 'View Full Performance & Details'}
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 flex flex-col gap-6 animate-fadeIn text-left">
                        
                        {/* Report Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-5 rounded-xl border border-[#E2E8F0]" style={{ backgroundColor: '#FDFBF7', boxShadow: '2px 2px 8px rgba(0,0,0,0.02)' }}>
                            <div className="text-xs uppercase font-extrabold text-[#10B981] tracking-wider mb-3">Key Strengths</div>
                            <ol className="list-decimal list-outside ml-4 p-0 m-0 space-y-2">
                              {item.strengths.length ? item.strengths.map((str, idx) => (
                                <li key={idx} className="text-sm text-[#334155] pl-1 font-medium">
                                  {str.trim()}
                                </li>
                              )) : (
                                <li className="text-sm text-[#64748B] list-none -ml-4">No strengths captured</li>
                              )}
                            </ol>
                          </div>
                          
                          <div className="p-5 rounded-xl border border-[#E2E8F0]" style={{ backgroundColor: '#FDFBF7', boxShadow: '2px 2px 8px rgba(0,0,0,0.02)' }}>
                            <div className="text-xs uppercase font-extrabold text-[#F59E0B] tracking-wider mb-3">Areas for Improvement</div>
                            <ol className="list-decimal list-outside ml-4 p-0 m-0 space-y-2">
                              {item.weaknesses.length ? item.weaknesses.map((wk, idx) => (
                                <li key={idx} className="text-sm text-[#334155] pl-1 font-medium">
                                  {wk.trim()}
                                </li>
                              )) : (
                                <li className="text-sm text-[#64748B] list-none -ml-4">No weaknesses captured</li>
                              )}
                            </ol>
                          </div>
                        </div>

                        {/* Recommendation */}
                        {item.recommendation && (
                          <div className="p-5 rounded-xl border border-[#E2E8F0]" style={{ backgroundColor: '#FDFBF7', boxShadow: '2px 2px 8px rgba(0,0,0,0.02)' }}>
                            <div className="flex justify-between items-center mb-3">
                              <div className="text-xs uppercase font-extrabold text-[#64748B] tracking-wider">Final Recommendation</div>
                              <div className="flex items-center gap-2">
                                {item.report?.email_delivery_status === 'sent' && (
                                  <span className="text-[9px] font-bold text-[#10B981] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#DCFCE7] whitespace-nowrap">Email Sent</span>
                                )}
                                {item.report?.email_delivery_status === 'smtp_missing' && (
                                  <span className="text-[9px] font-bold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.5 rounded border border-[#FEF3C7] whitespace-nowrap" title="SMTP Credentials Missing">Email Skipped</span>
                                )}
                                {item.report?.email_delivery_status === 'failed' && (
                                  <span className="text-[9px] font-bold text-[#EF4444] bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FEE2E2] whitespace-nowrap" title={item.report.email_delivery_error || 'Delivery Failed'}>Email Failed</span>
                                )}
                                {item.report_url && (
                                  <a 
                                    href={`${item.report_url}?token=${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-xs font-bold text-[#0EA5E9] hover:underline" 
                                    style={{ cursor: 'pointer' }}
                                  >
                                    View Raw Report
                                  </a>
                                )}
                              </div>
                            </div>
                            <ol className="list-decimal list-outside ml-4 p-0 m-0 space-y-2">
                              {item.recommendation.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim().length > 5).map((point, idx) => (
                                <li key={idx} className="text-sm text-[#334155] pl-1 font-medium">{point.trim().replace(/^[-*•]\s*/, '')}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* QA Breakdown */}
                        <div className="mt-2">
                          <h5 className="text-sm font-extrabold text-[#0F172A] mb-4 border-b border-[#E2E8F0] pb-2">Question & Answer Breakdown</h5>
                          <div className="flex flex-col gap-4">
                            {item.questions.map((qa, idx) => (
                              <div key={idx} className="p-4 rounded-lg border border-[#E2E8F0]" style={{ backgroundColor: '#FFFFFF', boxShadow: '1px 1px 4px rgba(0,0,0,0.02)' }}>
                                <div className="flex justify-between items-start gap-4 mb-2">
                                  <h6 className="text-sm font-bold text-[#0F172A] m-0 leading-snug flex-1">Q: {qa.question}</h6>
                                  <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2 py-1 rounded-md border border-[#E2E8F0] whitespace-nowrap">
                                    <span className="text-[10px] font-bold uppercase text-[#64748B]">Score</span>
                                    <span className="text-xs font-extrabold text-[#DC2626]">{qa.score}/10</span>
                                  </div>
                                </div>
                                <p className="text-sm text-[#475569] mt-2 mb-3 leading-relaxed">
                                  <span className="font-semibold text-[#64748B] mr-1">Your Answer:</span>
                                  {qa.answer}
                                </p>
                                {qa.feedback && (
                                  <div className="mt-2 p-3 rounded bg-[#FEF2F2] border border-[#FEE2E2]">
                                    <p className="text-xs text-[#991B1B] m-0"><span className="font-bold">Feedback:</span> {qa.feedback}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="border border-[#E5E7EB] p-8 text-center text-[#64748B]" style={{ backgroundColor: '#F4F1EA', borderRadius: '16px', boxShadow: 'inset 2px 2px 5px rgba(255, 255, 255, 0.7), inset -3px -3px 7px rgba(0, 0, 0, 0.03)' }}>
                  {loading ? 'Loading interview history…' : 'No interview history found. Complete your first interview to start seeing real data.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cd-chart-section">
          <div className="cd-chart-card" style={{ backgroundColor: '#F4F1EA', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB', boxShadow: 'inset 2px 2px 5px rgba(255, 255, 255, 0.7), inset -3px -3px 7px rgba(0, 0, 0, 0.03), 4px 4px 10px rgba(0, 0, 0, 0.05)' }}>
            <h2 className="cd-section-title" style={{ color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Activity size={24} color="#DC2626" />
              Evaluation Performance Trend
            </h2>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backgroundColor: '#FDFBF7' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#DC2626" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#F59E0B' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>



      </div>
    </div>
  );
}

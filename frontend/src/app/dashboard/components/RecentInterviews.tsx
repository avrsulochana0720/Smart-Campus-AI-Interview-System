'use client';

import EmptyState from './EmptyState';

interface QA {
  question: string;
  answer: string;
  score: number;
  feedback?: string;
}

interface Interview {
  interview_id: number;
  job_role: string;
  company: string;
  date: string;
  qa_list: QA[];
  total_score: number;
  average_score: number;
  report?: {
    narrative_summary: string;
    strengths: string;
    weaknesses: string;
    recommendation: string;
    proctoring_analysis?: any;
  };
}

interface RecentInterviewsProps {
  interviews: Interview[];
  onViewAll: () => void;
}



function RecentInterviews({ interviews, onViewAll }: RecentInterviewsProps) {
  const recentList = interviews.slice(0, 5);

  if (recentList.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 h-full">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-sm font-semibold text-[#111827]">Recent Interviews</h3>
          <button
            onClick={onViewAll}
            className="text-xs text-[#DC2626] font-medium hover:underline"
          >
            View all
          </button>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-semibold text-[#111827]">Recent Interviews</h3>
        <button
          onClick={onViewAll}
          className="text-xs text-[#DC2626] font-medium hover:underline"
        >
          View all
        </button>
      </div>

      <div className="space-y-4">
        {recentList.map((interview) => {
          const candidateName = `Candidate #${interview.interview_id}`;
          const answered = interview.qa_list.filter((qa) => qa.answer !== 'Not answered').length;
          const isCompleted = answered === interview.qa_list.length;
          const formattedDate = new Date(interview.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div
              key={interview.interview_id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-xs" 
                  style={{ background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)' }}
                >
                  {candidateName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#111827] truncate">
                    {candidateName}
                  </p>
                  <p className="text-xs text-[#6B7280] truncate">{interview.job_role}</p>
                </div>
              </div>

              <span className="text-sm font-bold text-[#DC2626] flex-shrink-0 mx-3">
                {Math.round(interview.average_score * 10)}
              </span>

              <div className="flex flex-col items-end flex-shrink-0">
                {isCompleted ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#059669]">
                    Completed
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FED7AA] text-[#EA580C]">
                    In Progress
                  </span>
                )}
                <p className="text-[10px] text-[#6B7280] mt-0.5">{formattedDate}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecentInterviews;

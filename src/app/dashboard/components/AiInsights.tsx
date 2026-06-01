'use client';

import { Sparkles } from 'lucide-react';

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

interface AiInsightsProps {
  interviews: Interview[];
}

const FALLBACK_INSIGHTS = [
  'Most strong performance in Technical Knowledge this week.',
  'Communication scores are trending down. Consider reviewing question set.',
  '75% of candidates showed good problem-solving skills.',
];

const generateInsights = (interviews: Interview[]): string[] => {
  if (interviews.length === 0) {
    return FALLBACK_INSIGHTS;
  }

  const insights: string[] = [];

  // Find the latest interview with a report
  const withReport = interviews.find((i) => i.report);

  if (withReport?.report) {
    const summary = withReport.report.narrative_summary;
    insights.push(
      summary.length > 120 ? summary.slice(0, 120) + '…' : summary
    );

    if (withReport.report.strengths) {
      insights.push(
        `Key strength identified: ${withReport.report.strengths.length > 100 ? withReport.report.strengths.slice(0, 100) + '…' : withReport.report.strengths}`
      );
    }

    if (withReport.report.weaknesses) {
      insights.push(
        `Area for improvement: ${withReport.report.weaknesses.length > 100 ? withReport.report.weaknesses.slice(0, 100) + '…' : withReport.report.weaknesses}`
      );
    }
  }

  // If we couldn't generate enough from reports, fill with fallbacks
  while (insights.length < 3) {
    insights.push(FALLBACK_INSIGHTS[insights.length]);
  }

  return insights.slice(0, 3);
};

function AiInsights({ interviews }: AiInsightsProps) {
  const insights = generateInsights(interviews);

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-[#DC2626]" />
        <h3 className="text-sm font-semibold text-[#111827]">AI Insights</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-lg"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626] mt-1.5 flex-shrink-0" />
            <p className="text-xs text-[#6B7280] leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>

      <button className="text-xs text-[#DC2626] font-medium hover:underline mt-3">
        View all insights →
      </button>
    </div>
  );
}

export default AiInsights;

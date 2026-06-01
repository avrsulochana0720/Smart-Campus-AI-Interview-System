'use client';

import { ChevronDown } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

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

interface InterviewChartProps {
  interviews: Interview[];
}

const generateChartData = (interviews: Interview[]) => {
  if (interviews.length === 0) {
    const days = ['May 12', 'May 13', 'May 14', 'May 15', 'May 16', 'May 17', 'May 18'];
    return days.map((date, i) => ({
      date,
      interviews: [20, 35, 45, 55, 48, 65, 72][i],
      completed: [15, 28, 38, 42, 35, 55, 60][i],
    }));
  }

  const grouped: Record<string, { interviews: number; completed: number }> = {};
  interviews.forEach((interview) => {
    const dateStr = new Date(interview.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    if (!grouped[dateStr]) grouped[dateStr] = { interviews: 0, completed: 0 };
    grouped[dateStr].interviews++;
    const answered = interview.qa_list.filter((qa) => qa.answer !== 'Not answered').length;
    if (answered === interview.qa_list.length) grouped[dateStr].completed++;
  });

  return Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
};

function InterviewChart({ interviews }: InterviewChartProps) {
  const chartData = generateChartData(interviews);

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-semibold text-[#111827]">Interviews Overview</h3>
        <div className="flex items-center gap-2 text-xs text-[#6B7280] bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-3 py-1.5 cursor-pointer">
          This Week
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#DC2626]" />
          <span className="text-xs text-[#6B7280]">Interviews</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#D1FAE5] border border-[#059669]" />
          <span className="text-xs text-[#6B7280]">Completed</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Line
            type="monotone"
            dataKey="interviews"
            stroke="#DC2626"
            strokeWidth={2}
            dot={{ fill: '#DC2626', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#059669"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#059669', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default InterviewChart;

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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

interface DepartmentChartProps {
  interviews: Interview[];
}

const COLORS = ['#DC2626', '#EF4444', '#F59E0B', '#0F172A'];

const buildDeptData = (interviews: Interview[]) => {
  if (interviews.length === 0) {
    return [
      { name: 'Computer Science', value: 35 },
      { name: 'Electronics', value: 25 },
      { name: 'Mechanical', value: 20 },
      { name: 'Other Departments', value: 20 },
    ];
  }

  const grouped: Record<string, number> = {};
  interviews.forEach((i) => {
    const dept = i.job_role || 'Other';
    grouped[dept] = (grouped[dept] || 0) + 1;
  });

  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
};

function DepartmentChart({ interviews }: DepartmentChartProps) {
  const data = buildDeptData(interviews);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">
        Interview Performance by Department
      </h3>

      <div className="flex items-center gap-6">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {data.map((entry, index) => {
            const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            return (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-[#6B7280]">
                  {entry.name} {percentage}% ({entry.value})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DepartmentChart;

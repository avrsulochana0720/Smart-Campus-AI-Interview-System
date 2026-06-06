'use client';

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

interface SkillScoresProps {
  interviews: Interview[];
}

const SKILL_NAMES = [
  'Technical Knowledge',
  'Problem Solving',
  'Communication',
  'Coding',
  'Behavioral',
];

const SKILL_COLORS = ['#DC2626', '#EF4444', '#F59E0B', '#0F172A', '#64748B'];

const SAMPLE_SCORES = [82, 79, 74, 81, 77];

function SkillScores({ interviews }: SkillScoresProps) {
  const skills = SKILL_NAMES.map((name, index) => {
    let score: number;

    if (interviews.length > 0) {
      const latestInterview = interviews[0];
      const qa = latestInterview.qa_list[index];
      score = qa ? Math.round(qa.score * 10) : SAMPLE_SCORES[index];
    } else {
      score = SAMPLE_SCORES[index];
    }

    return {
      name,
      score: Math.min(score, 100),
      color: SKILL_COLORS[index],
    };
  });

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-[#111827]">Average Score by Skill</h3>
        <button className="text-xs text-[#DC2626] font-medium hover:underline">
          View detailed report
        </button>
      </div>

      <div className="space-y-4">
        {skills.map((skill) => (
          <div key={skill.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#111827]">{skill.name}</span>
              <span className="text-xs font-semibold text-[#111827]">{skill.score}/100</span>
            </div>
            <div className="h-2 bg-[#F8FAFC] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${skill.score}%`, backgroundColor: skill.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkillScores;

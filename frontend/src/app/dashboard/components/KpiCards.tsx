'use client';

import { ClipboardList, Users, CheckCircle2, Star, Award, TrendingUp } from 'lucide-react';

interface KpiCardsProps {
  totalInterviews: number;
  totalCandidates: number;
  completedInterviews: number;
  averageScore: number;
  offersExtended: number;
  loading: boolean;
}

  const cards = [
    {
      key: 'totalInterviews',
      title: 'Total Interviews',
      Icon: ClipboardList,
      bg: 'bg-[#FEE2E2]',
      iconColor: 'text-[#DC2626]',
    },
    {
      key: 'totalCandidates',
      title: 'Candidates',
      Icon: Users,
      bg: 'bg-[#FEE2E2]',
      iconColor: 'text-[#EF4444]',
    },
    {
      key: 'completedInterviews',
      title: 'Completed Interviews',
      Icon: CheckCircle2,
      bg: 'bg-[#FEF3C7]',
      iconColor: 'text-[#F59E0B]',
    },
    {
      key: 'averageScore',
      title: 'Average Score',
      Icon: Star,
      bg: 'bg-[#E2E8F0]',
      iconColor: 'text-[#0F172A]',
    },
    {
      key: 'offersExtended',
      title: 'Offers Extended',
      Icon: Award,
      bg: 'bg-[#FEE2E2]',
      iconColor: 'text-[#DC2626]',
    },
  ] as const;

function KpiCards({
  totalInterviews,
  totalCandidates,
  completedInterviews,
  averageScore,
  offersExtended,
  loading,
}: KpiCardsProps) {
  const values: Record<string, string> = {
    totalInterviews: String(totalInterviews),
    totalCandidates: String(totalCandidates),
    completedInterviews: String(completedInterviews),
    averageScore: `${(averageScore * 10).toFixed(1)} /100`,
    offersExtended: String(offersExtended),
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map(({ key, title, Icon, bg, iconColor }) => (
        <div
          key={key}
          className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-[#6B7280] mb-1">{title}</p>
              {loading ? (
                <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-[#111827]">{values[key]}</p>
              )}
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 text-[#6B7280]" />
            <span className="text-[#6B7280] font-medium">Real-time data</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default KpiCards;

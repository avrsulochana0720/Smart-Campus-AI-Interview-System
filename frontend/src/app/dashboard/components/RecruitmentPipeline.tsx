'use client';

import {
  FileText,
  ListFilter,
  CalendarCheck,
  CheckCircle2,
  Award,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface RecruitmentPipelineProps {
  totalInterviews: number;
  completedInterviews: number;
}

interface PipelineStep {
  label: string;
  Icon: LucideIcon;
  bg: string;
  iconColor: string;
  getValue: (total: number, completed: number) => number;
}

const steps: PipelineStep[] = [
  {
    label: 'Applied',
    Icon: FileText,
    bg: 'bg-[#FEE2E2]',
    iconColor: 'text-[#EF4444]',
    getValue: () => 0, // Pending ATS Integration
  },
  {
    label: 'Shortlisted',
    Icon: ListFilter,
    bg: 'bg-[#FEE2E2]',
    iconColor: 'text-[#DC2626]',
    getValue: () => 0, // Pending ATS Integration
  },
  {
    label: 'Interview Scheduled',
    Icon: CalendarCheck,
    bg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#F59E0B]',
    getValue: () => 0, // Pending ATS Integration
  },
  {
    label: 'Completed',
    Icon: CheckCircle2,
    bg: 'bg-[#E2E8F0]',
    iconColor: 'text-[#0F172A]',
    getValue: (_, completed) => completed,
  },
  {
    label: 'Offers Extended',
    Icon: Award,
    bg: 'bg-[#FEE2E2]',
    iconColor: 'text-[#DC2626]',
    getValue: () => 0, // Pending ATS Integration
  },
];

function RecruitmentPipeline({ totalInterviews, completedInterviews }: RecruitmentPipelineProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-[#111827]">Overall Pipeline</h3>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#DC2626] text-white text-xs font-medium rounded-lg hover:bg-[#B91C1C] transition-colors">
          View Full Pipeline
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Desktop: horizontal layout */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const value = step.getValue(totalInterviews, completedInterviews);
          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full ${step.bg} flex items-center justify-center mb-2`}
                >
                  <step.Icon className={`w-5 h-5 ${step.iconColor}`} />
                </div>
                <p className="text-[10px] text-[#6B7280] font-medium text-center">
                  {step.label}
                </p>
                <p className="text-lg font-bold text-[#111827]">{value}</p>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-[#E5E7EB] mx-2 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical layout */}
      <div className="flex sm:hidden flex-col gap-3">
        {steps.map((step, index) => {
          const value = step.getValue(totalInterviews, completedInterviews);
          return (
            <div key={step.label}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${step.bg} flex items-center justify-center flex-shrink-0`}
                >
                  <step.Icon className={`w-5 h-5 ${step.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#6B7280] font-medium">{step.label}</p>
                  <p className="text-lg font-bold text-[#111827]">{value}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ChevronRight className="w-4 h-4 text-[#E5E7EB] rotate-90" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecruitmentPipeline;

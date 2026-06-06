import { Loader2, InboxIcon, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  type: 'loading' | 'empty' | 'error';
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

function EmptyState({ type, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
        type === 'error' ? 'bg-red-50' : 'bg-red-50'
      }`}>
        {type === 'loading' && <Loader2 className="w-6 h-6 text-[#DC2626] animate-spin" />}
        {type === 'empty' && <InboxIcon className="w-6 h-6 text-[#DC2626]" />}
        {type === 'error' && <AlertCircle className="w-6 h-6 text-red-500" />}
      </div>
      <h3 className="text-sm font-semibold text-[#111827] mb-1">
        {title || (type === 'loading' ? 'Loading...' : type === 'empty' ? 'No data available' : 'Something went wrong')}
      </h3>
      {message && <p className="text-xs text-[#6B7280] max-w-xs">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-[#DC2626] text-white text-xs font-medium rounded-lg hover:bg-[#B91C1C] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;

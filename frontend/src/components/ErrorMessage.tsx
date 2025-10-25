/**
 * Professional Error Message Component
 */

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ title = 'Error', message, onRetry }: ErrorMessageProps) {
  return (
    <div className="p-6 glass rounded-2xl border border-red-500/30 bg-red-500/5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-400 mb-1">{title}</h3>
          <p className="text-sm text-gray-300">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Try Again →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

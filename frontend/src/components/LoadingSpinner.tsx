/**
 * Professional Loading Component with animations
 */

export default function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} border-primary/20 border-t-primary rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-400 animate-pulse">{text}</p>}
    </div>
  );
}

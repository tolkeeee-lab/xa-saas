export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };
  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-xa-border border-t-xa-primary animate-spin`}
      role="status"
      aria-label="Chargement"
    />
  );
}

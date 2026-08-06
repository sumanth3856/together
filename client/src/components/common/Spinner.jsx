export function Spinner({ size = 'text-[18px]', className = '', label = 'Loading' }) {
  return (
    <span role="status" aria-label={label} className={`inline-flex items-center justify-center ${className}`}>
      <span className={`material-symbols-outlined text-primary animate-spin ${size}`} aria-hidden="true">progress_activity</span>
    </span>
  );
}

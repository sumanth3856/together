export function Skeleton({ className = '', neutral = false }) {
  return <div aria-hidden="true" className={`skeleton ${neutral ? '' : 'skeleton-brand'} ${className}`} />;
}

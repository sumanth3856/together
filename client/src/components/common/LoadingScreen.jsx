import { Spinner } from './Spinner';
import { Skeleton } from './Skeleton';

export function LoadingScreen({ label = 'Loading Being Us', title = 'Being Us.' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-on-background"
    >
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-outlined text-4xl text-primary" aria-hidden="true">play_circle</span>
        <span className="font-display-lg text-2xl font-bold tracking-tight">{title}</span>
      </div>
      <Spinner size="text-3xl" label={label} />
      <p className="font-label-sm uppercase tracking-widest text-on-surface-variant">{label}</p>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-4 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

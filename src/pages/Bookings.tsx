import { useState, useEffect } from 'react';
import { CalendarDays, Clock, User, Music, CheckCircle2, Circle, XCircle, AlertTriangle } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  Scheduled: { icon: Circle, color: 'text-blue-400 bg-blue-500/10', label: 'Scheduled' },
  Confirmed: { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10', label: 'Confirmed' },
  Completed: { icon: CheckCircle2, color: 'text-cyan-400 bg-cyan-500/10', label: 'Completed' },
  Cancelled: { icon: XCircle, color: 'text-rose-400 bg-rose-500/10', label: 'Cancelled' },
  'No-Show': { icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10', label: 'No-Show' },
};

export default function Bookings() {
  const [bookings, setBookings] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    getNodes(PROJECTS.bookings)
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => getFieldValue(b, 'Status') === filter);

  const statuses = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show'];

  if (loading) return <PageSkeleton />;
  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">Could not load bookings</h2>
          <p className="text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground mt-1">Manage your lesson schedule</p>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </FilterChip>
        {statuses.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {s}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((bk) => (
            <BookingCard key={bk.id} node={bk} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({ node }: { node: GenesisNode }) {
  const student = getFieldValue(node, 'Student') ?? 'Unknown';
  const teacher = getFieldValue(node, 'Teacher') ?? '';
  const date = getFieldValue(node, 'Date & Time') ?? '';
  const duration = getFieldNumber(node, 'Duration (min)');
  const instrument = getFieldValue(node, 'Instrument') ?? '';
  const status = getFieldValue(node, 'Status') ?? 'Scheduled';
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.Scheduled;
  const StatusIcon = config.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/10 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{student}</h3>
            <span className="text-muted-foreground text-xs">with</span>
            <span className="text-sm font-medium truncate">{teacher}</span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="w-3 h-3" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{duration} min</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Music className="w-3 h-3" />
              <span>{instrument}</span>
            </div>
          </div>
        </div>

        <span className={cn(
          'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0',
          config.color,
        )}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </span>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-CH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function PageSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" />
      <div className="h-4 w-48 bg-muted rounded mb-8" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-muted rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}

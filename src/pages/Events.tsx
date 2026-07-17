import { useState, useEffect } from 'react';
import { Ticket, MapPin, CalendarDays, Users, Sparkles } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  'Concert': 'bg-blue-500/10 text-blue-400',
  'Masterclass': 'bg-amber-500/10 text-amber-400',
  'Workshop': 'bg-emerald-500/10 text-emerald-400',
  'Recital': 'bg-purple-500/10 text-purple-400',
  'Competition': 'bg-rose-500/10 text-rose-400',
  'Festival': 'bg-cyan-500/10 text-cyan-400',
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  'Upcoming': { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Upcoming' },
  'Live Now': { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Live Now' },
  'Completed': { color: 'bg-muted text-muted-foreground border-border', label: 'Completed' },
  'Cancelled': { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Cancelled' },
};

export default function Events() {
  const [events, setEvents] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    getNodes(PROJECTS.events)
      .then((nodes) => {
        setEvents(nodes.sort((a, b) => {
          const da = getFieldValue(a, 'Date & Time') ?? '';
          const db = getFieldValue(b, 'Date & Time') ?? '';
          return da.localeCompare(db);
        }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? events : events.filter((e) => getFieldValue(e, 'Status') === filter);

  const statuses = ['Upcoming', 'Live Now', 'Completed', 'Cancelled'];

  if (loading) return <PageSkeleton />;
  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">Could not load events</h2>
          <p className="text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-1">Concerts, masterclasses, and workshops</p>
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
          <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ev) => (
            <EventCard key={ev.id} node={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ node }: { node: GenesisNode }) {
  const title = getFieldValue(node, 'Title') ?? node.title ?? 'Untitled';
  const venue = getFieldValue(node, 'Venue') ?? '';
  const date = getFieldValue(node, 'Date & Time') ?? '';
  const price = getFieldNumber(node, 'Price (CHF)');
  const capacity = getFieldNumber(node, 'Capacity');
  const cat = getFieldValue(node, 'Category') ?? '';
  const status = getFieldValue(node, 'Status') ?? 'Upcoming';
  const statusStyle = STATUS_CONFIG[status] ?? STATUS_CONFIG.Upcoming;

  return (
    <div className={cn(
      'rounded-xl border bg-card p-5 hover:shadow-lg hover:shadow-primary/5 transition-all',
      statusStyle.color.includes('muted') ? 'border-border opacity-70' : 'border-primary/5 hover:border-primary/20',
    )}>
      <div className="flex items-start gap-2 mb-3">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', CATEGORY_COLORS[cat] ?? 'bg-muted text-muted-foreground')}>
          {cat}
        </span>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusStyle.color)}>
          {statusStyle.label}
        </span>
      </div>

      <h3 className="font-semibold text-base mb-3 leading-snug">{title}</h3>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>{formatDate(date)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{venue}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{capacity} seats</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-lg font-bold text-primary tabular-nums">
          CHF {price?.toFixed(0) ?? ''}
        </span>
        {status === 'Upcoming' || status === 'Live Now' ? (
          <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Get Tickets
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">{statusStyle.label}</span>
        )}
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
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-muted rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}

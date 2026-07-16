import { useState, useEffect } from 'react';
import { Ticket, MapPin, CalendarDays, Users } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Concert: 'bg-blue-500/10 text-blue-400',
  Masterclass: 'bg-amber-500/10 text-amber-400',
  Workshop: 'bg-emerald-500/10 text-emerald-400',
  Recital: 'bg-purple-500/10 text-purple-400',
  Competition: 'bg-rose-500/10 text-rose-400',
  Festival: 'bg-cyan-500/10 text-cyan-400',
};

export default function PublicEvents() {
  const [events, setEvents] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    getNodes(PROJECTS.events)
      .then((nodes) => setEvents(nodes.sort((a, b) => (getFieldValue(a, 'Date & Time') ?? '').localeCompare(getFieldValue(b, 'Date & Time') ?? ''))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? events : events.filter((e) => getFieldValue(e, 'Status') === filter);
  const statuses = ['Upcoming', 'Live Now', 'Completed'];

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-1">Concerts, masterclasses, and workshops</p>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setFilter('all')} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap', filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>All</button>
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap', filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No events found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ev) => (
            <div key={ev.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start gap-2 mb-3">
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', CATEGORY_COLORS[getFieldValue(ev, 'Category') ?? ''] ?? 'bg-muted text-muted-foreground')}>{getFieldValue(ev, 'Category')}</span>
              </div>
              <h3 className="font-semibold text-base mb-3 leading-snug">{getFieldValue(ev, 'Title') ?? ev.title}</h3>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="w-3.5 h-3.5" /><span>{formatDate(getFieldValue(ev, 'Date & Time'))}</span></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{getFieldValue(ev, 'Venue')}</span></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="w-3.5 h-3.5" /><span>{getFieldNumber(ev, 'Capacity')} seats</span></div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-lg font-bold text-primary tabular-nums">CHF {getFieldNumber(ev, 'Price (CHF)')?.toFixed(0) ?? '—'}</span>
                <span className="text-xs text-muted-foreground">Sign in to book</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(d: string | null): string {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-CH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
}

function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" /><div className="h-4 w-48 bg-muted rounded mb-8" />
      <div className="flex gap-2 mb-6">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-8 w-20 bg-muted rounded-full" />))}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-56 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

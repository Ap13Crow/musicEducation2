import { useState, useEffect } from 'react';
import { Ticket, MapPin, CalendarDays, Users, Sparkles } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Concert: 'bg-blue-500/10 text-blue-400', Masterclass: 'bg-amber-500/10 text-amber-400',
  Workshop: 'bg-emerald-500/10 text-emerald-400', Recital: 'bg-purple-500/10 text-purple-400',
  Competition: 'bg-rose-500/10 text-rose-400', Festival: 'bg-cyan-500/10 text-cyan-400',
};

function computeRelevance(event: GenesisNode, profile: { instrument: string; skillLevel: string } | null): number {
  if (!profile) return 0;
  let score = 0;
  const cat = getFieldValue(event, 'Category') ?? '';
  const title = (getFieldValue(event, 'Title') ?? event.title ?? '').toLowerCase();
  if (cat === 'Masterclass' || cat === 'Workshop') score += 30;
  if (title.includes(profile.instrument.toLowerCase())) score += 40;
  if (title.includes('teaching') || title.includes('pedagogy')) score += 30;
  return Math.min(100, score);
}

export default function TeacherEvents() {
  const { profile } = useCurrentUser();
  const [events, setEvents] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNodes(PROJECTS.events)
      .then((nodes) => setEvents(nodes.sort((a, b) => (getFieldValue(a, 'Date & Time') ?? '').localeCompare(getFieldValue(b, 'Date & Time') ?? ''))))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-1">Curated for your teaching profile</p>
      </header>

      {events.length === 0 ? (
        <div className="text-center py-16"><Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No events found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => {
            const relevance = computeRelevance(ev, profile);
            const cat = getFieldValue(ev, 'Category') ?? '';
            return (
              <div key={ev.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all">
                <div className="flex items-start gap-2 mb-3 flex-wrap">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', CATEGORY_COLORS[cat] ?? 'bg-muted text-muted-foreground')}>{cat}</span>
                  {relevance >= 50 && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1"><Sparkles className="w-3 h-3" />{relevance}% match</span>}
                </div>
                <h3 className="font-semibold text-base mb-3">{getFieldValue(ev, 'Title') ?? ev.title}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="w-3.5 h-3.5" /><span>{formatDate(getFieldValue(ev, 'Date & Time'))}</span></div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" /><span>{getFieldValue(ev, 'Venue')}</span></div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-lg font-bold text-primary tabular-nums">CHF {getFieldNumber(ev, 'Price (CHF)')?.toFixed(0) ?? ''}</span>
                  <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Get Tickets</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(d: string | null): string {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-CH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" /><div className="h-4 w-48 bg-muted rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-56 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

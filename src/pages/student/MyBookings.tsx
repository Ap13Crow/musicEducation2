import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Clock, Music, CheckCircle2, Circle, XCircle, AlertTriangle, MapPin, ExternalLink, Video, Trash2 } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber, updateNode } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  Scheduled: { icon: Circle, color: 'text-blue-400 bg-blue-500/10', label: 'Scheduled' },
  Confirmed: { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10', label: 'Confirmed' },
  Completed: { icon: CheckCircle2, color: 'text-cyan-400 bg-cyan-500/10', label: 'Completed' },
  Cancelled: { icon: XCircle, color: 'text-rose-400 bg-rose-500/10', label: 'Cancelled' },
  'No-Show': { icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10', label: 'No-Show' },
};

export default function StudentMyBookings() {
  const { profile } = useCurrentUser();
  const [bookings, setBookings] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const studentName = profile?.displayName ?? '';

  const loadBookings = useCallback(() => {
    getNodes(PROJECTS.bookings).then((nodes) => {
      setBookings(nodes.filter((b) => getFieldValue(b, 'Student') === studentName));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [studentName]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleCancel = async (nodeId: string) => {
    setCancellingId(nodeId);
    try {
      await updateNode(PROJECTS.bookings, nodeId, { Status: 'Cancelled' });
      toast.success('Booking cancelled');
      loadBookings();
    } catch {
      toast.error('Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => getFieldValue(b, 'Status') === filter);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground mt-1">{bookings.length} lesson{bookings.length !== 1 ? 's' : ''} booked</p>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap', filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>{s === 'all' ? 'All' : s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No bookings found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((bk) => {
            const status = getFieldValue(bk, 'Status') ?? 'Scheduled';
            const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.Scheduled;
            const StatusIcon = config.icon;
            const location = getFieldValue(bk, 'Location');
            const meetLink = getFieldValue(bk, 'Meet Link');
            const studentEventId = getFieldValue(bk, 'Student GCal Event ID');
            const cancellable = status === 'Scheduled' || status === 'Confirmed';

            return (
              <div key={bk.id} className="rounded-xl border border-border bg-card p-4 hover:border-primary/10 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{getFieldValue(bk, 'Teacher')}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="w-3 h-3" />{formatDate(getFieldValue(bk, 'Date & Time'))}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{getFieldNumber(bk, 'Duration (min)')} min</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Music className="w-3 h-3" />{getFieldValue(bk, 'Instrument')}</span>
                      {location && <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{location}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {meetLink && <a href={meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Video className="w-3 h-3" />Join Meet</a>}
                      {studentEventId && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ExternalLink className="w-3 h-3" />In Calendar</span>}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 shrink-0">
                    <span className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', config.color)}><StatusIcon className="w-3 h-3" />{config.label}</span>
                    {cancellable && (
                      <button onClick={() => handleCancel(bk.id)} disabled={cancellingId === bk.id} className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Cancel booking">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
      <div className="flex gap-2 mb-6">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-8 w-20 bg-muted rounded-full" />))}</div>
      <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-20 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

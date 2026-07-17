import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, MapPin, Video, ExternalLink, Check, Trash2 } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber, updateNode } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionId, setActionId] = useState<string | null>(null);

  const loadBookings = useCallback(() => {
    setLoading(true);
    getNodes(PROJECTS.bookings).then(setBookings).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleStatusChange = async (nodeId: string, status: string) => {
    setActionId(nodeId);
    try {
      await updateNode(PROJECTS.bookings, nodeId, { Status: status });
      toast.success(status === 'Cancelled' ? 'Booking cancelled' : 'Booking confirmed');
      loadBookings();
    } catch {
      toast.error('Failed to update booking');
    } finally {
      setActionId(null);
    }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => getFieldValue(b, 'Status') === filter);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground mt-1">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setFilter('all')} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap', filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>All</button>
        {['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap', filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>{s}</button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Teacher</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Instrument</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Duration</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Calendar</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((bk) => {
              const status = getFieldValue(bk, 'Status') ?? '';
              const location = getFieldValue(bk, 'Location') ?? '';
              const meetLink = getFieldValue(bk, 'Meet Link') ?? '';
              const studentEventId = getFieldValue(bk, 'Student GCal Event ID') ?? '';
              const teacherEventId = getFieldValue(bk, 'Teacher GCal Event ID') ?? '';
              const hasCalendar = (studentEventId || teacherEventId);
              const canModify = status === 'Scheduled' || status === 'Confirmed';
              const isBusy = actionId === bk.id;

              return (
                <tr key={bk.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{getFieldValue(bk, 'Student')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getFieldValue(bk, 'Teacher')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(getFieldValue(bk, 'Date & Time'))}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getFieldValue(bk, 'Instrument')}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {location || ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{getFieldNumber(bk, 'Duration (min)')} min</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                      status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      status === 'Confirmed' ? 'bg-blue-500/10 text-blue-400' :
                      status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-muted text-muted-foreground')}>{status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {hasCalendar ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500">
                        <CalendarDays className="w-3.5 h-3.5" />
                        In Calendar
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground"></span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {meetLink ? (
                        <a href={meetLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Join Meet">
                          <Video className="w-4 h-4" />
                        </a>
                      ) : null}
                      {canModify && status === 'Scheduled' ? (
                        <button onClick={() => handleStatusChange(bk.id, 'Confirmed')} disabled={isBusy} className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50" title="Confirm">
                          <Check className="w-4 h-4" />
                        </button>
                      ) : null}
                      {canModify ? (
                        <button onClick={() => handleStatusChange(bk.id, 'Cancelled')} disabled={isBusy} className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50" title="Cancel">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(d: string | null): string {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-CH', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" /><div className="h-4 w-48 bg-muted rounded mb-8" />
      <div className="flex gap-2 mb-6">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-8 w-20 bg-muted rounded-full" />))}</div>
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  );
}

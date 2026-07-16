import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Star, Flame, TrendingUp, BookOpen, Music, GraduationCap, Ticket, Sparkles } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

interface AgendaItem {
  id: string;
  date: Date;
  type: 'lesson' | 'course' | 'event';
  title: string;
  subtitle: string;
  detail: string;
  status: string;
}

export default function StudentDashboard() {
  const { profile } = useCurrentUser();
  const [bookings, setBookings] = useState<GenesisNode[]>([]);
  const [enrollments, setEnrollments] = useState<GenesisNode[]>([]);
  const [attendees, setAttendees] = useState<GenesisNode[]>([]);
  const [evaluations, setEvaluations] = useState<GenesisNode[]>([]);
  const [events, setEvents] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);

  const studentName = profile?.displayName ?? 'Student';

  useEffect(() => {
    Promise.all([
      getNodes(PROJECTS.bookings),
      getNodes(PROJECTS.enrollments),
      getNodes(PROJECTS.eventAttendees),
      getNodes(PROJECTS.evaluations),
      getNodes(PROJECTS.events),
    ]).then(([b, e, a, ev, eventsList]) => {
      setBookings(b.filter((x) => getFieldValue(x, 'Student') === studentName));
      setEnrollments(e.filter((x) => getFieldValue(x, 'Student') === studentName));
      setAttendees(a.filter((x) => getFieldValue(x, 'Student') === studentName));
      setEvaluations(ev.filter((x) => getFieldValue(x, 'User') === studentName));
      setEvents(eventsList);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [studentName]);

  const agenda = useMemo(() => {
    const items: AgendaItem[] = [];

    bookings.forEach((b) => {
      const d = getFieldValue(b, 'Date & Time');
      if (!d) return;
      items.push({
        id: b.id, date: new Date(d), type: 'lesson',
        title: `Lesson with ${getFieldValue(b, 'Teacher') ?? ''}`,
        subtitle: getFieldValue(b, 'Instrument') ?? '',
        detail: getFieldValue(b, 'Location') ?? '',
        status: getFieldValue(b, 'Status') ?? '',
      });
    });

    enrollments.forEach((en) => {
      const d = getFieldValue(en, 'Enrollment Date');
      if (!d) return;
      items.push({
        id: en.id, date: new Date(d), type: 'course',
        title: getFieldValue(en, 'Course') ?? '',
        subtitle: 'Course',
        detail: `${getFieldNumber(en, 'Progress %') ?? 0}% complete`,
        status: getFieldValue(en, 'Status') ?? '',
      });
    });

    attendees.forEach((a) => {
      const d = getFieldValue(a, 'Purchase Date');
      if (!d) return;
      const evId = getFieldValue(a, 'Event');
      items.push({
        id: a.id, date: new Date(d), type: 'event',
        title: evId ?? 'Event',
        subtitle: events.find((e) => (getFieldValue(e, 'Title') ?? e.title) === evId) ? (getFieldValue(events.find((e) => (getFieldValue(e, 'Title') ?? e.title) === evId)!, 'Category') ?? '') : '',
        detail: getFieldValue(a, 'Ticket Type') ?? '',
        status: 'Attending',
      });
    });

    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items;
  }, [bookings, enrollments, attendees, events]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayItems = agenda.filter((i) => {
    const d = new Date(i.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const upcomingItems = agenda.filter((i) => i.date >= today && todayItems.every((t) => t.id !== i.id)).slice(0, 10);

  const upcomingLessons = bookings.filter((b) => { const s = getFieldValue(b, 'Status'); return s === 'Scheduled' || s === 'Confirmed'; }).length;
  const activeCourses = enrollments.filter((e) => getFieldValue(e, 'Status') === 'Active').length;
  const avgScore = evaluations.length > 0 ? Math.round(evaluations.reduce((s, e) => s + (getFieldNumber(e, 'Score') ?? 0), 0) / evaluations.length) : 0;
  const nextLesson = agenda.find((i) => i.type === 'lesson' && i.date >= today);

  if (loading) return <Skeleton />;

  const hasData = agenda.length > 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome back, {profile?.displayName?.split(' ')[0] ?? 'Musician'}</h1>
        <p className="text-muted-foreground mt-1">
          {nextLesson ? `Next lesson: ${formatDateShort(nextLesson.date)} with ${nextLesson.subtitle}` : 'No upcoming lessons — book one now'}
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Calendar} label="Upcoming Lessons" value={upcomingLessons} />
        <StatCard icon={BookOpen} label="Active Courses" value={activeCourses} />
        <StatCard icon={Star} label="Avg Score" value={`${avgScore}%`} />
        <StatCard icon={Flame} label="Today" value={`${todayItems.length} item${todayItems.length !== 1 ? 's' : ''}`} />
      </div>

      {!hasData ? (
        <div className="text-center py-16 rounded-xl border border-border bg-card">
          <Calendar className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium mb-1">Your agenda is empty</p>
          <p className="text-sm text-muted-foreground">Book a lesson, enroll in a course, or grab event tickets to see them here.</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <a href="/discover/courses" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Browse Courses</a>
            <a href="/discover/teachers" className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">Find a Teacher</a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                <Calendar className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Your Agenda</h2>
              </div>

              {todayItems.length > 0 ? (
                <div className="border-b border-border">
                  <div className="px-5 py-2 bg-primary/5"><span className="text-[10px] font-semibold uppercase tracking-widest text-primary">Today</span></div>
                  {todayItems.map((item) => <AgendaRow key={item.id} item={item} />)}
                </div>
              ) : null}

              <div className="px-5 py-2 bg-muted/20"><span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Upcoming</span></div>
              {upcomingItems.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing upcoming — your agenda is clear</div>
              ) : (
                upcomingItems.map((item) => <AgendaRow key={item.id} item={item} />)
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border"><Sparkles className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">Recent Evaluations</h3></div>
              {evaluations.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No evaluations yet</div>
              ) : (
                <div className="divide-y divide-border">
                  {evaluations.slice(0, 5).map((ev) => (
                    <div key={ev.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{getFieldValue(ev, 'Category')}</span>
                        <span className={cn('text-xs font-bold tabular-nums px-2 py-0.5 rounded-full', (getFieldNumber(ev, 'Score') ?? 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400' : (getFieldNumber(ev, 'Score') ?? 0) >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-destructive/10 text-destructive')}>{getFieldNumber(ev, 'Score') ?? '—'}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{getFieldValue(ev, 'AI Notes')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border"><TrendingUp className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">Course Progress</h3></div>
              {enrollments.filter((e) => getFieldValue(e, 'Status') === 'Active').length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No active courses</div>
              ) : (
                <div className="divide-y divide-border">
                  {enrollments.filter((e) => getFieldValue(e, 'Status') === 'Active').slice(0, 4).map((en) => {
                    const pct = getFieldNumber(en, 'Progress %') ?? 0;
                    return (
                      <div key={en.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium truncate">{getFieldValue(en, 'Course')}</span>
                          <span className="text-xs font-medium tabular-nums">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgendaRow({ item }: { item: AgendaItem }) {
  const typeColors = { lesson: 'bg-blue-500/10 text-blue-400 border-blue-500/20', course: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', event: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  const typeIcons = { lesson: Music, course: GraduationCap, event: Ticket };
  const Icon = typeIcons[item.type];

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-b-0">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border', typeColors[item.type])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-medium tabular-nums">{formatDateShort(item.date)}</p>
        <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1"><Clock className="w-2.5 h-2.5" />{formatTime(item.date)}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
        <div><p className="text-xs text-muted-foreground font-medium">{label}</p><p className="text-lg font-bold tracking-tight tabular-nums">{value}</p></div>
      </div>
    </div>
  );
}

function formatDateShort(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  try { return date.toLocaleDateString('en-CH', { day: 'numeric', month: 'short' }); } catch { return ''; }
}

function formatTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  try { return date.toLocaleTimeString('en-CH', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-40 bg-muted rounded mb-2" /><div className="h-4 w-64 bg-muted rounded mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-20 bg-muted rounded-xl" />))}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-muted rounded-xl" />
        <div className="space-y-6"><div className="h-48 bg-muted rounded-xl" /><div className="h-48 bg-muted rounded-xl" /></div>
      </div>
    </div>
  );
}

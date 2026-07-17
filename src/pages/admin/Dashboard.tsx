import { useState, useEffect } from 'react';
import { TrendingUp, Users, BookOpen, CalendarDays, Ticket, Flame, Star, Sparkles, ChevronRight, CreditCard } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [data, setData] = useState<{
    students: GenesisNode[]; teachers: GenesisNode[]; courses: GenesisNode[];
    bookings: GenesisNode[]; events: GenesisNode[]; evaluations: GenesisNode[];
    payments: GenesisNode[]; profiles: GenesisNode[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getNodes(PROJECTS.students), getNodes(PROJECTS.teachers), getNodes(PROJECTS.courses),
      getNodes(PROJECTS.bookings), getNodes(PROJECTS.events), getNodes(PROJECTS.evaluations),
      getNodes(PROJECTS.payments), getNodes(PROJECTS.userProfiles),
    ]).then(([students, teachers, courses, bookings, events, evaluations, payments, profiles]) => {
      setData({ students, teachers, courses, bookings, events, evaluations, payments, profiles });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const totalXp = data.students.reduce((s, st) => s + (getFieldNumber(st, 'XP Points') ?? 0), 0);
  const totalRevenue = data.payments.filter((p) => getFieldValue(p, 'Payment Status') === 'Completed').reduce((s, p) => s + (getFieldNumber(p, 'Amount (CHF)') ?? 0), 0);
  const avgStreak = data.students.length > 0 ? Math.round(data.students.reduce((s, st) => s + (getFieldNumber(st, 'Daily Streak') ?? 0), 0) / data.students.length) : 0;

  const upcomingBookings = data.bookings.filter((b) => {
    const s = getFieldValue(b, 'Status');
    return s === 'Confirmed' || s === 'Scheduled';
  }).slice(0, 4);

  const recentEvals = data.evaluations
    .filter((e) => getFieldValue(e, 'Evaluated Role') !== null)
    .sort((a, b) => (getFieldValue(b, 'Evaluation Date') ?? '').localeCompare(getFieldValue(a, 'Evaluation Date') ?? ''))
    .slice(0, 4);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Full platform overview</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Students" value={data.students.length} />
        <StatCard icon={Star} label="Teachers" value={data.teachers.length} />
        <StatCard icon={BookOpen} label="Courses" value={data.courses.filter((c) => getFieldValue(c, 'Status') === 'Published').length} />
        <StatCard icon={CalendarDays} label="Bookings" value={data.bookings.length} />
        <StatCard icon={Ticket} label="Events" value={data.events.filter((e) => getFieldValue(e, 'Status') === 'Upcoming').length} />
        <StatCard icon={TrendingUp} label="Total XP" value={totalXp.toLocaleString()} />
        <StatCard icon={Flame} label="Avg Streak" value={`${avgStreak} days`} />
        <StatCard icon={CreditCard} label="Revenue" value={`CHF ${totalRevenue.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Recent Evaluations" icon={Sparkles}>
          {recentEvals.length === 0 ? <Empty text="No evaluations" /> : recentEvals.map((ev) => (
            <div key={ev.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{getFieldValue(ev, 'User')}</span>
                <span className={cn('text-xs font-bold tabular-nums px-2 py-0.5 rounded-full', (getFieldNumber(ev, 'Score') ?? 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400' : (getFieldNumber(ev, 'Score') ?? 0) >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-destructive/10 text-destructive')}>{getFieldNumber(ev, 'Score') ?? ''}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{getFieldValue(ev, 'Category')} · {getFieldValue(ev, 'Evaluated Role')}</p>
            </div>
          ))}
        </Panel>

        <Panel title="Upcoming Lessons" icon={CalendarDays}>
          {upcomingBookings.length === 0 ? <Empty text="No upcoming lessons" /> : upcomingBookings.map((bk) => (
            <div key={bk.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
              <span className="text-sm font-medium">{getFieldValue(bk, 'Student')} ’ {getFieldValue(bk, 'Teacher')}</span>
              <p className="text-xs text-muted-foreground">{getFieldValue(bk, 'Instrument')} · {formatDate(getFieldValue(bk, 'Date & Time'))}</p>
            </div>
          ))}
        </Panel>

        <Panel title="Recent Payments" icon={CreditCard}>
          {data.payments.slice(0, 4).map((p) => (
            <div key={p.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{getFieldValue(p, 'User')}</span>
                <span className="text-sm font-bold text-primary tabular-nums">CHF {getFieldNumber(p, 'Amount (CHF)')}</span>
              </div>
              <p className="text-xs text-muted-foreground">{getFieldValue(p, 'Type')} · {getFieldValue(p, 'Payment Status')}</p>
            </div>
          ))}
          {data.payments.length === 0 && <Empty text="No payments recorded" />}
        </Panel>
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

function Panel({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border"><Icon className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">{title}</h3></div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-4 py-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function formatDate(d: string | null): string {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-CH', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-40 bg-muted rounded mb-2" /><div className="h-4 w-64 bg-muted rounded mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-24 bg-muted rounded-xl" />))}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-48 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

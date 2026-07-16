import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  BookOpen,
  CalendarDays,
  Ticket,
  Flame,
  Star,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

interface DashboardData {
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  bookingCount: number;
  eventCount: number;
  totalXp: number;
  avgStreak: number;
  recentEvals: GenesisNode[];
  upcomingBookings: GenesisNode[];
  upcomingEvents: GenesisNode[];
}

async function fetchDashboardData(): Promise<DashboardData> {
  const [students, teachers, courses, bookings, events, evals] = await Promise.all([
    getNodes(PROJECTS.students),
    getNodes(PROJECTS.teachers),
    getNodes(PROJECTS.courses),
    getNodes(PROJECTS.bookings),
    getNodes(PROJECTS.events),
    getNodes(PROJECTS.evaluations),
  ]);

  const totalXp = students.reduce((sum, s) => sum + (getFieldNumber(s, 'XP Points') ?? 0), 0);
  const streaks = students.map((s) => getFieldNumber(s, 'Daily Streak') ?? 0);
  const avgStreak = streaks.length > 0
    ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length)
    : 0;

  const recentEvals = evals
    .filter((e) => getFieldValue(e, 'Evaluated Role') !== null)
    .sort((a, b) => {
      const da = getFieldValue(a, 'Evaluation Date') ?? '';
      const db = getFieldValue(b, 'Evaluation Date') ?? '';
      return db.localeCompare(da);
    })
    .slice(0, 3);

  const upcomingBookings = bookings
    .filter((b) => {
      const status = getFieldValue(b, 'Status');
      return status === 'Confirmed' || status === 'Scheduled';
    })
    .slice(0, 3);

  const upcomingEvents = events
    .filter((e) => getFieldValue(e, 'Status') === 'Upcoming')
    .slice(0, 3);

  return {
    studentCount: students.length,
    teacherCount: teachers.length,
    courseCount: courses.filter((c) => getFieldValue(c, 'Status') === 'Published').length,
    bookingCount: bookings.length,
    eventCount: upcomingEvents.length + events.filter((e) => getFieldValue(e, 'Status') === 'Upcoming').length,
    totalXp,
    avgStreak,
    recentEvals,
    upcomingBookings,
    upcomingEvents,
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">Could not load dashboard</h2>
          <p className="text-muted-foreground mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your music education platform at a glance</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Students" value={data.studentCount} trend="active" />
        <StatCard icon={Star} label="Teachers" value={data.teacherCount} trend="active" />
        <StatCard icon={BookOpen} label="Courses" value={data.courseCount} trend="published" />
        <StatCard icon={CalendarDays} label="Bookings" value={data.bookingCount} trend="total" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Ticket}
          label="Upcoming Events"
          value={data.eventCount}
          trend="upcoming"
        />
        <StatCard icon={TrendingUp} label="Total XP" value={data.totalXp.toLocaleString()} trend="earned" />
        <StatCard icon={Flame} label="Avg Streak" value={`${data.avgStreak} days`} trend="streak" />
        <StatCard icon={Sparkles} label="Evaluations" value={data.recentEvals.length} trend="recent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Recent Evaluations" icon={Sparkles}>
          {data.recentEvals.length === 0 ? (
            <EmptyState text="No evaluations yet" />
          ) : (
            data.recentEvals.map((ev) => (
              <EvalRow key={ev.id} node={ev} />
            ))
          )}
        </Panel>

        <Panel title="Upcoming Lessons" icon={CalendarDays}>
          {data.upcomingBookings.length === 0 ? (
            <EmptyState text="No upcoming lessons" />
          ) : (
            data.upcomingBookings.map((bk) => (
              <BookingRow key={bk.id} node={bk} />
            ))
          )}
        </Panel>

        <Panel title="Upcoming Events" icon={Ticket}>
          {data.upcomingEvents.length === 0 ? (
            <EmptyState text="No upcoming events" />
          ) : (
            data.upcomingEvents.map((ev) => (
              <EventRow key={ev.id} node={ev} />
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trend: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-lg font-bold tracking-tight tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-4 py-8 text-center text-sm text-muted-foreground">{text}</div>
  );
}

function EvalRow({ node }: { node: GenesisNode }) {
  const user = getFieldValue(node, 'User') ?? 'Unknown';
  const score = getFieldNumber(node, 'Score');
  const cat = getFieldValue(node, 'Category') ?? '';
  const notes = getFieldValue(node, 'AI Notes') ?? '';

  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{user}</span>
        <span className={cn(
          'text-xs font-bold tabular-nums px-2 py-0.5 rounded-full',
          (score ?? 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
          (score ?? 0) >= 50 ? 'bg-amber-500/10 text-amber-400' :
          'bg-destructive/10 text-destructive',
        )}>
          {score ?? '—'}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{cat}</p>
      <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{notes}</p>
    </div>
  );
}

function BookingRow({ node }: { node: GenesisNode }) {
  const student = getFieldValue(node, 'Student') ?? 'Unknown';
  const teacher = getFieldValue(node, 'Teacher') ?? '';
  const date = getFieldValue(node, 'Date & Time') ?? '';
  const inst = getFieldValue(node, 'Instrument') ?? '';

  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{student}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        {teacher} · {inst}
      </p>
      <p className="text-xs text-muted-foreground/70">{formatDate(date)}</p>
    </div>
  );
}

function EventRow({ node }: { node: GenesisNode }) {
  const title = getFieldValue(node, 'Title') ?? node.title ?? 'Untitled';
  const venue = getFieldValue(node, 'Venue') ?? '';
  const date = getFieldValue(node, 'Date & Time') ?? '';
  const cat = getFieldValue(node, 'Category') ?? '';

  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <span className="text-sm font-medium truncate block">{title}</span>
      <p className="text-xs text-muted-foreground mt-0.5">
        {cat}{venue ? ` · ${venue}` : ''}
      </p>
      <p className="text-xs text-muted-foreground/70">{formatDate(date)}</p>
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-CH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-40 bg-muted rounded mb-2" />
      <div className="h-4 w-64 bg-muted rounded mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
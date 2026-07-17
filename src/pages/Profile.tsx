import { useState, useEffect } from 'react';
import {
  UserCircle,
  Flame,
  TrendingUp,
  Award,
  Music,
  GraduationCap,
  Star,
  Sparkles,
  BookOpen,
  CreditCard,
} from 'lucide-react';
import type { GenesisNode } from '@/lib/genesis-data';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { cn } from '@/lib/utils';

interface ProfileData {
  student: GenesisNode | null;
  evaluations: GenesisNode[];
  enrollments: GenesisNode[];
  payments: GenesisNode[];
  bookings: GenesisNode[];
}

export default function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getNodes(PROJECTS.students),
      getNodes(PROJECTS.evaluations),
      getNodes(PROJECTS.enrollments),
      getNodes(PROJECTS.payments),
      getNodes(PROJECTS.bookings),
    ])
      .then(([students, evaluations, enrollments, payments, bookings]) => {
        setData({
          student: students[0] ?? null,
          evaluations,
          enrollments,
          payments,
          bookings: bookings.filter((b) => getFieldValue(b, 'Status') === 'Confirmed' || getFieldValue(b, 'Status') === 'Scheduled'),
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;
  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">Could not load profile</h2>
          <p className="text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.student) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <UserCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">No profile found</h2>
          <p className="text-muted-foreground mt-2">Add a student profile to get started</p>
        </div>
      </div>
    );
  }

  const student = data.student;
  const name = getFieldValue(student, 'Title') ?? student.title ?? 'Student';
  const email = getFieldValue(student, 'Email') ?? '';
  const instrument = getFieldValue(student, 'Instrument') ?? '';
  const skill = getFieldValue(student, 'Skill Level') ?? '';
  const xp = getFieldNumber(student, 'XP Points') ?? 0;
  const streak = getFieldNumber(student, 'Daily Streak') ?? 0;
  const membership = getFieldValue(student, 'Membership') ?? 'Free';

  const avgScore = data.evaluations.length > 0
    ? Math.round(data.evaluations.reduce((sum, e) => sum + (getFieldNumber(e, 'Score') ?? 0), 0) / data.evaluations.length)
    : 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Your musical journey and growth</p>
      </header>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <UserCircle className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold">{name}</h2>
            <p className="text-sm text-muted-foreground">{email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge icon={Music} label={instrument} />
              <Badge icon={GraduationCap} label={skill} />
              <Badge icon={CreditCard} label={membership} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricBadge icon={TrendingUp} label="Total XP" value={xp.toLocaleString()} />
        <MetricBadge icon={Flame} label="Day Streak" value={`${streak}`} />
        <MetricBadge icon={Star} label="Avg Score" value={`${avgScore}%`} />
        <MetricBadge icon={Award} label="Evaluations" value={`${data.evaluations.length}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Recent Evaluations</h3>
          </div>
          <div className="divide-y divide-border">
            {data.evaluations.slice(0, 5).map((ev) => (
              <EvalItem key={ev.id} node={ev} />
            ))}
            {data.evaluations.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No evaluations yet</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Course Progress</h3>
          </div>
          <div className="divide-y divide-border">
            {data.enrollments.slice(0, 5).map((en) => (
              <EnrollmentItem key={en.id} node={en} />
            ))}
            {data.enrollments.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No enrollments yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function MetricBadge({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function EvalItem({ node }: { node: GenesisNode }) {
  const cat = getFieldValue(node, 'Category') ?? '';
  const score = getFieldNumber(node, 'Score');
  const date = getFieldValue(node, 'Evaluation Date') ?? '';
  const notes = getFieldValue(node, 'AI Notes') ?? '';

  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{cat}</span>
        <span className={cn(
          'text-xs font-bold tabular-nums px-2 py-0.5 rounded-full',
          (score ?? 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
          (score ?? 0) >= 50 ? 'bg-amber-500/10 text-amber-400' :
          'bg-destructive/10 text-destructive',
        )}>
          {score ?? ''}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notes}</p>
      <p className="text-xs text-muted-foreground/70 mt-0.5">{formatDate(date)}</p>
    </div>
  );
}

function EnrollmentItem({ node }: { node: GenesisNode }) {
  const course = getFieldValue(node, 'Course') ?? 'Unknown';
  const progress = getFieldNumber(node, 'Progress %') ?? 0;
  const status = getFieldValue(node, 'Status') ?? '';

  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium truncate">{course}</span>
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
          status === 'Active' ? 'bg-blue-500/10 text-blue-400' :
          'bg-muted text-muted-foreground',
        )}>
          {status}
        </span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-CH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function PageSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" />
      <div className="h-4 w-40 bg-muted rounded mb-8" />
      <div className="h-24 bg-muted rounded-xl mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}

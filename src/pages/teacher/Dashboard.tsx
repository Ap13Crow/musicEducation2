import { useState, useEffect } from 'react';
import { Users, CalendarDays, BookOpen, Star, Sparkles, TrendingUp } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

export default function TeacherDashboard() {
  const { profile } = useCurrentUser();
  const [data, setData] = useState<{
    myStudents: GenesisNode[];
    myBookings: GenesisNode[];
    myCourses: GenesisNode[];
    myEvaluations: GenesisNode[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const teacherName = profile?.displayName ?? '';

  useEffect(() => {
    Promise.all([
      getNodes(PROJECTS.students),
      getNodes(PROJECTS.bookings),
      getNodes(PROJECTS.courses),
      getNodes(PROJECTS.evaluations),
    ]).then(([students, bookings, courses, evaluations]) => {
      const myBookings = bookings.filter((b) => getFieldValue(b, 'Teacher') === teacherName);
      const myCourseNames = courses.filter((c) => getFieldValue(c, 'Instructor') === teacherName).map((c) => getFieldValue(c, 'Title') ?? c.title);
      const myEvaluations = evaluations.filter((e) => {
        const user = getFieldValue(e, 'User') ?? '';
        const evalRole = getFieldValue(e, 'Evaluated Role') ?? '';
        return myBookings.some((bk) => getFieldValue(bk, 'Student') === user) || evalRole === 'Teacher';
      });

      setData({
        myStudents: students.filter((s) => {
          const name = getFieldValue(s, 'Title') ?? s.title ?? '';
          return myBookings.some((bk) => getFieldValue(bk, 'Student') === name);
        }),
        myBookings,
        myCourses: courses.filter((c) => getFieldValue(c, 'Instructor') === teacherName),
        myEvaluations,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [teacherName]);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const upcomingLessons = data.myBookings.filter((b) => {
    const s = getFieldValue(b, 'Status');
    return s === 'Scheduled' || s === 'Confirmed';
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome back, {profile?.displayName?.split(' ')[0] ?? 'Teacher'}</h1>
        <p className="text-muted-foreground mt-1">Your teaching studio at a glance</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Active Students" value={data.myStudents.length} />
        <StatCard icon={CalendarDays} label="Upcoming Lessons" value={upcomingLessons.length} />
        <StatCard icon={BookOpen} label="Your Courses" value={data.myCourses.length} />
        <StatCard icon={Star} label="Evaluations Given" value={data.myEvaluations.filter((e) => getFieldValue(e, 'Evaluated Role') === 'Student').length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="My Students" icon={Users}>
          {data.myStudents.length === 0 ? <Empty text="No students yet" /> : (
            data.myStudents.map((s) => {
              const name = getFieldValue(s, 'Title') ?? s.title ?? '';
              const inst = getFieldValue(s, 'Instrument') ?? '';
              const skill = getFieldValue(s, 'Skill Level') ?? '';
              return (
                <div key={s.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium">{name}</span>
                  <p className="text-xs text-muted-foreground">{inst} · {skill}</p>
                </div>
              );
            })
          )}
        </Panel>

        <Panel title="Upcoming Lessons" icon={CalendarDays}>
          {upcomingLessons.length === 0 ? <Empty text="No upcoming lessons" /> : (
            upcomingLessons.slice(0, 5).map((bk) => (
              <div key={bk.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                <span className="text-sm font-medium block">{getFieldValue(bk, 'Student')}</span>
                <p className="text-xs text-muted-foreground">{getFieldValue(bk, 'Instrument')} · {formatDate(getFieldValue(bk, 'Date & Time'))}</p>
              </div>
            ))
          )}
        </Panel>

        <Panel title="Recent Evaluations" icon={Sparkles}>
          {data.myEvaluations.length === 0 ? <Empty text="No evaluations yet" /> : (
            data.myEvaluations.slice(0, 5).map((ev) => (
              <div key={ev.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{getFieldValue(ev, 'User')}</span>
                  <span className={cn('text-xs font-bold tabular-nums px-2 py-0.5 rounded-full', (getFieldNumber(ev, 'Score') ?? 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400' : (getFieldNumber(ev, 'Score') ?? 0) >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-destructive/10 text-destructive')}>{getFieldNumber(ev, 'Score') ?? ''}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{getFieldValue(ev, 'Category')}</p>
              </div>
            ))
          )}
        </Panel>

        <Panel title="Your Courses" icon={BookOpen}>
          {data.myCourses.length === 0 ? <Empty text="No courses yet" /> : (
            data.myCourses.map((c) => (
              <div key={c.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                <span className="text-sm font-medium block">{getFieldValue(c, 'Title') ?? c.title}</span>
                <p className="text-xs text-muted-foreground">{getFieldValue(c, 'Difficulty')} · {getFieldNumber(c, 'Duration (Weeks)')} weeks</p>
              </div>
            ))
          )}
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
      <div className="h-8 w-40 bg-muted rounded mb-2" /><div className="h-4 w-48 bg-muted rounded mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-24 bg-muted rounded-xl" />))}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-48 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

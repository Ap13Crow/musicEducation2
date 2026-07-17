import { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { UserCircle, Star, Music, GraduationCap, Award, TrendingUp, BookOpen, CalendarDays, ExternalLink } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';

const CALENDAR_EMBED_URL = 'https://calendar.google.com/calendar/embed?src=students%40mymusic.coach&ctz=Europe%2FZurich';
const BOOKING_PAGE_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1bGpBEQ8NiKUV-E5uO3DFGk1HzmQSfQk0uVGnUQe8gqhd8g_iv5vrEcrMaVqgT0XQsAyAfjBl-';

export default function TeacherProfile() {
  const { profile } = useCurrentUser();
  const [data, setData] = useState<{ myBookings: GenesisNode[]; myCourses: GenesisNode[]; myEvaluations: GenesisNode[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const teacherName = profile?.displayName ?? '';

  useEffect(() => {
    Promise.all([getNodes(PROJECTS.bookings), getNodes(PROJECTS.courses), getNodes(PROJECTS.evaluations)]).then(([bookings, courses, evaluations]) => {
      const myBookings = bookings.filter((b) => getFieldValue(b, 'Teacher') === teacherName);
      const myCourses = courses.filter((c) => getFieldValue(c, 'Instructor') === teacherName);
      const myEvaluations = evaluations.filter((e) => {
        const user = getFieldValue(e, 'User') ?? '';
        return myBookings.some((bk) => getFieldValue(bk, 'Student') === user) || getFieldValue(e, 'Evaluated Role') === 'Teacher';
      });
      setData({ myBookings, myCourses, myEvaluations });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [teacherName]);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const completedLessons = data.myBookings.filter((b) => getFieldValue(b, 'Status') === 'Completed').length;
  const avgScore = data.myEvaluations.length > 0
    ? Math.round(data.myEvaluations.reduce((s, e) => s + (getFieldNumber(e, 'Score') ?? 0), 0) / data.myEvaluations.length)
    : 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Your teaching portfolio</p>
      </header>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <UserCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.displayName}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground"><Music className="w-3 h-3" />{profile?.instrument}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground"><GraduationCap className="w-3 h-3" />Teacher</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricBadge icon={BookOpen} label="Courses" value={`${data.myCourses.length}`} />
        <MetricBadge icon={CalendarDays} label="Lessons Taught" value={`${completedLessons}`} />
        <MetricBadge icon={Star} label="Avg Student Score" value={`${avgScore}%`} />
        <MetricBadge icon={Award} label="Evaluations" value={`${data.myEvaluations.length}`} />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Star className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Recent Student Evaluations</h3>
        </div>
        <div className="divide-y divide-border">
          {data.myEvaluations.filter((e) => getFieldValue(e, 'Evaluated Role') === 'Student').slice(0, 8).map((ev) => (
            <div key={ev.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{getFieldValue(ev, 'User')}</span>
                <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${(getFieldNumber(ev, 'Score') ?? 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400' : (getFieldNumber(ev, 'Score') ?? 0) >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-destructive/10 text-destructive'}`}>{getFieldNumber(ev, 'Score') ?? ''}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{getFieldValue(ev, 'Category')} · {getFieldValue(ev, 'AI Notes')}</p>
            </div>
          ))}
          {data.myEvaluations.filter((e) => getFieldValue(e, 'Evaluated Role') === 'Student').length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No evaluations yet</div>}
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mt-6">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Studio Calendar</h3>
          <span className="text-xs text-muted-foreground ml-auto">students@mymusic.coach</span>
        </div>
        <iframe
          src={CALENDAR_EMBED_URL}
          className="w-full border-0"
          style={{ height: '500px' }}
          title="Studio Calendar"
        />
      </div>

      {/* Booking Page */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mt-6">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Your Booking Page</h3>
          <a
            href={BOOKING_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <iframe
          src={BOOKING_PAGE_URL}
          className="w-full border-0"
          style={{ height: '700px' }}
          title="Booking Page"
        />
      </div>
    </div>
  );
}

function MetricBadge({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" /><div className="h-24 bg-muted rounded-xl mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-20 bg-muted rounded-xl" />))}</div>
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  );
}

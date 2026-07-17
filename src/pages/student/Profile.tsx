import { useState, useEffect } from 'react';
import { UserCircle, Flame, TrendingUp, Star, Music, GraduationCap, Sparkles, BookOpen, CreditCard, Award, ArrowUpCircle, CalendarDays, Bookmark, Library, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getSession } from '@/lib/auth';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

const CALENDAR_EMBED_URL = 'https://calendar.google.com/calendar/embed?src=students%40mymusic.coach&ctz=Europe%2FZurich';

export default function StudentProfile() {
  const { profile } = useCurrentUser();
  const [data, setData] = useState<{
    evaluations: GenesisNode[];
    enrollments: GenesisNode[];
    bookings: GenesisNode[];
    userScores: GenesisNode[];
    musicScores: GenesisNode[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const studentName = profile?.displayName ?? 'Student';

  useEffect(() => {
    Promise.all([
      getNodes(PROJECTS.evaluations),
      getNodes(PROJECTS.enrollments),
      getNodes(PROJECTS.bookings),
      getNodes(PROJECTS.userScores),
      getNodes(PROJECTS.musicScores),
    ]).then(([evaluations, enrollments, bookings, userScores, musicScores]) => {
      setData({
        evaluations: evaluations.filter((e) => getFieldValue(e, 'User') === studentName),
        enrollments: enrollments.filter((e) => getFieldValue(e, 'Student') === studentName),
        bookings: bookings.filter((b) => getFieldValue(b, 'Student') === studentName),
        userScores: userScores.filter((s) => getFieldValue(s, 'User') === studentName),
        musicScores,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [studentName]);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const avgScore = data.evaluations.length > 0
    ? Math.round(data.evaluations.reduce((s, e) => s + (getFieldNumber(e, 'Score') ?? 0), 0) / data.evaluations.length)
    : 0;
  const completedEvals = data.evaluations.length;
  const totalLessons = data.bookings.filter((b) => getFieldValue(b, 'Status') === 'Completed').length;

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
            <h2 className="text-xl font-bold">{profile?.displayName}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge icon={Music} label={profile?.instrument ?? ''} />
              <Badge icon={GraduationCap} label={profile?.skillLevel ?? ''} />
              <Badge icon={CreditCard} label="Student" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricBadge icon={Star} label="Avg Score" value={`${avgScore}%`} />
        <MetricBadge icon={Award} label="Evaluations" value={`${completedEvals}`} />
        <MetricBadge icon={BookOpen} label="Courses" value={`${data.enrollments.length}`} />
        <MetricBadge icon={Flame} label="Lessons Done" value={`${totalLessons}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Recent Evaluations</h3>
          </div>
          <div className="divide-y divide-border">
            {data.evaluations.slice(0, 5).map((ev) => (
              <div key={ev.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{getFieldValue(ev, 'Category')}</span>
                  <span className={cn('text-xs font-bold tabular-nums px-2 py-0.5 rounded-full', (getFieldNumber(ev, 'Score') ?? 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400' : (getFieldNumber(ev, 'Score') ?? 0) >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-destructive/10 text-destructive')}>{getFieldNumber(ev, 'Score') ?? ''}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{getFieldValue(ev, 'AI Notes')}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{formatDate(getFieldValue(ev, 'Evaluation Date'))}</p>
              </div>
            ))}
            {data.evaluations.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No evaluations yet</div>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Course Progress</h3>
          </div>
          <div className="divide-y divide-border">
            {data.enrollments.slice(0, 5).map((en) => {
              const pct = getFieldNumber(en, 'Progress %') ?? 0;
              return (
                <div key={en.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium truncate">{getFieldValue(en, 'Course')}</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getFieldValue(en, 'Status') === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400')}>{getFieldValue(en, 'Status')}</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>
                  <p className="text-xs text-muted-foreground mt-1">{pct}% complete</p>
                </div>
              );
            })}
            {data.enrollments.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No enrollments yet</div>}
          </div>
        </div>
      </div>

      <SavedScoresSection userScores={data.userScores} musicScores={data.musicScores} />

      {(() => {
        const oidcRole = profile?.role ?? '';
        const emailSession = getSession();
        const emailRole = (emailSession != null && typeof emailSession === 'object' && 'role' in emailSession) ? (emailSession as { role: string }).role.toLowerCase() : '';
        const role = oidcRole || emailRole;
        const showCalendar = role === 'admin' || role === 'teacher' || role === 'moderator';
        return showCalendar ? <CalendarSection /> : null;
      })()}

      <TeacherApplicationSection />
    </div>
  );
}

function Badge({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
      <Icon className="w-3 h-3" />{label}
    </span>
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

function formatDate(d: string | null): string {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-CH', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" /><div className="h-4 w-40 bg-muted rounded mb-8" />
      <div className="h-24 bg-muted rounded-xl mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-20 bg-muted rounded-xl" />))}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{Array.from({ length: 2 }).map((_, i) => (<div key={i} className="h-64 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

function CalendarSection() {
  return (
    <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <CalendarDays className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">My Music Coach Calendar</h3>
        <span className="text-xs text-muted-foreground ml-auto">students@mymusic.coach</span>
      </div>
      <iframe
        src={CALENDAR_EMBED_URL}
        className="w-full border-0"
        style={{ height: '600px' }}
        title="My Music Coach Google Calendar"
      />
    </div>
  );
}

function TeacherApplicationSection() {
  const navigate = useNavigate();

  return (
    <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <ArrowUpCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">Interested in teaching?</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Share your expertise with students. Apply to become a teacher on My Music Coach - your profile, calendar, and booking system will be set up automatically.
            </p>
            <button
              onClick={() => navigate('/teacher-application')}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              Start Teacher Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SavedScoresSection({ userScores, musicScores }: { userScores: GenesisNode[]; musicScores: GenesisNode[] }) {
  if (userScores.length === 0) return null;

  const scoreDetails = userScores.map((us) => {
    const scoreTitle = getFieldValue(us, 'Score Title') ?? '';
    const ms = musicScores.find((s) => (getFieldValue(s, 'Title') ?? '') === scoreTitle || s.title === scoreTitle);
    return {
      id: us.id,
      title: scoreTitle,
      composer: ms ? (getFieldValue(ms, 'Composer') ?? '') : (getFieldValue(us, 'Notes') ?? ''),
      instrument: ms ? (getFieldValue(ms, 'Instrument') ?? '') : '',
      era: ms ? (getFieldValue(ms, 'Era') ?? '') : '',
      difficulty: ms ? (getFieldValue(ms, 'Difficulty') ?? '') : '',
      imslpUrl: ms ? (getFieldValue(ms, 'IMSLP URL') ?? '') : '',
      addedDate: getFieldValue(us, 'Added Date') ?? '',
    };
  });

  return (
    <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Bookmark className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Personal Database</h3>
        <span className="text-xs text-muted-foreground ml-auto">{userScores.length} saved {userScores.length === 1 ? 'score' : 'scores'}</span>
      </div>
      <div className="divide-y divide-border">
        {scoreDetails.map((sc) => (
          <div key={sc.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{sc.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{sc.composer}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sc.era && <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground">{sc.era}</span>}
                  {sc.difficulty && <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground">{sc.difficulty}</span>}
                  {sc.instrument && <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground">{sc.instrument}</span>}
                </div>
              </div>
              {sc.imslpUrl && (
                <a
                  href={sc.imslpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  View
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Users, Music, TrendingUp, Star, GraduationCap, Flame } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';

export default function TeacherStudents() {
  const { profile } = useCurrentUser();
  const [students, setStudents] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);

  const teacherName = profile?.displayName ?? '';

  useEffect(() => {
    Promise.all([getNodes(PROJECTS.students), getNodes(PROJECTS.bookings)]).then(([allStudents, bookings]) => {
      const myStudentNames = new Set(
        bookings.filter((b) => getFieldValue(b, 'Teacher') === teacherName).map((b) => getFieldValue(b, 'Student')).filter(Boolean)
      );
      setStudents(allStudents.filter((s) => myStudentNames.has(getFieldValue(s, 'Title') ?? s.title ?? '')));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [teacherName]);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My Students</h1>
        <p className="text-muted-foreground mt-1">{students.length} active student{students.length !== 1 ? 's' : ''}</p>
      </header>

      {students.length === 0 ? (
        <div className="text-center py-16"><Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No students yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => {
            const name = getFieldValue(s, 'Title') ?? s.title ?? '';
            const instrument = getFieldValue(s, 'Instrument') ?? '';
            const skill = getFieldValue(s, 'Skill Level') ?? '';
            const xp = getFieldNumber(s, 'XP Points') ?? 0;
            const streak = getFieldNumber(s, 'Daily Streak') ?? 0;

            return (
              <div key={s.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{name}</h3>
                    <p className="text-xs text-muted-foreground">{instrument} · {skill}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-sm font-bold tabular-nums">{xp.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <Flame className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-sm font-bold tabular-nums">{streak}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
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

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" /><div className="h-4 w-48 bg-muted rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-40 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

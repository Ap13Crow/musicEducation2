import { useState, useEffect } from 'react';
import { Users, Music, Flame, TrendingUp } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';

export default function AdminStudents() {
  const [students, setStudents] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNodes(PROJECTS.students).then(setStudents).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground mt-1">{students.length} registered student{students.length !== 1 ? 's' : ''}</p>
      </header>

      {students.length === 0 ? (
        <div className="text-center py-16"><Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No students registered</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => {
            const name = getFieldValue(s, 'Title') ?? s.title ?? '';
            const inst = getFieldValue(s, 'Instrument') ?? '';
            const skill = getFieldValue(s, 'Skill Level') ?? '';
            const xp = getFieldNumber(s, 'XP Points') ?? 0;
            const streak = getFieldNumber(s, 'Daily Streak') ?? 0;
            const membership = getFieldValue(s, 'Membership') ?? '';

            return (
              <div key={s.id} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold mb-2">{name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{inst} · {skill} · {membership}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-sm font-bold tabular-nums">{xp.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-32 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

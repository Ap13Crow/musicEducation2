import { useState, useEffect } from 'react';
import { GraduationCap, Star, Music } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNodes(PROJECTS.teachers).then(setTeachers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Teachers</h1>
        <p className="text-muted-foreground mt-1">{teachers.length} registered teacher{teachers.length !== 1 ? 's' : ''}</p>
      </header>

      {teachers.length === 0 ? (
        <div className="text-center py-16"><GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No teachers registered</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t) => {
            const name = getFieldValue(t, 'Title') ?? t.title ?? '';
            const inst = getFieldValue(t, 'Instrument') ?? '';
            const spec = getFieldValue(t, 'Specialization') ?? '';
            const rating = getFieldNumber(t, 'Rating');
            const rate = getFieldNumber(t, 'Hourly Rate (CHF)');

            return (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold mb-1">{name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{inst} · {spec}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><span className="text-sm font-medium tabular-nums">{rating?.toFixed(1) ?? '—'}</span></div>
                  <span className="text-sm text-muted-foreground">CHF {rate}/hr</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-28 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

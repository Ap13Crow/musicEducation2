import { useState, useEffect } from 'react';
import { GraduationCap, Star, Music } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';

export default function PublicTeachers() {
  const [teachers, setTeachers] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNodes(PROJECTS.teachers)
      .then(setTeachers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Teachers</h1>
        <p className="text-muted-foreground mt-1">Meet our accomplished instructors</p>
      </header>

      {teachers.length === 0 ? (
        <div className="text-center py-16"><GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No teachers listed yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t) => {
            const name = getFieldValue(t, 'Title') ?? t.title ?? 'Unknown';
            const instrument = getFieldValue(t, 'Instrument') ?? '';
            const specialization = getFieldValue(t, 'Specialization') ?? '';
            const rating = getFieldNumber(t, 'Rating');
            const rate = getFieldNumber(t, 'Hourly Rate (CHF)');

            return (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Music className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{name}</h3>
                    <p className="text-sm text-muted-foreground">{instrument}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{specialization}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium tabular-nums">{rating?.toFixed(1) ?? ''}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">CHF {rate}/hr</span>
                    </div>
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

function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" /><div className="h-4 w-48 bg-muted rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-32 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

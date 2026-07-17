import { useState, useEffect } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-emerald-500/10 text-emerald-400', Intermediate: 'bg-blue-500/10 text-blue-400',
  Advanced: 'bg-amber-500/10 text-amber-400', 'All Levels': 'bg-purple-500/10 text-purple-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Music Theory': 'bg-blue-500/10 text-blue-400', Technique: 'bg-emerald-500/10 text-emerald-400',
  Repertoire: 'bg-amber-500/10 text-amber-400', 'Ear Training': 'bg-rose-500/10 text-rose-400',
  Composition: 'bg-purple-500/10 text-purple-400', 'Music History': 'bg-cyan-500/10 text-cyan-400',
};

export default function AdminCourses() {
  const [courses, setCourses] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getNodes(PROJECTS.courses).then(setCourses).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) => {
    const title = (getFieldValue(c, 'Title') ?? c.title ?? '').toLowerCase();
    return !search || title.includes(search.toLowerCase());
  });

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} · {courses.filter((c) => getFieldValue(c, 'Status') === 'Published').length} published</p>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-sm pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Course</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Difficulty</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Instructor</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Weeks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{getFieldValue(c, 'Title') ?? c.title}</td>
                <td className="px-4 py-3"><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', CATEGORY_COLORS[getFieldValue(c, 'Category') ?? ''] ?? 'bg-muted text-muted-foreground')}>{getFieldValue(c, 'Category')}</span></td>
                <td className="px-4 py-3"><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', DIFFICULTY_COLORS[getFieldValue(c, 'Difficulty') ?? ''] ?? 'bg-muted text-muted-foreground')}>{getFieldValue(c, 'Difficulty')}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{getFieldValue(c, 'Instructor')}</td>
                <td className="px-4 py-3 text-right tabular-nums">CHF {getFieldNumber(c, 'Price (CHF)')?.toFixed(0) ?? ''}</td>
                <td className="px-4 py-3 text-right tabular-nums">{getFieldNumber(c, 'Duration (Weeks)')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" /><div className="h-4 w-48 bg-muted rounded mb-8" />
      <div className="h-10 w-64 bg-muted rounded-lg mb-6" />
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  );
}

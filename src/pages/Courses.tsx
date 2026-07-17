import { useState, useEffect } from 'react';
import { BookOpen, Clock, GraduationCap, User, Search } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-emerald-500/10 text-emerald-400',
  Intermediate: 'bg-blue-500/10 text-blue-400',
  Advanced: 'bg-amber-500/10 text-amber-400',
  'All Levels': 'bg-purple-500/10 text-purple-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Music Theory': 'bg-blue-500/10 text-blue-400',
  'Technique': 'bg-emerald-500/10 text-emerald-400',
  'Repertoire': 'bg-amber-500/10 text-amber-400',
  'Ear Training': 'bg-rose-500/10 text-rose-400',
  'Composition': 'bg-purple-500/10 text-purple-400',
  'Music History': 'bg-cyan-500/10 text-cyan-400',
};

export default function Courses() {
  const [courses, setCourses] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    getNodes(PROJECTS.courses)
      .then((nodes) => setCourses(nodes.filter((n) => getFieldValue(n, 'Status') === 'Published')))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const difficulties = [...new Set(courses.map((c) => getFieldValue(c, 'Difficulty')).filter(Boolean))] as string[];
  const categories = [...new Set(courses.map((c) => getFieldValue(c, 'Category')).filter(Boolean))] as string[];

  const filtered = courses.filter((c) => {
    const title = (getFieldValue(c, 'Title') ?? c.title ?? '').toLowerCase();
    const diff = getFieldValue(c, 'Difficulty');
    const cat = getFieldValue(c, 'Category');

    const matchesSearch = !search || title.includes(search.toLowerCase());
    const matchesDiff = !difficultyFilter || diff === difficultyFilter;
    const matchesCat = !categoryFilter || cat === categoryFilter;

    return matchesSearch && matchesDiff && matchesCat;
  });

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">Could not load courses</h2>
          <p className="text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground mt-1">Master your craft with expert-led courses</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={difficultyFilter ?? ''}
          onChange={(e) => setDifficultyFilter(e.target.value || null)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Levels</option>
          {difficulties.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={categoryFilter ?? ''}
          onChange={(e) => setCategoryFilter(e.target.value || null)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No courses match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <CourseCard key={course.id} node={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ node }: { node: GenesisNode }) {
  const title = getFieldValue(node, 'Title') ?? node.title ?? 'Untitled';
  const diff = getFieldValue(node, 'Difficulty') ?? '';
  const cat = getFieldValue(node, 'Category') ?? '';
  const price = getFieldNumber(node, 'Price (CHF)');
  const weeks = getFieldNumber(node, 'Duration (Weeks)');
  const instructor = getFieldValue(node, 'Instructor') ?? '';

  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5 group">
      <div className="flex items-start gap-2 mb-3">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', CATEGORY_COLORS[cat] ?? 'bg-muted text-muted-foreground')}>
          {cat}
        </span>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', DIFFICULTY_COLORS[diff] ?? 'bg-muted text-muted-foreground')}>
          {diff}
        </span>
      </div>

      <h3 className="font-semibold text-base mb-3 leading-snug group-hover:text-primary transition-colors">
        {title}
      </h3>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          <span>{instructor}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{weeks} weeks</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>{diff}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-lg font-bold text-primary tabular-nums">
          CHF {price?.toFixed(0) ?? ''}
        </span>
        <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Enroll
        </button>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" />
      <div className="h-4 w-48 bg-muted rounded mb-8" />
      <div className="flex gap-3 mb-6">
        <div className="h-10 flex-1 bg-muted rounded-lg" />
        <div className="h-10 w-32 bg-muted rounded-lg" />
        <div className="h-10 w-32 bg-muted rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}

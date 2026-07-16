import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, BookOpen, Clock, GraduationCap, User, Sparkles, ChevronDown } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
const CATEGORY_OPTIONS = ['Music Theory', 'Technique', 'Repertoire', 'Ear Training', 'Composition', 'Music History'];

interface CourseData {
  node: GenesisNode;
  title: string;
  difficulty: string;
  category: string;
  price: number;
  weeks: number;
  instructor: string;
  description: string;
  instructorInstrument: string;
}

export default function CourseCatalog() {
  const { profile } = useCurrentUser();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [teachers, setTeachers] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const studentName = profile?.displayName ?? '';
  const studentInstrument = profile?.instrument ?? '';
  const studentSkill = profile?.skillLevel ?? '';

  useEffect(() => {
    Promise.all([getNodes(PROJECTS.courses), getNodes(PROJECTS.teachers)]).then(([courseNodes, teacherNodes]) => {
      setTeachers(teacherNodes);
      const map: CourseData[] = courseNodes
        .filter((c) => getFieldValue(c, 'Status') === 'Published')
        .map((c) => {
          const instructorName = getFieldValue(c, 'Instructor') ?? '';
          const teacher = teacherNodes.find((t) => (getFieldValue(t, 'Name') ?? t.title) === instructorName);
          return {
            node: c,
            title: getFieldValue(c, 'Title') ?? c.title ?? '',
            difficulty: getFieldValue(c, 'Difficulty') ?? '',
            category: getFieldValue(c, 'Category') ?? '',
            price: getFieldNumber(c, 'Price (CHF)') ?? 0,
            weeks: getFieldNumber(c, 'Duration (Weeks)') ?? 0,
            instructor: instructorName,
            description: getFieldValue(c, 'Description') ?? '',
            instructorInstrument: teacher ? (getFieldValue(teacher, 'Instrument') ?? '') : '',
          };
        });
      setCourses(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = courses;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q));
    }
    if (diffFilter) result = result.filter((c) => c.difficulty === diffFilter || c.difficulty === 'All Levels');
    if (catFilter) result = result.filter((c) => c.category === catFilter);
    return result;
  }, [courses, search, diffFilter, catFilter]);

  const recommended = useMemo(() => {
    if (!studentInstrument) return [];
    return courses
      .filter((c) => {
        const instMatch = c.instructorInstrument === studentInstrument;
        const skillMatch = !studentSkill || c.difficulty === studentSkill || c.difficulty === 'All Levels';
        return instMatch && skillMatch;
      })
      .slice(0, 4);
  }, [courses, studentInstrument, studentSkill]);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Discover Courses</h1>
        <p className="text-muted-foreground mt-1">{courses.length} published courses available</p>
      </header>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses, instructors, topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap', showFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/30')}
        >
          <Filter className="w-4 h-4" />
          Filters
          {(diffFilter || catFilter) ? <span className="w-1.5 h-1.5 rounded-full bg-primary" /> : null}
        </button>
      </div>

      {/* Filter Chips */}
      {showFilters ? (
        <div className="space-y-3 mb-8 p-4 rounded-xl border border-border bg-card">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Difficulty</p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button key={d} onClick={() => setDiffFilter(diffFilter === d ? null : d)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors', diffFilter === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((c) => (
                <button key={c} onClick={() => setCatFilter(catFilter === c ? null : c)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors', catFilter === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Recommendations */}
      {recommended.length > 0 ? (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-semibold">Recommended for You</h2>
            <span className="text-xs text-muted-foreground">based on your {studentInstrument} profile</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommended.map((c) => <CourseCard key={c.node.id} course={c} highlight />)}
          </div>
        </section>
      ) : null}

      {/* All Courses */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{search || diffFilter || catFilter ? `Results (${filtered.length})` : 'All Courses'}</h2>
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No courses match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => <CourseCard key={c.node.id} course={c} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function CourseCard({ course, highlight }: { course: CourseData; highlight?: boolean }) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 hover:shadow-md transition-all group', highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-border hover:border-primary/20')}>
      <span className={cn('text-[10px] font-semibold uppercase tracking-widest mb-2 block', highlight ? 'text-amber-500' : 'text-primary')}>
        {course.category}
      </span>
      <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><User className="w-3 h-3" />{course.instructor}</span>
        <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{course.difficulty}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.weeks} weeks</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-lg font-bold tabular-nums">CHF {course.price}</span>
        <button className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
          Enroll Now
        </button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-48 bg-muted rounded mb-2" /><div className="h-4 w-64 bg-muted rounded mb-6" />
      <div className="h-10 bg-muted rounded-xl mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-56 bg-muted rounded-xl" />))}
      </div>
    </div>
  );
}

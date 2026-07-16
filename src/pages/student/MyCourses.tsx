import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, GraduationCap, User } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

export default function StudentMyCourses() {
  const { profile } = useCurrentUser();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<GenesisNode[]>([]);
  const [courses, setCourses] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);

  const studentName = profile?.displayName ?? '';

  useEffect(() => {
    Promise.all([getNodes(PROJECTS.enrollments), getNodes(PROJECTS.courses)]).then(([enrs, crs]) => {
      setEnrollments(enrs.filter((e) => getFieldValue(e, 'Student') === studentName));
      setCourses(crs);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [studentName]);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-1">{enrollments.length} enrolled course{enrollments.length !== 1 ? 's' : ''}</p>
      </header>

      {enrollments.length === 0 ? (
        <div className="text-center py-16"><BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">You are not enrolled in any courses yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrollments.map((en) => {
            const courseName = getFieldValue(en, 'Course') ?? '';
            const pct = getFieldNumber(en, 'Progress %') ?? 0;
            const status = getFieldValue(en, 'Status') ?? '';
            const courseNode = courses.find((c) => (getFieldValue(c, 'Title') ?? c.title) === courseName);
            const instructor = courseNode ? getFieldValue(courseNode, 'Instructor') : '';
            const diff = courseNode ? getFieldValue(courseNode, 'Difficulty') : '';
            const weeks = courseNode ? getFieldNumber(courseNode, 'Duration (Weeks)') : null;

            return (
              <button key={en.id} onClick={() => { if (courseId) navigate(`/my-courses/${courseId}`); }} className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all text-left w-full">
                <h3 className="font-semibold text-base mb-3">{courseName}</h3>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><User className="w-3.5 h-3.5" /><span>{instructor}</span></div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><GraduationCap className="w-3.5 h-3.5" /><span>{diff}</span></div>
                  {weeks && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" /><span>{weeks} weeks</span></div>}
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">Progress</span><span className="font-medium tabular-nums">{pct}%</span></div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : status === 'Active' ? 'bg-blue-500/10 text-blue-400' : 'bg-muted text-muted-foreground')}>{status}</span>
              </button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-48 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

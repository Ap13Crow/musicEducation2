import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, GraduationCap } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';

export default function TeacherMyCourses() {
  const { profile } = useCurrentUser();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<GenesisNode[]>([]);
  const [enrollments, setEnrollments] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);

  const teacherName = profile?.displayName ?? '';

  useEffect(() => {
    Promise.all([getNodes(PROJECTS.courses), getNodes(PROJECTS.enrollments)]).then(([crs, enrs]) => {
      const myCourses = crs.filter((c) => getFieldValue(c, 'Instructor') === teacherName);
      setCourses(myCourses);
      setEnrollments(enrs.filter((e) => myCourses.some((c) => getFieldValue(c, 'Title') === getFieldValue(e, 'Course'))));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [teacherName]);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} · {enrollments.length} total enrollment{enrollments.length !== 1 ? 's' : ''}</p>
      </header>

      {courses.length === 0 ? (
        <div className="text-center py-16"><BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No courses assigned yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => {
            const title = getFieldValue(c, 'Title') ?? '';
            const diff = getFieldValue(c, 'Difficulty') ?? '';
            const weeks = getFieldNumber(c, 'Duration (Weeks)');
            const price = getFieldNumber(c, 'Price (CHF)');
            const enrolled = enrollments.filter((e) => getFieldValue(e, 'Course') === title).length;

            return (
              <button key={c.id} onClick={() => navigate(`/my-courses/${c.id}`)} className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all text-left w-full">
                <h3 className="font-semibold text-base mb-3">{title}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><GraduationCap className="w-3.5 h-3.5" /><span>{diff}</span></div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" /><span>{weeks} weeks</span></div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-lg font-bold text-primary tabular-nums">CHF {price?.toFixed(0) ?? '—'}</span>
                  <span className="text-xs text-muted-foreground">{enrolled} enrolled</span>
                </div>
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

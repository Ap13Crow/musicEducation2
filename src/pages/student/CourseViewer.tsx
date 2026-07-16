import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, FileText, Music, Clock, CheckCircle, Circle, ChevronRight, BookOpen, Video, Headphones, PenTool, HelpCircle } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

interface ModuleData { node: GenesisNode; title: string; description: string; order: number; }
interface LessonData { node: GenesisNode; title: string; content: string; moduleId: string; order: number; type: string; duration: number; mediaUrl: string; musicXmlUrl: string; }

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Video: Video, Reading: BookOpen, Assignment: PenTool,
  Quiz: HelpCircle, Practice: Music, Listening: Headphones,
};

const TYPE_LABELS: Record<string, string> = {
  Video: 'Video Lesson', Reading: 'Reading', Assignment: 'Assignment',
  Quiz: 'Quiz', Practice: 'Practice', Listening: 'Listening',
};

export default function CourseViewer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getNodes(PROJECTS.courses), getNodes(PROJECTS.courseModules),
      getNodes(PROJECTS.courseLessons)
    ]).then(([courseNodes, moduleNodes, lessonNodes]) => {
      const course = courseNodes.find(n => n.id === courseId);
      if (course) {
        setCourseTitle(getFieldValue(course, 'Title') ?? '');
        setCourseDesc(getFieldValue(course, 'Description') ?? '');
      }
      const mods: ModuleData[] = moduleNodes
        .filter(m => getFieldValue(m, 'Course') === (course ? (getFieldValue(course, 'Title') ?? '') : ''))
        .map(m => ({ node: m, title: getFieldValue(m, 'Title') ?? '', description: getFieldValue(m, 'Description') ?? '', order: getFieldNumber(m, 'Order') ?? 0 }))
        .sort((a, b) => a.order - b.order);
      setModules(mods);
      setExpandedModules(new Set(mods.length > 0 ? [mods[0].node.id] : []));

      const lns: LessonData[] = lessonNodes
        .filter(l => {
          const modTitle = getFieldValue(l, 'Module') ?? '';
          return mods.some(m => m.title === modTitle);
        })
        .map(l => ({
          node: l, title: getFieldValue(l, 'Title') ?? '', content: getFieldValue(l, 'Content') ?? '',
          moduleId: mods.find(m => m.title === (getFieldValue(l, 'Module') ?? ''))?.node.id ?? '',
          order: getFieldNumber(l, 'Order') ?? 0, type: getFieldValue(l, 'Type') ?? 'Reading',
          duration: getFieldNumber(l, 'Duration (min)') ?? 0, mediaUrl: getFieldValue(l, 'Media URL') ?? '',
          musicXmlUrl: getFieldValue(l, 'MusicXML URL') ?? '',
        }))
        .sort((a, b) => a.order - b.order);
      setLessons(lns);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [courseId]);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLesson = (id: string) => {
    setCompletedLessons(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const completedCount = completedLessons.size;
  const totalCount = lessons.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded" />
      <div className="h-32 bg-muted rounded-xl" />
      <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}</div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Courses
      </button>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h1 className="text-xl font-bold">{courseTitle}</h1>
        {courseDesc && <p className="text-sm text-muted-foreground leading-relaxed">{courseDesc}</p>}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span><span>{completedCount} / {totalCount} lessons</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {modules.map(mod => {
          const modLessons = lessons.filter(l => l.moduleId === mod.node.id).sort((a, b) => a.order - b.order);
          const modCompleted = modLessons.filter(l => completedLessons.has(l.node.id)).length;
          const expanded = expandedModules.has(mod.node.id);

          return (
            <div key={mod.node.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleModule(mod.node.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    modCompleted === modLessons.length && modLessons.length > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    {mod.order}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{mod.title}</h3>
                    <p className="text-xs text-muted-foreground">{modLessons.length} lessons{modCompleted > 0 && ` · ${modCompleted} completed`}</p>
                  </div>
                </div>
                <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', expanded && 'rotate-90')} />
              </button>

              {expanded && (
                <div className="border-t border-border divide-y divide-border">
                  {modLessons.map(lesson => {
                    const TypeIcon = TYPE_ICONS[lesson.type] ?? FileText;
                    const done = completedLessons.has(lesson.node.id);
                    return (
                      <div key={lesson.node.id} className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors">
                        <button onClick={() => toggleLesson(lesson.node.id)} className="mt-0.5 shrink-0">
                          {done
                            ? <CheckCircle className="w-5 h-5 text-primary" />
                            : <Circle className="w-5 h-5 text-muted-foreground/40" />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground">{TYPE_LABELS[lesson.type] ?? lesson.type}</span>
                          </div>
                          <h4 className={cn('text-sm font-medium mt-0.5', done && 'line-through text-muted-foreground')}>{lesson.title}</h4>
                          {lesson.content && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{lesson.content}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {lesson.duration > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />{lesson.duration}m
                            </span>
                          )}
                          {lesson.mediaUrl && <Play className="w-4 h-4 text-primary" />}
                          {lesson.musicXmlUrl && <Music className="w-4 h-4 text-primary" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground mt-3">No course content yet. The teacher is still building this course.</p>
        </div>
      )}
    </div>
  );
}

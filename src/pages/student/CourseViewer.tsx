import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, FileText, Music, Clock, CheckCircle, Circle, ChevronRight, BookOpen, Video, Headphones, PenTool, HelpCircle, X, ExternalLink } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber, createNode, updateNode } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';
import ScoreRenderer from '@/components/ScoreRenderer';

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
  const { profile } = useCurrentUser();
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<LessonData | null>(null);
  const enrollmentNodeId = useRef<string | null>(null);

  const getYoutubeEmbedUrl = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const getGoogleDriveEmbedUrl = (url: string): string | null => {
    const match = url.match(/\/d\/([\w-]+)/);
    return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
  }

  useEffect(() => {
    Promise.all([
      getNodes(PROJECTS.courses), getNodes(PROJECTS.courseModules),
      getNodes(PROJECTS.courseLessons), getNodes(PROJECTS.enrollments),
    ]).then(([courseNodes, moduleNodes, lessonNodes, enrollmentNodes]) => {
      const course = courseNodes.find(n => n.id === courseId);
      if (!course) { setLoading(false); return; }
      const courseName = getFieldValue(course, 'Title') ?? '';
      setCourseTitle(courseName);
      setCourseDesc(getFieldValue(course, 'Description') ?? '');
      const mods: ModuleData[] = moduleNodes
        .filter(m => {
          const modCourseRef = getFieldValue(m, 'Course') ?? '';
          return modCourseRef === courseId || modCourseRef === courseName;
        })
        .map(m => ({ node: m, title: getFieldValue(m, 'Title') ?? '', description: getFieldValue(m, 'Description') ?? '', order: getFieldNumber(m, 'Order') ?? 0 }))
        .sort((a, b) => a.order - b.order);
      setModules(mods);
      setExpandedModules(new Set(mods.length > 0 ? [mods[0].node.id] : []));

      const lns: LessonData[] = lessonNodes
        .filter(l => {
          const modRef = getFieldValue(l, 'Module') ?? '';
          return mods.some(m => m.node.id === modRef || m.title === modRef);
        })
        .map(l => {
          const modRef = getFieldValue(l, 'Module') ?? '';
          const matchedMod = mods.find(m => m.node.id === modRef || m.title === modRef);
          return {
            node: l, title: getFieldValue(l, 'Title') ?? '', content: getFieldValue(l, 'Content') ?? '',
            moduleId: matchedMod?.node.id ?? '',
            order: getFieldNumber(l, 'Order') ?? 0, type: getFieldValue(l, 'Type') ?? 'Reading',
            duration: getFieldNumber(l, 'Duration (min)') ?? 0, mediaUrl: getFieldValue(l, 'Media URL') ?? '',
            musicXmlUrl: getFieldValue(l, 'MusicXML URL') ?? '',
          };
        })
        .sort((a, b) => a.order - b.order);
      setLessons(lns);

      // Restore completed lessons from enrollment
      const studentEmail = profile?.email ?? '';
      const enrollment = enrollmentNodes.find(
        e => getFieldValue(e, 'Course') === courseName && getFieldValue(e, 'Student') === studentEmail,
      );
      if (enrollment) {
        enrollmentNodeId.current = enrollment.id;
        const stored = getFieldValue(enrollment, 'Completed Lesson IDs');
        if (stored) {
          try {
            const ids: string[] = JSON.parse(stored);
            const validIds = ids.filter((id: string) => lns.some(l => l.node.id === id));
            setCompletedLessons(new Set(validIds));
          } catch { /* corrupt data, start fresh */ }
        }
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [courseId, profile]);

  const persistProgress = useCallback(async (
    currentCompleted: Set<string>,
    course: string,
    total: number,
  ) => {
    const studentEmail = profile?.email;
    if (studentEmail == null) return;

    const progress = total > 0 ? Math.round((currentCompleted.size / total) * 100) : 0;
    const fields: Record<string, string> = {
      'Completed Lesson IDs': JSON.stringify([...currentCompleted]),
      'Progress %': String(progress),
    };

    let nodeId = enrollmentNodeId.current;
    if (nodeId == null) {
      // Find or create the enrollment
      const enrs = await getNodes(PROJECTS.enrollments);
      const existing = enrs.find(
        e => getFieldValue(e, 'Course') === course && getFieldValue(e, 'Student') === studentEmail,
      );
      if (existing) {
        nodeId = existing.id;
        enrollmentNodeId.current = nodeId;
      } else {
        fields['Student'] = studentEmail;
        fields['Course'] = course;
        fields['Status'] = 'Active';
        await createNode(PROJECTS.enrollments, fields);

        // Refetch to capture the new node ID for subsequent toggles
        const refreshed = await getNodes(PROJECTS.enrollments);
        const created = refreshed.find(
          e => getFieldValue(e, 'Course') === course && getFieldValue(e, 'Student') === studentEmail,
        );
        if (created) {
          enrollmentNodeId.current = created.id;
        }
        return;
      }
    }

    await updateNode(PROJECTS.enrollments, nodeId, fields);
  }, [profile]);

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
      persistProgress(next, courseTitle, lessons.length);
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
                    const isSelected = selectedLesson?.node.id === lesson.node.id;
                    return (
                      <div
                        key={lesson.node.id}
                        onClick={() => setSelectedLesson(isSelected ? null : lesson)}
                        className={cn(
                          'flex items-start gap-3 p-4 transition-colors cursor-pointer',
                          isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/20',
                        )}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedLesson(isSelected ? null : lesson); }}}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleLesson(lesson.node.id); }}
                          className="mt-0.5 shrink-0"
                          aria-label={done ? 'Mark as incomplete' : 'Mark as complete'}
                        >
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

      {selectedLesson && (
        <div className="rounded-xl border border-primary/20 bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {(() => { const Icon = TYPE_ICONS[selectedLesson.type] ?? FileText; return <Icon className="w-4 h-4 text-primary" />; })()}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{selectedLesson.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[selectedLesson.type] ?? selectedLesson.type}
                  {selectedLesson.duration > 0 && ` · ${selectedLesson.duration} min`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedLesson(null)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
              aria-label="Close lesson detail"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {selectedLesson.content && (
              <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-line">
                {selectedLesson.content}
              </div>
            )}

            {selectedLesson.mediaUrl && (() => {
              const youtubeEmbed = getYoutubeEmbedUrl(selectedLesson.mediaUrl);
              const driveEmbed = getGoogleDriveEmbedUrl(selectedLesson.mediaUrl);
              const embedUrl = youtubeEmbed ?? driveEmbed ?? null;

              return embedUrl ? (
                <div className="rounded-lg overflow-hidden border border-border bg-black/5 aspect-video">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedLesson.title}
                  />
                </div>
              ) : (
                <a
                  href={selectedLesson.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" /> Open media
                </a>
              );
            })()}

            {selectedLesson.musicXmlUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Music className="w-3.5 h-3.5" /> Sheet Music
                </div>
                <ScoreRenderer musicXmlUrl={selectedLesson.musicXmlUrl} className="bg-white/50 dark:bg-black/20 rounded-lg p-4" />
              </div>
            )}
          </div>
        </div>
      )}

      {modules.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground mt-3">No course content yet. The teacher is still building this course.</p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Eye, GripVertical, Trash2, ChevronRight, Sparkles, X, Upload, FileText, Link2, Image, Video, Music, Monitor } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber, createNode, deleteNode } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

interface CourseData { node: GenesisNode; title: string; description: string; status: string; }
interface ModuleData { node: GenesisNode; title: string; description: string; order: number; }
interface LessonData { node: GenesisNode; title: string; content: string; moduleRef: string; order: number; type: string; duration: number; mediaUrl: string; musicXmlUrl: string; }
interface MediaData { node: GenesisNode; fileName: string; fileType: string; url: string; course: string; uploader: string; }

const LESSON_TYPES = ['Video', 'Reading', 'Assignment', 'Quiz', 'Practice', 'Listening'] as const;
const MEDIA_TYPES = [
  { value: 'PDF', icon: FileText, label: 'PDF Document' },
  { value: 'PowerPoint', icon: Monitor, label: 'PowerPoint' },
  { value: 'Keynote', icon: Monitor, label: 'Keynote' },
  { value: 'Audio', icon: Music, label: 'Audio File' },
  { value: 'Video', icon: Video, label: 'Video File' },
  { value: 'MusicXML', icon: Music, label: 'MusicXML Sheet' },
  { value: 'Image', icon: Image, label: 'Image' },
] as const;

export default function CourseBuilder() {
  const navigate = useNavigate();
  const { profile } = useCurrentUser();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'modules' | 'media'>('modules');
  const [media, setMedia] = useState<MediaData[]>([]);
  const teacherName = profile?.displayName ?? '';
  const autoSelectedRef = useRef(false);

  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonType, setNewLessonType] = useState<string>('Reading');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [newLessonMedia, setNewLessonMedia] = useState('');
  const [newLessonMxml, setNewLessonMxml] = useState('');
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [newMediaName, setNewMediaName] = useState('');
  const [newMediaType, setNewMediaType] = useState('PDF');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('Music Theory');
  const [newCourseDifficulty, setNewCourseDifficulty] = useState('Beginner');
  const [newCoursePrice, setNewCoursePrice] = useState('');
  const [newCourseDuration, setNewCourseDuration] = useState('');

  const selected = courses.find(c => c.node.id === selectedCourseId);

  const courseModules = modules
    .filter(m => selectedCourseId && (getFieldValue(m.node, 'Course') === selectedCourseId || getFieldValue(m.node, 'Course') === (selected?.title ?? '')))
    .sort((a, b) => a.order - b.order);

  const courseLessons = lessons
    .filter(l => courseModules.some(m => m.node.id === l.moduleRef || m.title === l.moduleRef))
    .sort((a, b) => a.order - b.order);

  const courseMedia = media.filter(m => m.course === (selected?.node.id ?? '') || m.course === (selected?.title ?? ''));

  const fetchData = useCallback(async () => {
    try {
      const [courseNodes, modNodes, lesNodes, medNodes] = await Promise.all([
        getNodes(PROJECTS.courses), getNodes(PROJECTS.courseModules),
        getNodes(PROJECTS.courseLessons), getNodes(PROJECTS.courseMedia),
      ]);
      const teacherCourses: CourseData[] = courseNodes
        .filter(c => !teacherName || getFieldValue(c, 'Instructor') === teacherName)
        .map(c => ({ node: c, title: getFieldValue(c, 'Title') ?? '', description: getFieldValue(c, 'Description') ?? '', status: getFieldValue(c, 'Status') ?? '' }));
      setCourses(teacherCourses);
      const allMods: ModuleData[] = modNodes.map(m => ({ node: m, title: getFieldValue(m, 'Title') ?? '', description: getFieldValue(m, 'Description') ?? '', order: getFieldNumber(m, 'Order') ?? 0 }));
      setModules(allMods);
      const allLessons: LessonData[] = lesNodes.map(l => ({ node: l, title: getFieldValue(l, 'Title') ?? '', content: getFieldValue(l, 'Content') ?? '', moduleRef: getFieldValue(l, 'Module') ?? '', order: getFieldNumber(l, 'Order') ?? 0, type: getFieldValue(l, 'Type') ?? 'Reading', duration: getFieldNumber(l, 'Duration (min)') ?? 0, mediaUrl: getFieldValue(l, 'Media URL') ?? '', musicXmlUrl: getFieldValue(l, 'MusicXML URL') ?? '' }));
      setLessons(allLessons);
      const allMedia: MediaData[] = medNodes.map(m => ({ node: m, fileName: getFieldValue(m, 'File Name') ?? '', fileType: getFieldValue(m, 'File Type') ?? '', url: getFieldValue(m, 'Google Drive URL') ?? '', course: getFieldValue(m, 'Course') ?? '', uploader: getFieldValue(m, 'Uploaded By') ?? '' }));
      setMedia(allMedia);
      if (teacherCourses.length > 0 && !autoSelectedRef.current) {
        autoSelectedRef.current = true;
        setSelectedCourseId(teacherCourses[0].node.id);
      }
    } catch (err) { console.error('[CourseBuilder]', err); }
    finally { setLoading(false); }
  }, [teacherName]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  async function handleAddModule() {
    if (!newModuleTitle.trim() || !selected) return;
    setSaving(true);
    try {
      const nextOrder = courseModules.length + 1;
      await createNode(PROJECTS.courseModules, {
        Title: newModuleTitle.trim(),
        Description: newModuleDesc.trim(),
        Course: selected.node.id,
        Order: String(nextOrder),
        Status: 'Draft',
      });
      setNewModuleTitle(''); setNewModuleDesc(''); setShowAddModule(false);
      await fetchData();
    } catch (err) { console.error('[CourseBuilder] addModule:', err); }
    finally { setSaving(false); }
  }

  async function handleAddLesson(moduleId: string) {
    if (!newLessonTitle.trim()) return;
    setSaving(true);
    try {
      const modLessons = courseLessons.filter(l => l.moduleRef === moduleId);
      const nextOrder = modLessons.length + 1;
      await createNode(PROJECTS.courseLessons, {
        Title: newLessonTitle.trim(),
        Content: newLessonContent.trim(),
        Module: moduleId,
        Order: String(nextOrder),
        Type: newLessonType,
        'Duration (min)': newLessonDuration || '0',
        'Media URL': newLessonMedia.trim(),
        'MusicXML URL': newLessonMxml.trim(),
      });
      setNewLessonTitle(''); setNewLessonContent(''); setNewLessonMedia(''); setNewLessonMxml('');
      setShowAddLesson(null);
      await fetchData();
    } catch (err) { console.error('[CourseBuilder] addLesson:', err); }
    finally { setSaving(false); }
  }

  async function handleAddMedia() {
    if (!newMediaName.trim() || !newMediaUrl.trim() || !selected) return;
    setSaving(true);
    try {
      await createNode(PROJECTS.courseMedia, {
        'File Name': newMediaName.trim(),
        'File Type': newMediaType,
        'Google Drive URL': newMediaUrl.trim(),
        Course: selected.node.id,
        'Uploaded By': teacherName,
      });
      setNewMediaName(''); setNewMediaUrl(''); setShowAddMedia(false);
      await fetchData();
    } catch (err) { console.error('[CourseBuilder] addMedia:', err); }
    finally { setSaving(false); }
  }

  async function handleDeleteMedia(nodeId: string) {
    setSaving(true);
    try { await deleteNode(PROJECTS.courseMedia, nodeId); await fetchData(); }
    catch (err) { console.error('[CourseBuilder] deleteMedia:', err); }
    finally { setSaving(false); }
  }

  async function handleDeleteModule(nodeId: string) {
    setSaving(true);
    try { await deleteNode(PROJECTS.courseModules, nodeId); await fetchData(); }
    catch (err) { console.error('[CourseBuilder] deleteModule:', err); }
    finally { setSaving(false); }
  }

  async function handleDeleteLesson(nodeId: string) {
    setSaving(true);
    try { await deleteNode(PROJECTS.courseLessons, nodeId); await fetchData(); }
    catch (err) { console.error('[CourseBuilder] deleteLesson:', err); }
    finally { setSaving(false); }
  }

  async function handleCreateCourse() {
    if (!newCourseTitle.trim()) return;
    setSaving(true);
    try {
      await createNode(PROJECTS.courses, {
        Title: newCourseTitle.trim(),
        Description: newCourseDesc.trim(),
        Category: newCourseCategory,
        Difficulty: newCourseDifficulty,
        'Price (CHF)': newCoursePrice || '0',
        'Duration (Weeks)': newCourseDuration || '0',
        Instructor: teacherName,
        Status: 'Draft',
      });
      setNewCourseTitle(''); setNewCourseDesc(''); setNewCoursePrice(''); setNewCourseDuration('');
      setShowCreateCourse(false);
      await fetchData();
    } catch (err) { console.error('[CourseBuilder] createCourse:', err); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded" />
      <div className="h-40 bg-muted rounded-xl" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Build modules, lessons, and upload teaching materials</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="text-sm border border-border bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[200px]"
          >
            {courses.map(c => <option key={c.node.id} value={c.node.id}>{c.title}</option>)}
          </select>
          <button onClick={() => selected && navigate(`/my-courses/${selected.node.id}`)} disabled={!selected} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-40">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button onClick={() => setShowCreateCourse(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Course
          </button>
        </div>
      </div>

      {showCreateCourse && (
        <div className="rounded-xl border border-primary/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Create New Course</h3>
            <button onClick={() => { setShowCreateCourse(false); setNewCourseTitle(''); setNewCourseDesc(''); setNewCoursePrice(''); setNewCourseDuration(''); }} className="p-1 rounded hover:bg-muted/50"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} placeholder="Course title" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <input value={newCoursePrice} onChange={e => setNewCoursePrice(e.target.value)} type="number" min="0" placeholder="Price (CHF)" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <select value={newCourseCategory} onChange={e => setNewCourseCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="Music Theory">Music Theory</option>
              <option value="Technique">Technique</option>
              <option value="Repertoire">Repertoire</option>
              <option value="Ear Training">Ear Training</option>
              <option value="Composition">Composition</option>
              <option value="Music History">Music History</option>
            </select>
            <select value={newCourseDifficulty} onChange={e => setNewCourseDifficulty(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>
          </div>
          <textarea value={newCourseDesc} onChange={e => setNewCourseDesc(e.target.value)} placeholder="Description" rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          <div className="flex items-center gap-2">
            <input value={newCourseDuration} onChange={e => setNewCourseDuration(e.target.value)} type="number" min="1" placeholder="Duration (weeks)" className="w-40 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <button onClick={handleCreateCourse} disabled={saving || !newCourseTitle.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">{saving ? 'Creating...' : 'Create Course'}</button>
          </div>
        </div>
      )}

      {courses.length === 0 && !showCreateCourse ? (
        <div className="text-center py-16 rounded-xl border border-border bg-card">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground mt-3">No courses yet. Create your first course to start building.</p>
          <button onClick={() => setShowCreateCourse(true)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Create Course
          </button>
        </div>
      ) : (
        <>
          {selected && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{selected.title}</h2>
                <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', selected.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400' : selected.status === 'Draft' ? 'bg-amber-500/10 text-amber-400' : 'bg-muted text-muted-foreground')}>
                  {selected.status}
                </span>
              </div>
              {selected.description && <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{courseModules.length} modules</span><span>·</span><span>{courseLessons.length} lessons</span><span>·</span><span>{courseMedia.length} media files</span>
              </div>

              <div className="flex gap-1 pt-1">
                <button onClick={() => setActiveTab('modules')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', activeTab === 'modules' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>Modules & Lessons</button>
                <button onClick={() => setActiveTab('media')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', activeTab === 'media' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>Media Files</button>
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Modules & Lessons</h3>
                <button onClick={() => setShowAddModule(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Module
                </button>
              </div>

              {showAddModule && (
                <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between"><h4 className="text-sm font-semibold">New Module</h4><button onClick={() => { setShowAddModule(false); setNewModuleTitle(''); setNewModuleDesc(''); }} className="p-1 rounded hover:bg-muted/50"><X className="w-4 h-4" /></button></div>
                  <input value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} placeholder="Module title" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <textarea value={newModuleDesc} onChange={e => setNewModuleDesc(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  <button onClick={handleAddModule} disabled={saving || !newModuleTitle.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Add Module'}</button>
                </div>
              )}

              {courseModules.length === 0 && !showAddModule ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">No modules yet. Add your first module to start building.</p>
                </div>
              ) : (
                courseModules.map(mod => {
                  const modLessons = courseLessons.filter(l => l.moduleRef === mod.node.id || l.moduleRef === mod.title).sort((a, b) => a.order - b.order);
                  const expanded = expandedModules.has(mod.node.id);

                  return (
                    <div key={mod.node.id} className="rounded-xl border border-border bg-card overflow-hidden">
                      <button onClick={() => toggleModule(mod.node.id)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                          <div>
                            <h4 className="text-sm font-semibold">{mod.title}</h4>
                            <p className="text-xs text-muted-foreground">{modLessons.length} lessons</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.node.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
                        </div>
                      </button>

                      {expanded && (
                        <div className="border-t border-border">
                          {mod.description && <p className="px-4 py-2 text-xs text-muted-foreground bg-muted/20">{mod.description}</p>}
                          <div className="divide-y divide-border">
                            {modLessons.map(lesson => (
                              <div key={lesson.node.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{lesson.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {lesson.type}{lesson.duration > 0 && ` · ${lesson.duration}m`}
                                    {lesson.mediaUrl && ' · Media'}{lesson.musicXmlUrl && ' · MusicXML'}
                                  </p>
                                </div>
                                <button onClick={() => handleDeleteLesson(lesson.node.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            {showAddLesson === mod.node.id ? (
                              <div className="p-4 space-y-3 bg-muted/10">
                                <div className="flex items-center justify-between"><span className="text-xs font-semibold">New Lesson in {mod.title}</span><button onClick={() => { setShowAddLesson(null); setNewLessonTitle(''); setNewLessonContent(''); setNewLessonMedia(''); setNewLessonMxml(''); }} className="p-1 rounded hover:bg-muted/50"><X className="w-3.5 h-3.5" /></button></div>
                                <input value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} placeholder="Lesson title" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                <textarea value={newLessonContent} onChange={e => setNewLessonContent(e.target.value)} placeholder="Content / instructions" rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                                <div className="flex gap-2">
                                  <select value={newLessonType} onChange={e => setNewLessonType(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">{LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                  <input value={newLessonDuration} onChange={e => setNewLessonDuration(e.target.value)} type="number" min="0" placeholder="Minutes" className="w-24 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div className="flex gap-2">
                                  <input value={newLessonMedia} onChange={e => setNewLessonMedia(e.target.value)} placeholder="Google Drive URL (video/slides)" className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                  <input value={newLessonMxml} onChange={e => setNewLessonMxml(e.target.value)} placeholder="MusicXML URL" className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <button onClick={() => handleAddLesson(mod.node.id)} disabled={saving || !newLessonTitle.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Add Lesson'}</button>
                              </div>
                            ) : (
                              <button onClick={() => { setShowAddLesson(mod.node.id); setNewLessonType('Reading'); setNewLessonDuration(''); setNewLessonMedia(''); setNewLessonMxml(''); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                                <Plus className="w-3.5 h-3.5" /> Add Lesson
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Course Media</h3>
                <button onClick={() => setShowAddMedia(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Add Media
                </button>
              </div>

              {showAddMedia && (
                <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between"><h4 className="text-sm font-semibold">Upload Material</h4><button onClick={() => { setShowAddMedia(false); setNewMediaName(''); setNewMediaUrl(''); }} className="p-1 rounded hover:bg-muted/50"><X className="w-4 h-4" /></button></div>
                  <p className="text-xs text-muted-foreground">Upload your file to Google Drive, then paste the shareable link below.</p>
                  <input value={newMediaName} onChange={e => setNewMediaName(e.target.value)} placeholder="File name (e.g. Lesson 1 Slides)" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <select value={newMediaType} onChange={e => setNewMediaType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {MEDIA_TYPES.map(mt => <option key={mt.value} value={mt.value}>{mt.label}</option>)}
                  </select>
                  <input value={newMediaUrl} onChange={e => setNewMediaUrl(e.target.value)} placeholder="Google Drive shareable link" type="url" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <button onClick={handleAddMedia} disabled={saving || !newMediaName.trim() || !newMediaUrl.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Add Media'}</button>
                </div>
              )}

              {courseMedia.length === 0 && !showAddMedia ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-border">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground mt-3">No media files yet. Upload slides, sheet music, audio, and video for this course.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {courseMedia.map(m => {
                    const mt = MEDIA_TYPES.find(t => t.value === m.fileType);
                    const Icon = mt?.icon ?? FileText;
                    return (
                      <div key={m.node.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 group">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.fileName}</p>
                          <p className="text-xs text-muted-foreground">{m.fileType}{m.uploader && ` · by ${m.uploader}`}</p>
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline">
                            <Link2 className="w-3 h-3" /> Open in Drive
                          </a>
                        </div>
                        <button onClick={() => handleDeleteMedia(m.node.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

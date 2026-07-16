import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, GraduationCap, Music, Award, BookOpen, CalendarDays, ExternalLink } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-CH', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
}

export default function TeacherDetail() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<GenesisNode | null>(null);
  const [evaluations, setEvaluations] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getNodes(PROJECTS.teachers), getNodes(PROJECTS.evaluations)])
      .then(([teachers, evals]) => {
        const t = teachers.find((n) => n.id === teacherId);
        setTeacher(t ?? null);
        if (t) {
          const name = getFieldValue(t, 'Name') ?? t.title ?? '';
          setEvaluations(
            evals
              .filter((e) => getFieldValue(e, 'Evaluated Role') === 'Teacher' && getFieldValue(e, 'User') === name)
              .sort((a, b) => (getFieldValue(b, 'Evaluation Date') ?? '').localeCompare(getFieldValue(a, 'Evaluation Date') ?? '')),
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [teacherId]);

  const bookingUrl = teacher ? (getFieldValue(teacher, 'Google Booking URL') || '') : '';

  if (loading) return <Skeleton />;
  if (!teacher) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto text-center py-16">
        <p className="text-muted-foreground mb-4">Teacher not found.</p>
        <button onClick={() => navigate('/discover/teachers')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
          Back to Teachers
        </button>
      </div>
    );
  }

  const name = getFieldValue(teacher, 'Name') ?? teacher.title ?? '';
  const initials = getInitials(name);
  const instrument = getFieldValue(teacher, 'Instrument') ?? '';
  const specialization = getFieldValue(teacher, 'Specialization') ?? '';
  const certification = getFieldValue(teacher, 'Certification') ?? '';
  const rating = getFieldNumber(teacher, 'Rating') ?? 0;
  const hourlyRate = getFieldNumber(teacher, 'Hourly Rate (CHF)') ?? 0;
  const location = getFieldValue(teacher, 'Location') ?? '';
  const yearsExperience = getFieldNumber(teacher, 'Years of Experience') ?? 0;
  const bio = getFieldValue(teacher, 'Bio') ?? '';
  const email = getFieldValue(teacher, 'Email') ?? '';

  const avgScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((s, e) => s + (getFieldNumber(e, 'Score') ?? 0), 0) / evaluations.length)
    : 0;

  const hasBookingUrl = bookingUrl.length > 0;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/discover/teachers')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Teachers
      </button>

      {/* Hero */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-8">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-card p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-2xl lg:text-3xl font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{name}</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                {instrument} · {specialization}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold tabular-nums">{rating}</span>
                  <span className="text-xs text-muted-foreground">({evaluations.length} review{evaluations.length !== 1 ? 's' : ''})</span>
                </div>
                <span className="text-lg font-bold tabular-nums text-primary">
                  CHF {hourlyRate}<span className="text-xs text-muted-foreground font-normal">/hr</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <Badge icon={GraduationCap} label={certification} />
                <Badge icon={MapPin} label={location} />
                <Badge icon={Clock} label={`${yearsExperience} years`} />
                <Badge icon={Award} label={specialization} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">About {name.split(' ')[0]}</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
          {email ? (
            <p className="text-xs text-muted-foreground mt-3">
              Contact: <span className="text-foreground font-medium">{email}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Evaluations */}
      {evaluations.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <Star className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold">Student Evaluations</h2>
            <span className="text-xs text-muted-foreground ml-auto">{evaluations.length} total · avg {avgScore}%</span>
          </div>
          <div className="divide-y divide-border">
            {evaluations.map((ev) => {
              const score = getFieldNumber(ev, 'Score') ?? 0;
              return (
                <div key={ev.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{getFieldValue(ev, 'User')}</span>
                      <span className="text-[10px] text-muted-foreground">{getFieldValue(ev, 'Category')}</span>
                    </div>
                    <span className={cn('text-xs font-bold tabular-nums px-2 py-0.5 rounded-full', score >= 80 ? 'bg-emerald-500/10 text-emerald-400' : score >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-destructive/10 text-destructive')}>
                      {score}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{getFieldValue(ev, 'AI Notes')}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">{formatDate(getFieldValue(ev, 'Evaluation Date'))}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Booking */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Book a Lesson</h2>
          {hasBookingUrl ? (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open in Calendar <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
        </div>
        {hasBookingUrl ? (
          <iframe
            src={bookingUrl}
            className="w-full border-0"
            style={{ height: '700px' }}
            title={`Book a lesson with ${name}`}
          />
        ) : (
          <div className="px-5 py-10 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Booking page coming soon.</p>
            <p className="text-xs text-muted-foreground mt-1">This teacher hasn't set up their booking calendar yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
      <Icon className="w-2.5 h-2.5" />{label}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-pulse">
      <div className="h-6 w-32 bg-muted rounded mb-6" />
      <div className="h-48 bg-muted rounded-2xl mb-8" />
      <div className="h-32 bg-muted rounded-xl mb-8" />
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  );
}

import { useState } from 'react';
import { Music, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '@/lib/auth';
import { getNodes, getFieldValue, updateNode } from '@/lib/genesis-data';
import { PROJECTS, APP_NAME } from '@/config/app';

const INSTRUMENTS = ['Piano', 'Violin', 'Cello', 'Guitar', 'Flute', 'Voice', 'Trumpet', 'Drums'] as const;
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Virtuoso'] as const;
const GOALS = ['Learn a new instrument', 'Improve technique', 'Prepare for exams/auditions', 'Play for enjoyment', 'Music theory', 'Performance skills', 'Composition', 'Other'] as const;

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [instrument, setInstrument] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [yearsPlaying, setYearsPlaying] = useState('');
  const [previousTeacher, setPreviousTeacher] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');

  const session = getSession();
  const isTeacher = session?.role?.toLowerCase() === 'teacher';

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instrument || !skillLevel) {
      setError('Please select your instrument and skill level.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const nodes = await getNodes(PROJECTS.userProfiles);
      const userNode = nodes.find((n) => {
        const em = getFieldValue(n, 'Email');
        return em && em.toLowerCase() === session?.email?.toLowerCase();
      });

      if (userNode) {
        await updateNode(PROJECTS.userProfiles, userNode.id, {
          Instrument: instrument,
          'Skill Level': skillLevel,
        });

        const linkedId = getFieldValue(userNode, 'Linked Student ID');
        if (linkedId) {
          try {
            await updateNode(PROJECTS.students, linkedId, {
              Instrument: instrument,
              'Skill Level': skillLevel,
            });
          } catch { /* linked record may not exist yet */ }
        }

        setSubmitted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Profile updated</h1>
          <p className="text-muted-foreground mb-2">
            Your responses help us personalize your experience on {APP_NAME}.
          </p>
          {isTeacher ? (
            <p className="text-sm text-muted-foreground mb-8">
              Now complete your teacher profile.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-8">
              Finish setting up your account.
            </p>
          )}
          <button
            onClick={() => navigate(isTeacher ? '/teacher-application' : '/mfa/setup')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            {isTeacher ? 'Continue to Teacher Form' : 'Continue to MFA Setup'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to {APP_NAME}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Tell us about your musical background so we can tailor your experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Primary Instrument *</label>
            <div className="grid grid-cols-2 gap-2">
              {INSTRUMENTS.map((inst) => (
                <button
                  key={inst}
                  type="button"
                  onClick={() => setInstrument(instrument === inst ? '' : inst)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    instrument === inst
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Skill Level *</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSkillLevel(skillLevel === level ? '' : level)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    skillLevel === level
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Years playing this instrument</label>
            <input
              type="text"
              value={yearsPlaying}
              onChange={(e) => setYearsPlaying(e.target.value)}
              placeholder="e.g. 3 years"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Previous teacher (if any)</label>
            <input
              type="text"
              value={previousTeacher}
              onChange={(e) => setPreviousTeacher(e.target.value)}
              placeholder="Teacher's name"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Learning goals (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((goal) => {
                const active = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Anything else we should know?</label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Musical background, preferences, questions..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save & Continue'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

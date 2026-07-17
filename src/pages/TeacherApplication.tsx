import { useState } from 'react';
import { Music, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '@/lib/auth';
import { getNodes, getFieldValue, createNode, updateNode } from '@/lib/genesis-data';
import { PROJECTS, APP_NAME } from '@/config/app';

const INSTRUMENTS = ['Piano', 'Violin', 'Cello', 'Guitar', 'Flute', 'Voice', 'Trumpet', 'Drums'] as const;
const SPECIALIZATIONS = ['Classical', 'Jazz', 'Contemporary', 'Baroque', 'Romantic', 'Theory', 'Composition'] as const;
const LEVELS = ['Junior Teacher', 'Senior Teacher', 'Master Teacher', 'Professor'] as const;
const LOCATIONS = ['Online', 'Room 1', 'Room 2', 'Room 3', 'Town A', 'Town B'] as const;

export default function TeacherApplication() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [instrument, setInstrument] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [level, setLevel] = useState('');
  const [location, setLocation] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [bio, setBio] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');

  const session = getSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instrument || !specialization || !level || !bio) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const displayName = session?.displayName ?? session?.email?.split('@')[0] ?? 'Teacher';
      const userEmail = session?.email ?? '';

      // Create the teacher record
      await createNode(PROJECTS.teachers, {
        Email: userEmail,
        Instrument: instrument,
        Specialization: specialization,
        Certification: level,
        Location: location || 'Online',
        'Years of Experience': yearsExperience ? String(yearsExperience) : '',
        'Hourly Rate (CHF)': hourlyRate ? String(hourlyRate) : '',
        Bio: bio,
        'Google Booking URL': bookingUrl,
        Rating: '5.0',
      });

      // Refetch to find the newly created teacher node
      const refreshedTeachers = await getNodes(PROJECTS.teachers);
      const createdTeacher = refreshedTeachers.find(
        (t) => getFieldValue(t, 'Email') && getFieldValue(t, 'Email')!.toLowerCase() === userEmail.toLowerCase(),
      );

      // Link the teacher to the user profile
      if (session?.nodeId && createdTeacher) {
        await updateNode(PROJECTS.userProfiles, session.nodeId, {
          'Linked Teacher ID': createdTeacher.id,
          'Display Name': displayName,
        });
      }

      // Also update the linked student if exists
      if (session?.nodeId) {
        const profiles = await getNodes(PROJECTS.userProfiles);
        const profile = profiles.find((n) => n.id === session.nodeId);
        const linkedStudentId = profile ? getFieldValue(profile, 'Linked Student ID') : '';
        if (linkedStudentId) {
          await updateNode(PROJECTS.students, linkedStudentId, {});
        }
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
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
          <h1 className="text-2xl font-bold mb-2">Application submitted</h1>
          <p className="text-muted-foreground mb-2">
            Your teacher profile has been created. An admin will review it shortly.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            You can start using {APP_NAME} right away.
          </p>
          <button
            onClick={() => navigate('/mfa/setup')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Continue to MFA Setup
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
          <h1 className="text-2xl font-bold">Teacher Profile</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Tell us about your teaching background to join {APP_NAME} as an instructor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Instrument *</label>
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
            <label className="block text-sm font-medium mb-2">Specialization *</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSpecialization(specialization === spec ? '' : spec)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    specialization === spec
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Certification Level *</label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(level === l ? '' : l)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    level === l
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Years of experience</label>
              <input
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                placeholder="e.g. 5"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Hourly rate (CHF)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="e.g. 80"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location *</label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(location === loc ? '' : loc)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    location === loc
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Bio *</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell students about your teaching philosophy, background, and approach..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Google Calendar booking URL</label>
            <input
              type="url"
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              placeholder="https://calendar.google.com/..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground mt-1">Share your Google Calendar appointment page so students can book lessons.</p>
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
            {submitting ? 'Submitting...' : 'Submit Application'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

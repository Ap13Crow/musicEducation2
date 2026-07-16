import { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { Music, ArrowRight, GraduationCap, User, LogOut, ShieldAlert } from 'lucide-react';
import { createNode } from '@/lib/genesis-data';
import { PROJECTS, APP_NAME } from '@/config/app';
import type { UserRole } from '@/config/app';

const ROLE_OPTION_IDS: Record<UserRole, string> = {
  student: 'r-student',
  teacher: 'r-teacher',
  admin: 'r-admin',
  moderator: 'r-moderator',
};

export default function Onboarding() {
  const auth = useAuth();
  const [role, setRole] = useState<UserRole>('student');
  const [instrument, setInstrument] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const profile = auth.user?.profile;
  const email = profile?.email ?? '';
  const name = profile?.name ?? profile?.preferred_username ?? '';
  const sub = profile?.sub ?? '';

  const handleCancel = () => {
    auth.signoutRedirect().catch(() => {
      window.location.href = '/';
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sub) return;

    setSaving(true);
    setError(null);

    try {
      await createNode(PROJECTS.userProfiles, {
        'OIDC Sub': sub,
        Email: email,
        'Display Name': name,
        Role: ROLE_OPTION_IDS[role],
        'Linked Student ID': '',
        'Linked Teacher ID': '',
        Instrument: instrument,
        'Skill Level': skillLevel,
        'Created At': new Date().toISOString(),
      });
      setDone(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Music className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Profile created</h2>
          <p className="text-muted-foreground">Redirecting you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cancel
          </button>
          <span className="text-xs text-muted-foreground">Step 1 of 1</span>
        </div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Music className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to {APP_NAME}</h1>
          <p className="text-muted-foreground mt-2">Set up your profile to get started</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 mb-4">
          <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3 mb-5">
            <ShieldAlert className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Your profile determines what you can see. Teachers and students will only appear by name
              until your profile is created. Full details become visible once your role and instrument are set.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={email} disabled className="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Display Name</label>
              <input type="text" value={name} disabled className="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    role === 'student' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <User className={`w-6 h-6 ${role === 'student' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${role === 'student' ? 'text-primary' : 'text-muted-foreground'}`}>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    role === 'teacher' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <GraduationCap className={`w-6 h-6 ${role === 'teacher' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${role === 'teacher' ? 'text-primary' : 'text-muted-foreground'}`}>Teacher</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Instrument</label>
              <input
                type="text"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                placeholder="e.g. Piano, Violin, Guitar"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Skill Level</label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              >
                <option value="">Select level...</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">{error}</div>
            )}

            <button
              type="submit"
              disabled={saving || !instrument || !skillLevel}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating profile...' : 'Complete Setup'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

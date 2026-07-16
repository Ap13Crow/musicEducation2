import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertTriangle, Shield, Music, GraduationCap, User } from 'lucide-react';
import { getNodes, getFieldValue, updateNode, createNode } from '@/lib/genesis-data';
import { hashPassword, verifyPassword, saveSession, getSession } from '@/lib/auth';
import { PROJECTS, APP_NAME } from '@/config/app';
import type { UserRole } from '@/config/app';

interface LoginProps {
  onMfaRequired: (email: string, nodeId: string) => void;
}

export function EmailLogin({ onMfaRequired }: LoginProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const nodes = await getNodes(PROJECTS.userProfiles);
      const match = nodes.find((n) => {
        const em = getFieldValue(n, 'Email');
        return em && em.toLowerCase() === email.toLowerCase();
      });

      if (mode === 'login') {
        if (!match) {
          setError('No account found with this email. Sign up instead.');
          setLoading(false);
          return;
        }

        let storedHash = getFieldValue(match, 'Password Hash') ?? '';

        // First-time setup: INITIAL: marker
        if (storedHash.startsWith('INITIAL:')) {
          const expectedB64 = storedHash.slice(8);
          const expected = atob(expectedB64);
          if (password !== expected) {
            setError('Invalid password.');
            setLoading(false);
            return;
          }
          // Replace INITIAL with proper PBKDF2 hash
          const newHash = await hashPassword(password);
          await updateNode(PROJECTS.userProfiles, match.id, { 'Password Hash': newHash });
          storedHash = newHash;
        } else {
          const ok = await verifyPassword(password, storedHash);
          if (!ok) {
            setError('Invalid password.');
            setLoading(false);
            return;
          }
        }

        // Check MFA
        const mfaEnabled = (getFieldValue(match, 'MFA Enabled') ?? 'No') === 'Yes';
        const totpSecret = getFieldValue(match, 'TOTP Secret') ?? '';

        if (mfaEnabled && totpSecret) {
          // Store partial session, redirect to MFA verify
          saveSession({
            email,
            role: getFieldValue(match, 'Role') ?? 'Student',
            displayName: getFieldValue(match, 'Display Name') ?? email,
            nodeId: match.id,
            mfaVerified: false,
          });
          onMfaRequired(email, match.id);
          setLoading(false);
          return;
        }

        // No MFA - prompt for setup (mandatory unless admin)
        const userRole = (getFieldValue(match, 'Role') ?? 'Student').toLowerCase();
        saveSession({
          email,
          role: userRole,
          displayName: getFieldValue(match, 'Display Name') ?? email,
          nodeId: match.id,
          mfaVerified: userRole === 'admin',
        });

        if (userRole === 'admin') {
          navigate('/dashboard');
        } else {
          // Non-admin users must set up MFA
          navigate('/mfa/setup');
        }
      } else {
        // Signup
        if (match) {
          setError('An account with this email already exists. Log in instead.');
          setLoading(false);
          return;
        }

        const roleFieldValue = selectedRole === 'teacher' ? 'r-teacher' : 'r-student';
        const pwHash = await hashPassword(password);
        await createNode(PROJECTS.userProfiles, {
          'OIDC Sub': '',
          Email: email,
          'Display Name': name || email.split('@')[0],
          Role: roleFieldValue,
          'Linked Student ID': '',
          'Linked Teacher ID': '',
          Instrument: '',
          'Skill Level': '',
          'Created At': new Date().toISOString(),
          'Password Hash': pwHash,
          'TOTP Secret': '',
          'MFA Enabled': 'mfa-no',
        });

        // Log in after signup
        const freshNodes = await getNodes(PROJECTS.userProfiles);
        const newMatch = freshNodes.find((n) => {
          const em = getFieldValue(n, 'Email');
          return em && em.toLowerCase() === email.toLowerCase();
        });
        if (newMatch) {
          saveSession({
            email,
            role: selectedRole,
            displayName: name || email.split('@')[0],
            nodeId: newMatch.id,
            mfaVerified: false,
          });

          navigate('/student-onboarding');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{APP_NAME}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">I want to join as</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedRole === 'student'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('teacher')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedRole === 'teacher'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Teacher
                  </button>
                </div>
                {selectedRole === 'teacher' && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    You'll complete a short onboarding form after creating your account.
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
                minLength={8}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="text-sm text-primary hover:underline"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">Secure login with</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">PBKDF2 + TOTP two-factor auth</span>
        </div>
      </div>
    </div>
  );
}

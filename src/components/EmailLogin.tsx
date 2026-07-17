import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertTriangle, Shield, Music, GraduationCap, User } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { getNodes, getFieldValue, updateNode, createNode } from '@/lib/genesis-data';
import { hashPassword, verifyPassword, saveSession, getSession } from '@/lib/auth';
import { PROJECTS, APP_NAME } from '@/config/app';
import type { UserRole } from '@/config/app';

interface LoginProps {
  onMfaRequired: (email: string, nodeId: string) => void;
}

export function EmailLogin({ onMfaRequired }: LoginProps) {
  const navigate = useNavigate();
  const auth = useAuth();
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
                placeholder=""""""""""
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
            {loading ? 'Please wait&' : mode === 'login' ? 'Sign in' : 'Create account'}
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

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 text-muted-foreground">or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => auth.signinRedirect()}
          disabled={auth.isLoading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/50 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>

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

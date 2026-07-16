import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { getNodes, getFieldValue } from '@/lib/genesis-data';
import { getSession, clearSession, saveSession } from '@/lib/auth';
import { verifyTOTP } from '@/lib/auth';
import { PROJECTS } from '@/config/app';

export function MFAVerify() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.mfaVerified) {
      navigate('/dashboard');
      return;
    }
    setEmail(session.email);
    inputRef.current?.focus();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setError(null);
    setLoading(true);

    try {
      const session = getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const nodes = await getNodes(PROJECTS.userProfiles);
      const match = nodes.find((n) => {
        const em = getFieldValue(n, 'Email');
        return em && em.toLowerCase() === session.email.toLowerCase();
      });

      if (!match) {
        setError('Account not found.');
        setLoading(false);
        return;
      }

      const secret = getFieldValue(match, 'TOTP Secret') ?? '';
      const valid = await verifyTOTP(code, secret);
      if (!valid) {
        setError('Invalid code. Try again.');
        setLoading(false);
        setCode('');
        inputRef.current?.focus();
        return;
      }

      saveSession({
        email: session.email,
        role: session.role,
        displayName: session.displayName,
        nodeId: session.nodeId,
        mfaVerified: true,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Two-factor authentication</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Enter the 6-digit code from your authenticator app for {email}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-3xl tracking-[0.5em] px-4 py-3 rounded-xl border border-border bg-card font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoComplete="one-time-code"
          />

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <button
          onClick={handleCancel}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to login
        </button>
      </div>
    </div>
  );
}

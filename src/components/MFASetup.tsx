import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Check, Copy, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { getNodes, getFieldValue, updateNode } from '@/lib/genesis-data';
import { generateTOTPSecret, buildTOTPUri, verifyTOTP, getSession, clearSession, saveSession } from '@/lib/auth';
import { PROJECTS } from '@/config/app';

export function MFASetup() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'generate' | 'verify'>('generate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    setNodeId(session.nodeId);
    setEmail(session.email);
    setIsAdmin(session.role.toLowerCase() === 'admin');

    const newSecret = generateTOTPSecret();
    setSecret(newSecret);
    setUri(buildTOTPUri(session.email, newSecret));
  }, [navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setError(null);
    setLoading(true);

    try {
      const valid = await verifyTOTP(code, secret);
      if (!valid) {
        setError('Invalid code. Try again.');
        setLoading(false);
        setCode('');
        inputRef.current?.focus();
        return;
      }

      await updateNode(PROJECTS.userProfiles, nodeId, {
        'TOTP Secret': secret,
        'MFA Enabled': 'mfa-yes',
      });

      saveSession({
        email,
        role: getSession()?.role ?? 'student',
        displayName: getSession()?.displayName ?? email,
        nodeId,
        mfaVerified: true,
      });

      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    navigate('/dashboard');
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const handleCancel = () => {
    clearSession();
    navigate('/login');
  };

  const qrUrl = uri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}&margin=10`
    : '';

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <Check className="w-7 h-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold">MFA enabled</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Your account is now protected with two-factor authentication.
          </p>
          <button
            onClick={handleDone}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Continue to dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Set up two-factor auth</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Scan this QR code with Google Authenticator, Authy, or any TOTP app.
        </p>

        {qrUrl && (
          <div className="rounded-xl border border-border bg-white p-4 inline-block mb-4">
            <img
              src={qrUrl}
              alt="TOTP QR Code"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mb-6">
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {showSecret ? secret : '••••••••••••••••'}
          </code>
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(secret); }}
            className="text-muted-foreground hover:text-foreground"
            title="Copy secret"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-sm text-muted-foreground">Enter the 6-digit code to confirm</p>
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
            {loading ? 'Verifying…' : 'Confirm'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {isAdmin ? (
          <button
            onClick={handleSkip}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip (super admin only)
          </button>
        ) : (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            MFA is required for all non-admin accounts to protect your data.
          </div>
        )}

        <button
          onClick={handleCancel}
          className="block mx-auto mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel and sign out
        </button>
      </div>
    </div>
  );
}

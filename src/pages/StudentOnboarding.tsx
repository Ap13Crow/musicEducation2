import { useState } from 'react';
import { Music, ExternalLink, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '@/lib/auth';
import { APP_NAME } from '@/config/app';

const STUDENT_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSccXOXC-uwT3HYHwx9Fth0p3oSGl6702KZ_6rc4tnn_xTQ5Ew/viewform?embedded=true';

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const session = getSession();
  const isTeacher = session?.role?.toLowerCase() === 'teacher';

  const handleContinue = () => {
    setSubmitted(true);
  };

  const handleNext = () => {
    if (isTeacher) {
      navigate('/teacher-application');
    } else {
      navigate('/mfa/setup');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Thanks for telling us about yourself</h1>
          <p className="text-muted-foreground mb-2">
            Your responses help us personalize your experience on {APP_NAME}.
          </p>
          {isTeacher ? (
            <p className="text-sm text-muted-foreground mb-8">
              Now let's complete your teacher profile - you'll fill in a short teaching background form next.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-8">
              Let's finish setting up your account.
            </p>
          )}
          <button
            onClick={handleNext}
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
      <div className="max-w-3xl mx-auto">
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
            Tell us a bit about your musical background so we can tailor your experience.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">Student Questionnaire</span>
            <a
              href={STUDENT_FORM_URL.replace('?embedded=true', '')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Open in new tab
            </a>
          </div>
          <iframe
            src={STUDENT_FORM_URL}
            className="w-full border-0"
            style={{ height: '640px' }}
            title="Student Questionnaire"
          />
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-3">
            After completing the form above, click below to continue.
          </p>
          <button
            onClick={handleContinue}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            I've completed the form
          </button>
        </div>
      </div>
    </div>
  );
}

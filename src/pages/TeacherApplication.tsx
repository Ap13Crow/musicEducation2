import { useState } from 'react';
import { Music, ExternalLink, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '@/config/app';

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdwyAa8I03rEW4zkq6YKytgLUxzyP0vUtu8pj7N_Dz1FQJsJA/viewform?embedded=true';
const FORM_OPEN_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdwyAa8I03rEW4zkq6YKytgLUxzyP0vUtu8pj7N_Dz1FQJsJA/viewform?usp=dialog';

export default function TeacherApplication() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const handleContinue = () => {
    setSubmitted(true);
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
            Your teacher application has been received. Our team will review it and get back to you within 2-3 business days.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            You can continue using {APP_NAME} as a student in the meantime.
          </p>
          <button
            onClick={() => navigate('/mfa/setup')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Continue
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
          <h1 className="text-2xl font-bold">Teacher Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Complete the form below to apply as a teacher on {APP_NAME}. After review, you'll get your own teacher profile and calendar.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">Teacher Application Form</span>
            <a
              href={FORM_OPEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Open in new tab
            </a>
          </div>
          <iframe
            src={GOOGLE_FORM_URL}
            className="w-full border-0"
            style={{ height: '640px' }}
            title="Teacher Application Form"
          />
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-3">
            After completing the form above, click below to finish setting up your account.
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

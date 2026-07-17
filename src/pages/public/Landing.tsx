import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { Music, BookOpen, Ticket, GraduationCap, Sparkles, ArrowRight, Star, Users, Shield } from 'lucide-react';
import { APP_NAME } from '@/config/app';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: GraduationCap, title: 'Expert Teachers', desc: 'Learn from accomplished musicians with proven teaching records and AI-evaluated pedagogy.' },
  { icon: BookOpen, title: 'Online Courses', desc: 'Structured courses from beginner to advanced, with AI-personalized learning paths.' },
  { icon: Ticket, title: 'Live Events', desc: 'Concerts, masterclasses, and workshops curated for your musical journey.' },
  { icon: Sparkles, title: 'AI Evaluation', desc: 'Smart feedback on your playing  technique, musicality, and progress tracking.' },
  { icon: Users, title: 'Community', desc: 'Connect with fellow musicians, share progress, and learn together in a safe space.' },
  { icon: Shield, title: 'Safe Environment', desc: 'AI-moderated chat and strict privacy controls protect every student.' },
];

const TESTIMONIALS = [
  { quote: 'The AI evaluations completely changed how I practice. I know exactly what to work on.', name: 'Sofia M.', role: 'Piano Student' },
  { quote: 'Teaching here gives me tools I never had before. I can see every student\'s growth in real time.', name: 'Marco F.', role: 'Piano Teacher' },
  { quote: 'My daughter went from beginner to performing at recitals in 6 months. The progress tracking is incredible.', name: 'Elena K.', role: 'Parent' },
];

export default function Landing() {
  const auth = useAuth();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Music Education
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
              Master your instrument,{' '}
              <span className="text-primary">guided by AI</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              {APP_NAME} combines expert teachers, structured courses, and live events with
              AI-powered evaluation that shows you exactly how to improve  one practice session at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={() => auth.signinRedirect()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Start Learning Free
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Everything you need to grow</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Three pillars of musical development, united by AI-powered insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 hover:border-primary/20 transition-all">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">What people say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-20 text-center">
        <div className="max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Music className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-4">
            Ready to start your journey?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join students and teachers already growing with {APP_NAME}.
          </p>
          <button
            onClick={() => auth.signinRedirect()}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Get Started  It is Free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

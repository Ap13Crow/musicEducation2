import { Component, lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useRoutes } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { GenesisAuth } from '@/lib/genesis-auth';
import { PublicLayout } from '@/components/PublicLayout';
import { AppLayout } from '@/components/AppLayout';
import { EmailLogin } from '@/components/EmailLogin';
import { MFAVerify } from '@/components/MFAVerify';
import { MFASetup } from '@/components/MFASetup';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getSession, clearSession } from '@/lib/auth';
import { useRoleStore } from '@/stores/roleStore';
import { AGENT_ID, PUBLIC_AGENT_ID, APP_NAME } from '@/config/app';

const FloatingAgentChat = lazy(() =>
  import('@/components/blocks/agent-chat/FloatingAgentChat').then((m) => ({
    default: m.FloatingAgentChat,
  }))
);

class SafeAgentChat extends Component<{ children: React.ReactNode }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown) {
    console.error('[SafeAgentChat] FloatingAgentChat crashed:', error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const Landing = lazy(() => import('@/pages/public/Landing'));
const PublicCourses = lazy(() => import('@/pages/public/Courses'));
const PublicEvents = lazy(() => import('@/pages/public/Events'));
const PublicTeachers = lazy(() => import('@/pages/public/Teachers'));

const Onboarding = lazy(() => import('@/pages/Onboarding'));
const StudentOnboarding = lazy(() => import('@/pages/StudentOnboarding'));
const TeacherApplication = lazy(() => import('@/pages/TeacherApplication'));

const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'));
const CourseCatalog = lazy(() => import('@/pages/student/CourseCatalog'));
const TeacherDirectory = lazy(() => import('@/pages/student/TeacherDirectory'));
const TeacherDetail = lazy(() => import('@/pages/student/TeacherDetail'));
const StudentCourses = lazy(() => import('@/pages/student/MyCourses'));
const CourseViewer = lazy(() => import('@/pages/student/CourseViewer'));
const MusicLibrary = lazy(() => import('@/pages/student/MusicLibrary'));
const ScoreDetail = lazy(() => import('@/pages/student/ScoreDetail'));
const StudentBookings = lazy(() => import('@/pages/student/MyBookings'));
const StudentEvents = lazy(() => import('@/pages/student/Events'));
const StudentFriends = lazy(() => import('@/pages/student/Friends'));
const StudentProfile = lazy(() => import('@/pages/student/Profile'));

const TeacherDashboard = lazy(() => import('@/pages/teacher/Dashboard'));
const TeacherStudents = lazy(() => import('@/pages/teacher/Students'));
const TeacherCourses = lazy(() => import('@/pages/teacher/MyCourses'));
const TeacherCourseBuilder = lazy(() => import('@/pages/teacher/CourseBuilder'));
const TeacherBookings = lazy(() => import('@/pages/teacher/MyBookings'));
const TeacherEvents = lazy(() => import('@/pages/teacher/Events'));
const TeacherProfile = lazy(() => import('@/pages/teacher/Profile'));

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminStudents = lazy(() => import('@/pages/admin/Students'));
const AdminTeachers = lazy(() => import('@/pages/admin/Teachers'));
const AdminCourses = lazy(() => import('@/pages/admin/Courses'));
const AdminCourseBuilder = lazy(() => import('@/pages/teacher/CourseBuilder'));
const AdminBookings = lazy(() => import('@/pages/admin/Bookings'));
const AdminEvents = lazy(() => import('@/pages/admin/Events'));
const AdminUsers = lazy(() => import('@/pages/admin/Users'));
const AdminProfile = lazy(() => import('@/pages/student/Profile'));

function PageSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  );
}

function FullScreenSpinner() {
  return (
    <div className="genesis__spinner-container">
      <div className="genesis__spinner-ring" />
    </div>
  );
}

function LazyPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
  );
}

function getRoleRouteConfigs(role: string) {
  const catchAll = { path: '*', element: <Navigate to="/dashboard" replace /> };

  if (role === 'student') {
    return [
      { path: 'dashboard', element: <LazyPage component={StudentDashboard} /> },
      { path: 'discover/courses', element: <LazyPage component={CourseCatalog} /> },
      { path: 'discover/teachers', element: <LazyPage component={TeacherDirectory} /> },
      { path: 'discover/teachers/:teacherId', element: <LazyPage component={TeacherDetail} /> },
      { path: 'my-courses', element: <LazyPage component={StudentCourses} /> },
      { path: 'my-courses/:courseId', element: <LazyPage component={CourseViewer} /> },
      { path: 'library', element: <LazyPage component={MusicLibrary} /> },
      { path: 'library/score/:scoreId', element: <LazyPage component={ScoreDetail} /> },
      { path: 'my-bookings', element: <LazyPage component={StudentBookings} /> },
      { path: 'events', element: <LazyPage component={StudentEvents} /> },
      { path: 'friends', element: <LazyPage component={StudentFriends} /> },
      { path: 'profile', element: <LazyPage component={StudentProfile} /> },
      catchAll,
    ];
  }

  if (role === 'teacher') {
    return [
      { path: 'dashboard', element: <LazyPage component={TeacherDashboard} /> },
      { path: 'students', element: <LazyPage component={TeacherStudents} /> },
      { path: 'my-courses', element: <LazyPage component={TeacherCourses} /> },
      { path: 'my-courses/:courseId', element: <LazyPage component={CourseViewer} /> },
      { path: 'course-builder', element: <LazyPage component={TeacherCourseBuilder} /> },
      { path: 'my-bookings', element: <LazyPage component={TeacherBookings} /> },
      { path: 'events', element: <LazyPage component={TeacherEvents} /> },
      { path: 'profile', element: <LazyPage component={TeacherProfile} /> },
      catchAll,
    ];
  }

  if (role === 'admin') {
    return [
      { path: 'dashboard', element: <LazyPage component={AdminDashboard} /> },
      { path: 'admin/students', element: <LazyPage component={AdminStudents} /> },
      { path: 'admin/teachers', element: <LazyPage component={AdminTeachers} /> },
      { path: 'admin/courses', element: <LazyPage component={AdminCourses} /> },
      { path: 'course-builder', element: <LazyPage component={AdminCourseBuilder} /> },
      { path: 'admin/bookings', element: <LazyPage component={AdminBookings} /> },
      { path: 'admin/events', element: <LazyPage component={AdminEvents} /> },
      { path: 'admin/users', element: <LazyPage component={AdminUsers} /> },
      { path: 'profile', element: <LazyPage component={AdminProfile} /> },
      catchAll,
    ];
  }

  // moderator
  return [
    { path: 'dashboard', element: <LazyPage component={AdminDashboard} /> },
    { path: 'admin/students', element: <LazyPage component={AdminStudents} /> },
    { path: 'admin/teachers', element: <LazyPage component={AdminTeachers} /> },
    { path: 'admin/courses', element: <LazyPage component={AdminCourses} /> },
    { path: 'course-builder', element: <LazyPage component={AdminCourseBuilder} /> },
    { path: 'admin/events', element: <LazyPage component={AdminEvents} /> },
    { path: 'profile', element: <LazyPage component={AdminProfile} /> },
    catchAll,
  ];
}

function DashboardRoutes({ actualRole }: { actualRole: string }) {
  const viewedRole = useRoleStore((s) => s.viewedRole);
  const effectiveRole = viewedRole ?? actualRole;

  const routes = useMemo(() => [
    {
      element: <AppLayout />,
      children: getRoleRouteConfigs(effectiveRole),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [effectiveRole]);

  return useRoutes(routes);
}

function LoginPage() {
  const [mfaEmail, setMfaEmail] = useState<string | null>(null);
  const [mfaNodeId, setMfaNodeId] = useState<string | null>(null);

  if (mfaEmail && mfaNodeId) {
    return (
      <Suspense fallback={<FullScreenSpinner />}>
        <MFAVerify />
      </Suspense>
    );
  }

  return (
    <EmailLogin
      onMfaRequired={(email, nodeId) => {
        setMfaEmail(email);
        setMfaNodeId(nodeId);
      }}
    />
  );
}

function ChatWidget() {
  return (
    <SafeAgentChat>
      <Suspense fallback={null}>
        <FloatingAgentChat
          agentId={AGENT_ID}
          publicAgentId={PUBLIC_AGENT_ID}
          title={APP_NAME}
          accent={1}
          suggestions={[
            'Show me my progress and recent evaluations',
            'Recommend a course for my instrument',
            'What events are coming up?',
            'Book a lesson with a teacher',
          ]}
        />
      </Suspense>
    </SafeAgentChat>
  );
}

function isSessionValid(s: unknown): s is { email: string; role: string; displayName: string; nodeId: string; mfaVerified: boolean } {
  if (s == null || typeof s !== 'object') return false;
  const o = s as Record<string, unknown>;
  return typeof o.email === 'string' && typeof o.role === 'string' && typeof o.mfaVerified === 'boolean';
}

class SafeSection extends Component<{ name: string; fallback?: React.ReactNode; children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[SafeSection:${this.props.name}] crash:`, error.name, error.message, error.stack?.slice(0, 400), info.componentStack?.slice(0, 400));
  }
  render() {
    if (this.state.error) {
      if (this.props.fallback !== undefined) return <>{this.props.fallback}</>;
      return (
        <div className="p-4 m-4 rounded-lg border border-destructive/20 bg-destructive/5 text-sm text-muted-foreground">
          <strong>{this.props.name}</strong> failed: {this.state.error.message || this.state.error.name || 'Unknown'}
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}

class MainGateErrorBoundary extends Component<
  { children: React.ReactNode; section: string },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[MainGate:${this.props.section}] render crash:`,
      error.name,
      error.message,
      error.toString(),
      error.stack?.slice(0, 600),
      info.componentStack?.slice(0, 600),
    );
  }
  handleReset = () => {
    if (getSession() != null) clearSession();
    this.setState({ error: null });
    window.location.href = '/login';
  };
  render() {
    if (this.state.error) {
      const msg = errorToString(this.state.error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-lg font-bold">Dashboard Error</h2>
            <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-lg p-3 text-left whitespace-pre-wrap break-all">
              Section: {this.props.section}{'\n'}
              Type: {this.state.error.name}{'\n'}
              {msg}
            </p>
            <button onClick={this.handleReset} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              Try signing in again
            </button>
          </div>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}

function errorToString(e: Error): string {
  const parts: string[] = [];
  if (e.message) parts.push(`Message: ${e.message}`);
  if (e.stack) parts.push(`Stack: ${e.stack.slice(0, 500)}`);
  return parts.join('\n') || 'No error details available';
}

function MainGate() {
  const auth = useAuth();
  const { profile, loading } = useCurrentUser();
  const rawSession = getSession();
  const session = isSessionValid(rawSession) ? rawSession : null;
  const emailAuthed = session !== null && session.mfaVerified;

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  // Email-authenticated user
  if (emailAuthed) {
    const actualRole = session.role.toLowerCase();
    return (
      <MainGateErrorBoundary section={`email-${actualRole}`}>
        <SafeSection name="email-chat" fallback={null}>
          <ChatWidget />
        </SafeSection>
        <SafeSection name="email-routes">
          <DashboardRoutes actualRole={actualRole} />
        </SafeSection>
      </MainGateErrorBoundary>
    );
  }

  // OIDC loading
  if (auth.isLoading || loading) {
    return <FullScreenSpinner />;
  }

  // OIDC authenticated, needs onboarding
  if (auth.isAuthenticated && !profile) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/*" element={<Onboarding />} />
        </Routes>
      </Suspense>
    );
  }

  // OIDC authenticated with profile
  if (auth.isAuthenticated && profile) {
    const actualRole = profile.role;
    return (
      <MainGateErrorBoundary section={`oidc-${actualRole}`}>
        <DashboardRoutes actualRole={actualRole} />
        <ChatWidget />
      </MainGateErrorBoundary>
    );
  }

  // Public (not authenticated)
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/courses" element={<PublicCourses />} />
          <Route path="/events" element={<PublicEvents />} />
          <Route path="/teachers" element={<PublicTeachers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

const App: React.FC = function () {
  return (
    <GenesisAuth>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <Suspense fallback={<FullScreenSpinner />}>
              <LoginPage />
            </Suspense>
          } />
          <Route path="/mfa/setup" element={
            <Suspense fallback={<FullScreenSpinner />}>
              <MFASetup />
            </Suspense>
          } />
          <Route path="/mfa/verify" element={
            <Suspense fallback={<FullScreenSpinner />}>
              <MFAVerify />
            </Suspense>
          } />
          <Route path="/teacher-application" element={
            <Suspense fallback={<FullScreenSpinner />}>
              <TeacherApplication />
            </Suspense>
          } />
          <Route path="/student-onboarding" element={
            <Suspense fallback={<FullScreenSpinner />}>
              <StudentOnboarding />
            </Suspense>
          } />
          <Route path="*" element={<MainGate />} />
        </Routes>
      </BrowserRouter>
    </GenesisAuth>
  );
};

export default App;

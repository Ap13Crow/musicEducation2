import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Ticket,
  UserCircle,
  Music,
  Users,
  GraduationCap,
  HeartHandshake,
  LogOut,
  Shield,
  Search,
  Library,
  PenTool,
} from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getSession, clearSession } from '@/lib/auth';
import { useRoleStore } from '@/stores/roleStore';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import type { UserRole } from '@/config/app';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const ROLE_NAV: Record<UserRole, NavItem[]> = {
  student: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/discover/courses', icon: Search, label: 'Discover Courses' },
    { path: '/discover/teachers', icon: Users, label: 'Find a Teacher' },
    { path: '/my-courses', icon: BookOpen, label: 'My Courses' },
    { path: '/my-bookings', icon: CalendarDays, label: 'My Bookings' },
    { path: '/events', icon: Ticket, label: 'Events' },
    { path: '/friends', icon: HeartHandshake, label: 'Friends' },
    { path: '/library', icon: Library, label: 'Music Library' },
    { path: '/profile', icon: UserCircle, label: 'Profile' },
  ],
  teacher: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/students', icon: Users, label: 'My Students' },
    { path: '/my-courses', icon: BookOpen, label: 'My Courses' },
    { path: '/course-builder', icon: PenTool, label: 'Course Builder' },
    { path: '/library', icon: Library, label: 'Music Library' },
    { path: '/my-bookings', icon: CalendarDays, label: 'My Bookings' },
    { path: '/events', icon: Ticket, label: 'Events' },
    { path: '/profile', icon: UserCircle, label: 'Profile' },
  ],
  admin: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/students', icon: Users, label: 'Students' },
    { path: '/admin/teachers', icon: GraduationCap, label: 'Teachers' },
    { path: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { path: '/course-builder', icon: PenTool, label: 'Course Builder' },
    { path: '/library', icon: Library, label: 'Music Library' },
    { path: '/admin/bookings', icon: CalendarDays, label: 'Bookings' },
    { path: '/admin/events', icon: Ticket, label: 'Events' },
    { path: '/admin/users', icon: Shield, label: 'Users' },
    { path: '/profile', icon: UserCircle, label: 'Profile' },
  ],
  moderator: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/students', icon: Users, label: 'Students' },
    { path: '/admin/teachers', icon: GraduationCap, label: 'Teachers' },
    { path: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { path: '/course-builder', icon: PenTool, label: 'Course Builder' },
    { path: '/library', icon: Library, label: 'Music Library' },
    { path: '/admin/events', icon: Ticket, label: 'Events' },
    { path: '/profile', icon: UserCircle, label: 'Profile' },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Admin',
  moderator: 'Moderator',
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const { profile } = useCurrentUser();
  const [emailSession] = useState(() => getSession());
  const viewedRole = useRoleStore((s) => s.viewedRole);

  const effectiveProfile = profile ?? (emailSession ? {
    displayName: emailSession.displayName,
    role: emailSession.role as UserRole,
    email: emailSession.email,
  } : null);

  const actualRole: UserRole = (effectiveProfile?.role as UserRole) ?? 'student';
  const displayRole: UserRole = viewedRole ?? actualRole;
  const displayName = effectiveProfile?.displayName ?? 'User';
  const navItems = ROLE_NAV[displayRole] ?? ROLE_NAV.student;

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleSignOut = () => {
    if (emailSession) {
      clearSession();
      window.location.href = '/login';
    } else {
      auth.signoutRedirect();
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-16 lg:w-56 border-r border-border bg-card shrink-0">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-3 h-14 px-4 border-b border-border hover:bg-muted/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="hidden lg:block font-semibold text-sm tracking-tight truncate">
          {APP_NAME}
        </span>
      </button>

      <nav className="flex flex-col gap-1 p-2 mt-2 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <RoleSwitcher actualRole={actualRole} />

      <div className="p-4 border-t border-border space-y-3">
        <div className="hidden lg:block text-xs text-muted-foreground">
          <p className="truncate font-medium text-foreground/60">{displayName}</p>
          <p>{displayRole !== actualRole ? `${ROLE_LABELS[displayRole]} (as ${ROLE_LABELS[actualRole]})` : ROLE_LABELS[actualRole]}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden lg:block">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

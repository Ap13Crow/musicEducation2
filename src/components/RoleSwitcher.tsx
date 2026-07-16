import { useCallback } from 'react';
import { Shield, GraduationCap, User } from 'lucide-react';
import { useRoleStore, getAllowedRoles } from '@/stores/roleStore';
import type { UserRole } from '@/config/app';
import { cn } from '@/lib/utils';

const ROLE_ICONS: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  moderator: Shield,
  teacher: GraduationCap,
  student: User,
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  moderator: 'Moderator',
  teacher: 'Teacher',
  student: 'Student',
};

interface RoleSwitcherProps {
  actualRole: UserRole;
  collapsed?: boolean;
}

export function RoleSwitcher({ actualRole, collapsed }: RoleSwitcherProps) {
  const viewedRole = useRoleStore((s) => s.viewedRole);
  const setViewedRole = useRoleStore((s) => s.setViewedRole);
  const allowed = getAllowedRoles(actualRole);

  // If there's only one option, don't show the switcher
  if (allowed.length <= 1) return null;

  const activeRole = viewedRole ?? actualRole;
  const ActiveIcon = ROLE_ICONS[activeRole];
  const label = ROLE_LABELS[activeRole];

  const handleSwitch = useCallback((role: UserRole) => {
    if (role === actualRole) {
      // Switching back to actual role clears the override
      useRoleStore.getState().resetViewedRole();
    } else {
      setViewedRole(role);
    }
  }, [actualRole, setViewedRole]);

  return (
    <div className="px-2 pb-2">
      {!collapsed ? (
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-3 pt-2 pb-1 select-none">
            Viewing as
          </span>
          <div className="flex flex-col gap-0.5">
            {allowed.map((role) => {
              const Icon = ROLE_ICONS[role];
              const isActive = (viewedRole ?? actualRole) === role;
              return (
                <button
                  key={role}
                  onClick={() => handleSwitch(role)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{ROLE_LABELS[role]}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex justify-center pt-1">
          <ActiveIcon className="w-4 h-4 text-muted-foreground" title={`Viewing as ${label}`} />
        </div>
      )}
    </div>
  );
}

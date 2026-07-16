import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/config/app';

const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'moderator', 'teacher', 'student'],
  moderator: ['moderator', 'teacher', 'student'],
  teacher: ['teacher', 'student'],
  student: ['student'],
};

export function getAllowedRoles(actualRole: UserRole): UserRole[] {
  return ROLE_HIERARCHY[actualRole] ?? ['student'];
}

export function getDefaultViewedRole(actualRole: UserRole): UserRole {
  return actualRole;
}

interface RoleState {
  viewedRole: UserRole | null;
  setViewedRole: (role: UserRole) => void;
  resetViewedRole: () => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      viewedRole: null,
      setViewedRole: (role) => set({ viewedRole: role }),
      resetViewedRole: () => set({ viewedRole: null }),
    }),
    { name: 'mmc:viewedRole' },
  ),
);

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import { getNodes, getFieldValue } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { UserRole, UserProfile } from '@/config/app';

function coerceRole(raw: string | null): UserRole {
  const r = (raw ?? '').toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'moderator') return 'moderator';
  if (r === 'teacher') return 'teacher';
  return 'student';
}

export function useCurrentUser() {
  const auth = useAuth();
  const isAuth = auth.isAuthenticated;
  const oidcSub = auth.user?.profile?.sub ?? '';
  const oidcEmail = auth.user?.profile?.email ?? '';
  const oidcName = auth.user?.profile?.name ?? auth.user?.profile?.preferred_username ?? '';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuth || !oidcSub) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const nodes = await getNodes(PROJECTS.userProfiles);
      const match = nodes.find((n) => {
        const v = getFieldValue(n, 'OIDC Sub');
        return v === oidcSub;
      });

      if (match) {
        const rawRole = getFieldValue(match, 'Role');
        setProfile({
          nodeId: String(match.id),
          oidcSub: String(oidcSub),
          email: String(oidcEmail || getFieldValue(match, 'Email') || ''),
          displayName: String(oidcName || getFieldValue(match, 'Display Name') || ''),
          role: coerceRole(rawRole),
          linkedStudentId: String(getFieldValue(match, 'Linked Student ID') || ''),
          linkedTeacherId: String(getFieldValue(match, 'Linked Teacher ID') || ''),
          instrument: String(getFieldValue(match, 'Instrument') || ''),
          skillLevel: String(getFieldValue(match, 'Skill Level') || ''),
        });
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [isAuth, oidcSub, oidcEmail, oidcName]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isRole = useCallback(
    (...roles: UserRole[]) => profile !== null && roles.includes(profile.role),
    [profile],
  );

  return {
    profile,
    loading,
    error,
    isAuthenticated: isAuth,
    isRole,
    refetch: fetchProfile,
  };
}

import { useState, useEffect } from 'react';
import { Shield, UserCircle } from 'lucide-react';
import { getNodes, getFieldValue } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';

const ROLE_COLORS: Record<string, string> = {
  Student: 'bg-blue-500/10 text-blue-400',
  Teacher: 'bg-emerald-500/10 text-emerald-400',
  Admin: 'bg-amber-500/10 text-amber-400',
  Moderator: 'bg-purple-500/10 text-purple-400',
};

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNodes(PROJECTS.userProfiles).then(setProfiles).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">{profiles.length} registered user{profiles.length !== 1 ? 's' : ''}</p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Instrument</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Skill</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {profiles.map((p) => {
              const role = getFieldValue(p, 'Role') ?? 'Student';
              return (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-muted-foreground" />
                      {getFieldValue(p, 'Display Name')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{getFieldValue(p, 'Email')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[role] ?? 'bg-muted text-muted-foreground'}`}>{role}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{getFieldValue(p, 'Instrument')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getFieldValue(p, 'Skill Level')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(getFieldValue(p, 'Created At'))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(d: string | null): string {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-CH', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-24 bg-muted rounded mb-2" /><div className="h-4 w-40 bg-muted rounded mb-8" />
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  );
}

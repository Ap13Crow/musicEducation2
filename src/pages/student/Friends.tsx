import { useState, useEffect } from 'react';
import { HeartHandshake, UserPlus, Clock, UserCheck, UserX, MessageCircle, Shield } from 'lucide-react';
import { getNodes, getFieldValue } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

export default function StudentFriends() {
  const { profile } = useCurrentUser();
  const [friends, setFriends] = useState<GenesisNode[]>([]);
  const [pendingSent, setPendingSent] = useState<GenesisNode[]>([]);
  const [pendingReceived, setPendingReceived] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);

  const studentName = profile?.displayName ?? '';

  useEffect(() => {
    getNodes(PROJECTS.friendRequests).then((nodes) => {
      setFriends(nodes.filter((f) => {
        const status = getFieldValue(f, 'Status');
        const from = getFieldValue(f, 'From User');
        const to = getFieldValue(f, 'To User');
        return status === 'Accepted' && (from === studentName || to === studentName);
      }));

      setPendingSent(nodes.filter((f) => {
        const status = getFieldValue(f, 'Status');
        const from = getFieldValue(f, 'From User');
        return status === 'Pending' && from === studentName;
      }));

      setPendingReceived(nodes.filter((f) => {
        const status = getFieldValue(f, 'Status');
        const to = getFieldValue(f, 'To User');
        return status === 'Pending' && to === studentName;
      }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [studentName]);

  if (loading) return <Skeleton />;

  const friendNames = friends.map((f) => {
    const from = getFieldValue(f, 'From User') ?? '';
    const to = getFieldValue(f, 'To User') ?? '';
    return from === studentName ? to : from;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Friends</h1>
        <p className="text-muted-foreground mt-1">Connect with fellow musicians</p>
      </header>

      {pendingReceived.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pending Requests</h2>
          <div className="space-y-2">
            {pendingReceived.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{getFieldValue(req, 'From User')}</p>
                    <p className="text-xs text-muted-foreground">wants to connect</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">Accept</button>
                  <button className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {friendNames.length} Friend{friendNames.length !== 1 ? 's' : ''}
        </h2>

        {friendNames.length === 0 ? (
          <div className="text-center py-16">
            <HeartHandshake className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-3">No friends yet</p>
            <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
              Friends can see each other's progress and chat. Connect with students who share your teacher or courses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {friendNames.map((name) => (
              <div key={name} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{name}</span>
                </div>
                <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors" aria-label={`Chat with ${name}`}>
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold mb-1">Safe Chat Environment</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All messages are monitored by AI to prevent sharing of personal contact information,
              external app links, phone numbers, and offensive content. This keeps our community safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-2" /><div className="h-4 w-48 bg-muted rounded mb-8" />
      <div className="h-20 bg-muted rounded-xl mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-16 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

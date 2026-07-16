import { useState, useEffect } from 'react';
import { Plus, Ticket, MapPin, CalendarDays, Users, Pencil, Trash2 } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber, createNode, updateNode, deleteNode } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Concert: 'bg-blue-500/10 text-blue-400', Masterclass: 'bg-amber-500/10 text-amber-400',
  Workshop: 'bg-emerald-500/10 text-emerald-400', Recital: 'bg-purple-500/10 text-purple-400',
  Competition: 'bg-rose-500/10 text-rose-400', Festival: 'bg-cyan-500/10 text-cyan-400',
};

export default function AdminEvents() {
  const [events, setEvents] = useState<GenesisNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GenesisNode | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ title: '', category: 'Concert', venue: '', date: '', price: '', capacity: '', status: 'Upcoming' });

  const fetchEvents = () => {
    getNodes(PROJECTS.events)
      .then((nodes) => setEvents(nodes.sort((a, b) => (getFieldValue(a, 'Date & Time') ?? '').localeCompare(getFieldValue(b, 'Date & Time') ?? ''))))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', category: 'Concert', venue: '', date: '', price: '', capacity: '', status: 'Upcoming' });
    setShowForm(true);
  };

  const openEdit = (ev: GenesisNode) => {
    setEditing(ev);
    setForm({
      title: getFieldValue(ev, 'Title') ?? ev.title ?? '',
      category: getFieldValue(ev, 'Category') ?? 'Concert',
      venue: getFieldValue(ev, 'Venue') ?? '',
      date: getFieldValue(ev, 'Date & Time') ?? '',
      price: String(getFieldNumber(ev, 'Price (CHF)') ?? ''),
      capacity: String(getFieldNumber(ev, 'Capacity') ?? ''),
      status: getFieldValue(ev, 'Status') ?? 'Upcoming',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fields: Record<string, string> = {
        Title: form.title,
        Category: form.category,
        Venue: form.venue,
        'Date & Time': form.date,
        'Price (CHF)': form.price,
        Capacity: form.capacity,
        Status: form.status,
      };

      if (editing) {
        const updateFields: Record<string, string> = {};
        for (const [k, v] of Object.entries(fields)) {
          if (v) updateFields[k] = v;
        }
        await updateNode(PROJECTS.events, editing.id, updateFields);
      } else {
        await createNode(PROJECTS.events, fields);
      }

      setShowForm(false);
      setEditing(null);
      setLoading(true);
      fetchEvents();
    } catch (err) {
      // silently fail - data will refresh
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ev: GenesisNode) => {
    const confirmed = window.confirm('Delete this event? This cannot be undone.');
    if (!confirmed) return;
    try {
      await deleteNode(PROJECTS.events, ev.id);
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    } catch {}
  };

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Manage Events</h1>
          <p className="text-muted-foreground mt-1">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />New Event
        </button>
      </header>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold">{editing ? 'Edit Event' : 'New Event'}</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {Object.keys(CATEGORY_COLORS).map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="Upcoming">Upcoming</option>
                  <option value="Live Now">Live Now</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <input type="text" value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date & Time</label>
              <input type="datetime-local" value={form.date ? form.date.substring(0, 16) : ''} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Price (CHF)</label>
                <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-16"><Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No events yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => {
            const cat = getFieldValue(ev, 'Category') ?? '';
            const status = getFieldValue(ev, 'Status') ?? '';
            return (
              <div key={ev.id} className={cn('rounded-xl border bg-card p-5 group', status === 'Completed' ? 'border-border opacity-70' : 'border-primary/5')}>
                <div className="flex items-start gap-2 mb-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', CATEGORY_COLORS[cat] ?? 'bg-muted text-muted-foreground')}>{cat}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{status}</span>
                </div>
                <h3 className="font-semibold text-base mb-3">{getFieldValue(ev, 'Title') ?? ev.title}</h3>
                <div className="space-y-1.5 mb-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /><span>{getFieldValue(ev, 'Venue')}</span></div>
                  <div className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /><span>{formatDate(getFieldValue(ev, 'Date & Time'))}</span></div>
                  <div className="flex items-center gap-1.5"><Users className="w-3 h-3" /><span>{getFieldNumber(ev, 'Capacity')} seats</span></div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-lg font-bold text-primary tabular-nums">CHF {getFieldNumber(ev, 'Price (CHF)')?.toFixed(0) ?? '—'}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors" aria-label="Edit"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(ev)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" aria-label="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(d: string | null): string {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-CH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="flex items-center justify-between mb-8"><div className="h-8 w-40 bg-muted rounded" /><div className="h-10 w-28 bg-muted rounded-xl" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-56 bg-muted rounded-xl" />))}</div>
    </div>
  );
}

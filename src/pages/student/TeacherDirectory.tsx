import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Clock, GraduationCap, Music, MessageSquare, Users } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

const INSTRUMENT_OPTIONS = ['Piano', 'Violin', 'Cello', 'Guitar', 'Flute', 'Voice', 'Trumpet', 'Drums'];
const CERT_OPTIONS = ['Junior Teacher', 'Senior Teacher', 'Master Teacher', 'Professor'];
const LOCATION_OPTIONS = ['Room 1', 'Room 2', 'Room 3', 'Online', 'Town A', 'Town B'];

interface TeacherData {
  node: GenesisNode;
  name: string;
  instrument: string;
  specialization: string;
  certification: string;
  rating: number;
  hourlyRate: number;
  location: string;
  yearsExperience: number;
  bio: string;
  email: string;
  reviewCount: number;
  reviews: { score: number; category: string; notes: string; date: string }[];
}

export default function TeacherDirectory() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [instFilter, setInstFilter] = useState<string | null>(null);
  const [certFilter, setCertFilter] = useState<string | null>(null);
  const [locFilter, setLocFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBio, setExpandedBio] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getNodes(PROJECTS.teachers), getNodes(PROJECTS.evaluations)]).then(([teacherNodes, evalNodes]) => {
      const teacherEvals = evalNodes.filter((e) => getFieldValue(e, 'Evaluated Role') === 'Teacher');
      const map: TeacherData[] = teacherNodes.map((t) => {
        const name = getFieldValue(t, 'Name') ?? t.title ?? '';
        const reviews = teacherEvals
          .filter((ev) => getFieldValue(ev, 'User') === name)
          .map((ev) => ({
            score: getFieldNumber(ev, 'Score') ?? 0,
            category: getFieldValue(ev, 'Category') ?? '',
            notes: getFieldValue(ev, 'AI Notes') ?? '',
            date: getFieldValue(ev, 'Evaluation Date') ?? '',
          }));
        return {
          node: t,
          name,
          instrument: getFieldValue(t, 'Instrument') ?? '',
          specialization: getFieldValue(t, 'Specialization') ?? '',
          certification: getFieldValue(t, 'Certification') ?? '',
          rating: getFieldNumber(t, 'Rating') ?? 0,
          hourlyRate: getFieldNumber(t, 'Hourly Rate (CHF)') ?? 0,
          location: getFieldValue(t, 'Location') ?? '',
          yearsExperience: getFieldNumber(t, 'Years of Experience') ?? 0,
          bio: getFieldValue(t, 'Bio') ?? '',
          email: getFieldValue(t, 'Email') ?? '',
          reviewCount: reviews.length,
          reviews,
        };
      });
      setTeachers(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = teachers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.bio.toLowerCase().includes(q) || t.instrument.toLowerCase().includes(q));
    }
    if (instFilter) result = result.filter((t) => t.instrument === instFilter);
    if (certFilter) result = result.filter((t) => t.certification === certFilter);
    if (locFilter) result = result.filter((t) => t.location === locFilter);
    return result;
  }, [teachers, search, instFilter, certFilter, locFilter]);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Find a Teacher</h1>
        <p className="text-muted-foreground mt-1">{teachers.length} teachers across {INSTRUMENT_OPTIONS.length} instruments</p>
      </header>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name, instrument, or keyword..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <button onClick={() => setShowFilters((v) => !v)} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap', showFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/30')}>
          <Filter className="w-4 h-4" />Filters{(instFilter || certFilter || locFilter) ? <span className="w-1.5 h-1.5 rounded-full bg-primary" /> : null}
        </button>
      </div>

      {showFilters ? (
        <div className="space-y-3 mb-8 p-4 rounded-xl border border-border bg-card">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Instrument</p>
            <div className="flex flex-wrap gap-2">
              {INSTRUMENT_OPTIONS.map((i) => (
                <button key={i} onClick={() => setInstFilter(instFilter === i ? null : i)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors', instFilter === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>{i}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Certification</p>
            <div className="flex flex-wrap gap-2">
              {CERT_OPTIONS.map((c) => (
                <button key={c} onClick={() => setCertFilter(certFilter === c ? null : c)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors', certFilter === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Location</p>
            <div className="flex flex-wrap gap-2">
              {LOCATION_OPTIONS.map((l) => (
                <button key={l} onClick={() => setLocFilter(locFilter === l ? null : l)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors', locFilter === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Teacher Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16"><Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" /><p className="text-muted-foreground">No teachers match your filters</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.node.id} className="rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all">
              <div className="p-5">
                {/* Header: Name + Rating */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <button onClick={() => navigate(`/discover/teachers/${t.node.id}`)} className="text-left hover:text-primary transition-colors">
                      <h3 className="font-semibold text-base">{t.name}</h3>
                    </button>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Music className="w-3 h-3" />{t.instrument} · {t.specialization}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold tabular-nums">{t.rating}</span>
                    </div>
                    {t.reviewCount > 0 ? <p className="text-[10px] text-muted-foreground">{t.reviewCount} review{t.reviewCount !== 1 ? 's' : ''}</p> : null}
                  </div>
                </div>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t.certification}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{t.location}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{t.yearsExperience}y exp</span>
                </div>

                {/* Bio */}
                <button onClick={(e) => { e.stopPropagation(); setExpandedBio(expandedBio === t.node.id ? null : t.node.id); }} className="text-left w-full">
                  <p className={cn('text-xs text-muted-foreground leading-relaxed', expandedBio !== t.node.id && 'line-clamp-2')}>{t.bio}</p>
                </button>

                {/* Reviews */}
                {t.reviews.length > 0 ? (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    {t.reviews.slice(0, expandedBio === t.node.id ? t.reviews.length : 1).map((r, i) => (
                      <div key={i} className="bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star key={si} className={cn('w-3 h-3', si < Math.round(r.score / 20) ? 'text-amber-400 fill-amber-400' : 'text-muted')} />
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-1">{r.category}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{r.notes}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Bottom bar */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20 rounded-b-xl">
                <span className="text-sm font-bold tabular-nums">CHF {t.hourlyRate}<span className="text-[10px] text-muted-foreground font-normal">/hr</span></span>
                <button onClick={() => navigate(`/discover/teachers/${t.node.id}`)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">Book Lesson</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse">
      <div className="h-8 w-40 bg-muted rounded mb-2" /><div className="h-4 w-56 bg-muted rounded mb-6" />
      <div className="h-10 bg-muted rounded-xl mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-72 bg-muted rounded-xl" />))}
      </div>
    </div>
  );
}

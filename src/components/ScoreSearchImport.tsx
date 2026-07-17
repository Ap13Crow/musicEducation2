import { useState, useCallback } from 'react';
import {
  Search as SearchIcon,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Music,
  FileText,
  Calendar,
  Shield,
} from 'lucide-react';
import { searchEuropeana, getEuropeanaPortalUrl } from '@/lib/europeana';
import type { EuropeanaItem, EuropeanaSearchParams } from '@/lib/europeana';
import { createNode } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { cn } from '@/lib/utils';

interface ScoreSearchImportProps {
  onImportComplete?: () => void;
}

const LICENSE_MAP: Record<string, string> = {
  'http://creativecommons.org/publicdomain/mark/1.0/': 'Public Domain Mark',
  'http://creativecommons.org/publicdomain/zero/1.0/': 'CC0 / Public Domain',
  'http://creativecommons.org/licenses/by/4.0/': 'CC BY',
  'http://creativecommons.org/licenses/by-sa/4.0/': 'CC BY-SA',
  'http://creativecommons.org/licenses/by-nc/4.0/': 'CC BY-NC',
};

function parseLicense(rights: string[]): string {
  if (!rights?.length) return 'Unknown';
  const label = LICENSE_MAP[rights[0]];
  return label ?? rights[0];
}

function parseLicenseField(rights: string[]): string | null {
  if (!rights?.length) return null;
  if (rights[0].includes('publicdomain/mark')) return 'Public Domain Mark';
  if (rights[0].includes('publicdomain/zero')) return 'CC0 / Public Domain';
  if (rights[0].includes('by/4.0') || rights[0].includes('by/3.0')) return 'CC BY';
  if (rights[0].includes('by-sa')) return 'CC BY-SA';
  if (rights[0].includes('by-nc')) return 'CC BY-NC';
  return null;
}

export default function ScoreSearchImport({ onImportComplete }: ScoreSearchImportProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EuropeanaItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<Set<string>>(new Set());
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params: EuropeanaSearchParams = {
        query: `${trimmed} sheet music`,
        rows: 12,
        reusability: 'open',
        media: true,
        type: 'TEXT',
      };
      const data = await searchEuropeana(params);
      setResults(data.items);
      setTotalResults(data.totalResults);
    } catch (err) {
      console.error('[Europeana Search]', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleImport = useCallback(async (item: EuropeanaItem) => {
    const itemId = item.id;
    if (importing.has(itemId) || imported.has(itemId)) return;

    setImporting((prev) => new Set(prev).add(itemId));
    try {
      const title = (item.title?.[0] ?? item.title ?? '').replace(/\\s*\\([^)]*\\)$/, '').trim();
      const composer = item.composer ?? '';
      const desc = item.description ?? '';
      const year = item.year?.[0] ?? '';
      const licenseLabel = parseLicenseField(item.rights ?? []);
      const imslpUrl = item.edmIsShownAt?.[0] ?? '';

      const fields: Record<string, string> = {
        Title: title,
        Composer: composer,
        Description: `${desc}${year ? ` (${year})` : ''}`,
        'IMSLP URL': imslpUrl || '',
        'Europeana ID': item.id,
        Source: 'Europeana',
      };
      if (licenseLabel) fields['License'] = licenseLabel;

      await createNode(PROJECTS.musicScores, fields);
      setImported((prev) => new Set(prev).add(itemId));
      onImportComplete?.();
    } catch (err) {
      console.error('[Import Score]', err);
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [importing, imported, onImportComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Import from Europeana</h2>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            CC0/PD scores
          </span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by composer, title, or instrument..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Searches Europeana&apos;s public domain sheet music collection  CC0 only
        </p>
      </div>

      {/* Results */}
      {error && (
        <div className="p-4 flex items-start gap-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900/30">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Search failed</p>
            <p className="text-xs mt-0.5 opacity-80">
              {error.includes('401') || error.includes('403')
                ? 'Check your Europeana API key in Space Settings ’ Secrets (key: europeana).'
                : error}
            </p>
          </div>
        </div>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <div className="p-8 text-center space-y-2">
          <Music className="w-8 h-8 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No results found for &quot;{query}&quot;</p>
          <p className="text-xs text-muted-foreground/60">Try a composer name or piece title</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
          {results.map((item) => {
            const isImporting = importing.has(item.id);
            const isImported = imported.has(item.id);
            const rights = item.rights ?? [];
            const licenseLabel = parseLicense(rights);
            const portalUrl = getEuropeanaPortalUrl(item);

            return (
              <div key={item.id} className="p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-sm font-medium leading-snug truncate">
                      {item.title?.[0] ?? 'Untitled'}
                    </h4>
                    {item.composer && (
                      <p className="text-xs text-muted-foreground">{item.composer}</p>
                    )}
                    <div className="flex flex-wrap gap-2 items-center text-[11px]">
                      {item.description && (
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {item.description}
                        </span>
                      )}
                      {item.year?.[0] && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {item.year[0]}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Shield className="w-3 h-3" />
                        {licenseLabel}
                      </span>
                      {item.provider?.[0] && (
                        <span className="text-muted-foreground/60">{item.provider[0]}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {portalUrl && (
                      <a
                        href={portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="View on Europeana"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleImport(item)}
                      disabled={isImporting || isImported}
                      className={cn(
                        'px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
                        isImported
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-default'
                          : 'bg-primary/10 text-primary hover:bg-primary/20',
                      )}
                    >
                      {isImporting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isImported ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                      {isImported ? 'Imported' : isImporting ? 'Importing' : 'Import'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalResults > results.length && (
        <div className="p-3 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Showing {results.length} of {totalResults} results  refine your search for more specific matches
          </p>
        </div>
      )}
    </div>
  );
}

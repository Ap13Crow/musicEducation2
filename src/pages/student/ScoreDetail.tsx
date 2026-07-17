import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, BookOpen, Music, Bookmark, FileText, Tag, AlertTriangle, RefreshCw, Globe, Shield } from 'lucide-react';
import { getNodes, getFieldValue, getFieldNumber, createNode, deleteNode } from '@/lib/genesis-data';
import { PROJECTS } from '@/config/app';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { GenesisNode } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';
import ScoreRenderer from '@/components/ScoreRenderer';

interface ScoreData {
  node: GenesisNode;
  title: string; composer: string; era: string; instrument: string;
  difficulty: string; genre: string; keySignature: string; pages: number;
  description: string; imslpUrl: string; gdriveUrl: string;
  source: string; license: string; europeanaId: string;
  musicXmlUrl: string;
}

const ERA_COLORS: Record<string, string> = {
  Baroque: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Classical: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Romantic: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  '20th Century': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Contemporary: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const DIFF_COLORS: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Advanced: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  Virtuoso: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function ScoreDetail() {
  const { scoreId } = useParams<{ scoreId: string }>();
  const navigate = useNavigate();
  const { profile } = useCurrentUser();
  const [score, setScore] = useState<ScoreData | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!scoreId) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [scoreNodes, userScoreNodes] = await Promise.all([
        getNodes(PROJECTS.musicScores),
        getNodes(PROJECTS.userScores),
      ]);
      const s = scoreNodes.find((n) => n.id === scoreId);
      if (!s) { setLoading(false); return; }
      const studentName = profile?.displayName ?? '';
      const saved = userScoreNodes.some(
        (us) => getFieldValue(us, 'User') === studentName && getFieldValue(us, 'Score Title') === (getFieldValue(s, 'Title') ?? '')
      );
      setIsSaved(saved);
      setScore({
        node: s, title: getFieldValue(s, 'Title') ?? '',
        composer: getFieldValue(s, 'Composer') ?? '',
        era: getFieldValue(s, 'Era') ?? '',
        instrument: getFieldValue(s, 'Instrument') ?? '',
        difficulty: getFieldValue(s, 'Difficulty') ?? '',
        genre: getFieldValue(s, 'Genre') ?? '',
        keySignature: getFieldValue(s, 'Key Signature') ?? '',
        pages: getFieldNumber(s, 'Pages') ?? 0,
        description: getFieldValue(s, 'Description') ?? '',
        imslpUrl: getFieldValue(s, 'IMSLP URL') ?? '',
        gdriveUrl: getFieldValue(s, 'Google Drive PDF URL') ?? '',
        source: getFieldValue(s, 'Source') ?? '',
        license: getFieldValue(s, 'License') ?? '',
        europeanaId: getFieldValue(s, 'Europeana ID') ?? '',
        musicXmlUrl: getFieldValue(s, 'MusicXML URL') ?? '',
      });
    } catch (err) {
      console.error('[ScoreDetail]', err);
      setFetchError(err instanceof Error ? err.message : 'Failed to load score');
    } finally {
      setLoading(false);
    }
  }, [scoreId, profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (fetchError) return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto text-center py-16 space-y-4">
      <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" />
      <p className="text-muted-foreground">Could not load this score</p>
      <p className="text-xs text-muted-foreground/60">{fetchError}</p>
      <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
        <RefreshCw className="w-4 h-4" />Retry
      </button>
    </div>
  );

  if (loading) return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded" />
      <div className="h-40 bg-muted rounded-xl" />
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  );

  const studentName = profile?.displayName ?? '';

  async function handleToggleSave() {
    if (!score) return;
    if (isSaved) {
      const userScoreNodes = await getNodes(PROJECTS.userScores);
      const entry = userScoreNodes.find(
        (us) => getFieldValue(us, 'User') === studentName && getFieldValue(us, 'Score Title') === score.title
      );
      if (entry) {
        await deleteNode(PROJECTS.userScores, entry.id);
        setIsSaved(false);
      }
    } else {
      await createNode(PROJECTS.userScores, {
        'User': studentName,
        'Score Title': score.title,
        'Notes': score.composer,
      });
      setIsSaved(true);
    }
  }

  if (!score) return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto text-center py-20">
      <Music className="w-12 h-12 mx-auto text-muted-foreground/30" />
      <p className="mt-3 text-muted-foreground">Score not found.</p>
      <button onClick={() => navigate('/library')} className="mt-4 text-sm text-primary font-medium hover:underline">Back to Library</button>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{score.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">by {score.composer}</p>
            </div>
            <button
              onClick={handleToggleSave}
              className={cn(
                'shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                isSaved
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-border text-muted-foreground hover:text-primary hover:border-primary/30'
              )}
            >
              <Bookmark className={cn('w-4 h-4 inline mr-1.5', isSaved && 'fill-current')} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {score.era && <span className={cn('px-2.5 py-1 rounded-md text-xs font-medium', ERA_COLORS[score.era] ?? 'bg-muted')}>{score.era}</span>}
            {score.difficulty && <span className={cn('px-2.5 py-1 rounded-md text-xs font-medium', DIFF_COLORS[score.difficulty] ?? 'bg-muted')}>{score.difficulty}</span>}
            {score.genre && <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">{score.genre}</span>}
            {score.keySignature && <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">{score.keySignature}</span>}
            {score.source && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                <Globe className="w-3 h-3" />
                {score.source}
              </span>
            )}
            {score.license && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Shield className="w-3 h-3" />
                {score.license}
              </span>
            )}
          </div>

          {score.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{score.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Music className="w-4 h-4 text-primary/60" /> {score.instrument}
            </div>
            {score.pages > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4 text-primary/60" /> {score.pages} pages
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="w-4 h-4 text-primary/60" /> {score.genre}
            </div>
          </div>
        </div>

        <div className="flex items-center border-t border-border divide-x divide-border">
          {score.imslpUrl && (
            <a href={score.imslpUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <ExternalLink className="w-4 h-4" /> View on IMSLP
            </a>
          )}
          {score.gdriveUrl && (
            <a href={score.gdriveUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <BookOpen className="w-4 h-4" /> Download PDF
            </a>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Score Viewer</h2>
          {score.musicXmlUrl && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-auto">Interactive</span>
          )}
        </div>

        {score.musicXmlUrl ? (
          <div className="p-4">
            <ScoreRenderer musicXmlUrl={score.musicXmlUrl} className="min-h-[500px]" />
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Interactive notation  transposable &amp; playable</span>
              <span className="text-[10px] text-muted-foreground/60">Powered by OpenSheetMusicDisplay</span>
            </div>
          </div>
        ) : score.gdriveUrl ? (
          <div className="p-0">
            <iframe
              src={score.gdriveUrl.replace(/\/view(\?.*)?$/, '/preview').replace('drive.google.com/open?id=', 'drive.google.com/file/d/') + '/preview'}
              className="w-full h-[70vh] min-h-[500px] border-0"
              title="Sheet Music PDF"
              sandbox="allow-scripts allow-same-origin allow-popups"
              allow="autoplay"
            />
            <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">PDF from Google Drive</span>
              <a href={score.gdriveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                <ExternalLink className="w-3 h-3" /> Open in Drive
              </a>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="text-center py-8 space-y-4">
              <Music className="w-10 h-10 mx-auto text-muted-foreground/30" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {score.imslpUrl
                    ? 'IMSLP does not allow embedding. View and download on IMSLP, or add a MusicXML URL for interactive notation.'
                    : score.europeanaId
                    ? 'View this score on Europeana to download it, then add a MusicXML or PDF URL for in-app viewing.'
                    : 'No viewer data available for this score yet. Use the Import tab in the Music Library to find CC0 scores from Europeana.'
                  }
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {score.imslpUrl && (
                  <a
                    href={score.imslpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on IMSLP
                  </a>
                )}
                {score.europeanaId && (
                  <a
                    href={`https://www.europeana.eu/item${score.europeanaId}?utm_source=api&utm_medium=api&utm_campaign=omesisitand`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    View on Europeana
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { Music, Loader2, AlertTriangle } from 'lucide-react';

interface ScoreRendererProps {
  musicXmlUrl?: string;
  musicXmlData?: string;
  className?: string;
}

const OSMD_CDN = 'https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js';

let osmdPromise: Promise<void> | null = null;
let osmdLoaded = false;

function loadOSMD(): Promise<void> {
  if (osmdLoaded) return Promise.resolve();
  if (osmdPromise) return osmdPromise;

  osmdPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${OSMD_CDN}"]`);
    if (existing) {
      if (osmdLoaded) return resolve();
      existing.addEventListener('load', () => { osmdLoaded = true; resolve(); });
      existing.addEventListener('error', () => reject(new Error('OSMD script load failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = OSMD_CDN;
    script.async = true;
    script.onload = () => { osmdLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('OSMD script load failed'));
    document.head.appendChild(script);
  });

  return osmdPromise;
}

export default function ScoreRenderer({ musicXmlUrl, musicXmlData, className = '' }: ScoreRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const renderScore = useCallback(async (xml: string) => {
    if (!containerRef.current) return;
    setLoading(true);
    setError(null);

    try {
      await loadOSMD();
      const OSMD = (window as any).opensheetmusicdisplay;
      if (!OSMD?.OpenSheetMusicDisplay) {
        throw new Error('OSMD not available');
      }

      // Clear previous rendering
      containerRef.current.innerHTML = '';

      const osmd = new OSMD.OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        backend: 'svg',
        drawTitle: true,
        drawSubtitle: true,
        drawComposer: true,
        drawCredits: false,
        drawPartNames: false,
        drawMeasureNumbers: false,
        pageBackgroundColor: 'transparent',
        pageFormat: 'A4',
      });

      await osmd.load(xml);
      osmd.render();
      setInitialized(true);
    } catch (err) {
      console.error('[ScoreRenderer]', err);
      setError(err instanceof Error ? err.message : 'Failed to render score');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (musicXmlData) {
      renderScore(musicXmlData);
    } else if (musicXmlUrl) {
      setLoading(true);
      setError(null);
      fetch(musicXmlUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then((xml) => renderScore(xml))
        .catch((err) => {
          console.error('[ScoreRenderer]', err);
          setError(err instanceof Error ? err.message : 'Failed to load MusicXML');
          setLoading(false);
        });
    }
  }, [musicXmlUrl, musicXmlData, renderScore]);

  const showPlaceholder = !musicXmlUrl && !musicXmlData;

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-[300px] rounded-lg overflow-x-auto ${className}`}
    >
      {showPlaceholder && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <Music className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No MusicXML score to display</p>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {initialized ? 'Rendering new score...' : 'Loading notation engine...'}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg z-10">
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <p className="text-sm text-muted-foreground">Could not render score</p>
            <p className="text-xs text-muted-foreground/60 max-w-xs">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

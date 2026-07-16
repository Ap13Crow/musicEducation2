import './index.css';
import './lib/leaflet-setup';
import './lib/gateway-auth';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { StrictMode, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.jsx';
import { GenesisRoot } from './lib/genesis.jsx';
import { setupThemeBridge } from './lib/theme-bridge';

setupThemeBridge();

// Recover from stale chunk loads after a deployment.
// `import()` failures are Promise rejections (unhandledrejection), not error events.
const CHUNK_RE = /loading chunk|failed to fetch dynamically imported module|error loading dynamically imported module/i;
function isChunkError(msg: unknown): boolean {
  return typeof msg === 'string' && CHUNK_RE.test(msg);
}
window.addEventListener('error', (event) => {
  if (event instanceof ErrorEvent && event.message != null && isChunkError(event.message)) {
    console.warn('[mmc] stale chunk (error event), reloading');
    window.location.reload();
  }
});
window.addEventListener('unhandledrejection', (event) => {
  const msg =
    (event.reason instanceof Error ? event.reason.message : String(event.reason ?? '')) +
    ' ' +
    (event.reason instanceof Error ? event.reason.stack ?? '' : '');
  if (isChunkError(msg)) {
    console.warn('[mmc] stale chunk (rejection), reloading');
    window.location.reload();
  }
});

const rootElement = document.getElementById('root')!;

/**
 * True when the app tree mounted its own next-themes ThemeProvider (apps
 * generated before template 2.3.4 do this in App.tsx). A mounted next-themes
 * provider injects an inline no-flash <script> that touches documentElement
 * and localStorage; nothing else in a Genesis app renders an inline script
 * with that shape inside #root.
 */
function appHasOwnThemeProvider(): boolean {
  for (const script of rootElement.querySelectorAll('script:not([src])')) {
    const code = script.textContent ?? '';
    if (code.includes('documentElement') && code.includes('localStorage')) {
      return true;
    }
  }
  return false;
}

/**
 * Previews share one origin, so the theme choice is stored per app (keyed via
 * the preview access token). Published apps keep the default "theme" key.
 */
function getThemeStorageKey(): string {
  try {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)director-preview-access-token=([^;]+)/);
    const token =
      new URLSearchParams(window.location.search).get('accessToken') ??
      window.sessionStorage.getItem('director-preview-access-token') ??
      (cookieMatch ? cookieMatch[1] : null);
    if (token != null) {
      const segments = token.split('.');
      const payloadSegment = segments.length === 3 ? segments[1] : null;
      if (payloadSegment != null) {
        const payload = JSON.parse(atob(payloadSegment.replace(/-/g, '+').replace(/_/g, '/')));
        if (payload != null && payload.appId != null) {
          return `theme:${payload.spaceId}:${payload.appId}`;
        }
      }
    }
  } catch {
    // Fall back to the shared key rather than break theming.
  }
  return 'theme';
}

const themeStorageKey = getThemeStorageKey();

/**
 * Contract: newly generated apps must NOT mount their own ThemeProvider.
 * ThemeGate pre-mounts one for them (attribute="class" matches the synthesized
 * tailwind darkMode: ['class'] config; toggles just call useTheme() from
 * next-themes or the @/hooks/use-theme shim).
 *
 * Apps generated before template 2.3.4 DO mount their own provider in the app
 * tree. Nesting next-themes providers is not safe: the inner one renders as an
 * inert Fragment, so an unconditional template provider would hijack the app's
 * theme config and force defaultTheme="dark" onto light-designed apps. ThemeGate
 * therefore renders the app bare first, and only mounts the template provider
 * (synchronously, before first paint) when the app tree did not bring its own.
 */
function ThemeGate({ children }: { children: ReactNode }) {
  const [mountProvider, setMountProvider] = useState(false);
  useLayoutEffect(() => {
    if (!appHasOwnThemeProvider()) {
      setMountProvider(true);
    }
  }, []);
  if (!mountProvider) {
    return <>{children}</>;
  }
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      storageKey={themeStorageKey}
    >
      {children}
    </ThemeProvider>
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <GenesisRoot>
      <ThemeGate>
        <App />
      </ThemeGate>
    </GenesisRoot>
  </StrictMode>,
);

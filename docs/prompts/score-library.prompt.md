# Taskade prompt — Build the Music Score Library (in-app rendering + legal free import)

> Paste this into the Taskade builder for My Music Coach. It replaces the comment-hack
> "scraper trigger" with a real, legally clean library: in-app notation rendering from CC0
> MusicXML, plus a live Search & Import panel and a bulk seed flow over free APIs
> (OpenScore/PDMX MusicXML + Europeana IIIF, which aggregates the Deutsche Nationalbibliothek).
> Build Phase 1 first (it's the differentiating asset).

---

You are upgrading the **Music Score Library** in My Music Coach (Taskade Genesis / React).
Keep the existing data helpers (`@/lib/genesis-data`), the `PROJECTS` map, theming, routing,
and `useCurrentUser`. Do **not** host files — store metadata + stable external URLs and render
from them. Keyed APIs must go through `GenesisClient.proxy()` with a Workspace Secret; public
APIs can be called directly.

**Principle:** prefer **public-domain / CC0** sources and record provenance + license on every
score. IMSLP forbids embedding — use it for metadata and deep links only, never in an iframe.

### Extend the existing **Music Scores Library** project with these fields
`Source` (IMSLP / OpenScore / Europeana / MuseScore-PDMX / Mutopia / Manual), `Source ID`,
`Source URL`, `License`, `MusicXML URL`, `IIIF Manifest URL`, `Audio URL`, `Imported At`.
Keep all current fields (Title, Composer, Era, Instrument, Difficulty, Genre, Key Signature,
Pages, Description, IMSLP URL, Google Drive PDF URL).

### Phase 1 — Render scores INSIDE the app (the core asset)
- Add **OpenSheetMusicDisplay** as a client dependency (and optionally **Verovio** for MEI).
- Build a reusable `<ScoreRenderer musicXmlUrl={...} />` component that fetches a score's
  `MusicXML URL` and renders engraved notation in-page. Where feasible add **transpose** and
  **play** (OSMD + a simple synth).
- In `src/pages/student/ScoreDetail.tsx`: if `MusicXML URL` is present, show `<ScoreRenderer>`
  as the primary viewer. Else if `IIIF Manifest URL` is present, embed a IIIF image viewer.
  Else fall back to the Google Drive PDF `/preview` iframe. Keep IMSLP strictly as an external
  deep-link button. **Delete the `[Scraper Trigger]` comment-POST hack.**

### Phase 2 — Live "Search & Import" panel (teacher/admin)
Add a page/panel (teacher + admin roles) that searches free sources and one-click-imports a
normalized row with full provenance:
- **Europeana** — via `GenesisClient.proxy()` with secret alias **`europeana`**. Query the
  Search API filtered to music with `reusability=open` (only openly reusable items); when a
  result has a IIIF manifest, capture `IIIF Manifest URL`. Europeana aggregates the
  **Deutsche Nationalbibliothek** and other national libraries, so this is the single best
  free API for breadth.
- **OpenScore / IMSLP metadata** — pull title/composer/work metadata and, for OpenScore,
  the CC0 `MusicXML URL`; for IMSLP, capture `Source URL` (deep link) only.
- Each "Import" writes one **Music Scores** row: map fields, set `Source`, `Source ID`,
  `Source URL`, `License`, `MusicXML URL`/`IIIF Manifest URL`/PDF as available, and
  `Imported At`. De-dupe on `Source` + `Source ID`.

### Phase 3 — Bulk seed via a Taskade flow
Create a **scheduled/manual Automation (flow)** that seeds the library from CC0 corpora and
de-dupes on `Source ID`:
- **OpenScore Lieder corpus** (GitHub: metadata CSV + raw MusicXML file URLs) → rows with
  `Source = OpenScore`, `License = CC0`, populated `MusicXML URL`.
- A **curated slice of PDMX** (public-domain MusicXML from MuseScore) → `Source = MuseScore-PDMX`.
- Optionally **Mutopia** entries. The flow uses HTTP fetch + `createNode`; never stores blobs.

### Phase 4 — Curation & linking
- Admin **review/curate queue**: edit difficulty/era/instrument tags (reuse existing selects),
  fix metadata, dedupe.
- Let a teacher **attach a library score to a course lesson** (writes the lesson's
  `MusicXML URL`) so it renders inside the course via the shared `<ScoreRenderer>` — this is
  the same component used by the Course Builder prompt.

### Secrets & legality
- Add Workspace Secret **`europeana`** (free Europeana API key) under Space Settings → Secrets.
  OpenScore (GitHub), PDMX, Mutopia, and IMSLP metadata need no key.
- Store and display `License` and `Source` on every score; only import openly licensed items
  (`reusability=open` / CC0 / public domain).

### Quality bar
- Match existing visual style and the current `MusicLibrary.tsx` / `ScoreDetail.tsx` UX
  (filters, saved collection, loading/empty/error states).
- Rendering must be responsive and work in light and dark themes.

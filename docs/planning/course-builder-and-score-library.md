# Planning: Course Builder (Moodle-grade) & Music Score Library

> Analysis, option evaluation, decisions, and build plans for the two biggest gaps in
> My Music Coach. The two ready-to-submit Taskade prompts live in
> [`docs/prompts/course-builder.prompt.md`](../prompts/course-builder.prompt.md) and
> [`docs/prompts/score-library.prompt.md`](../prompts/score-library.prompt.md).

---

## 0. The platform constraint that shapes everything

My Music Coach is **not** a normal full-stack app you can rebuild freely. It is a
**Taskade Genesis** ("parade") generated app. Every architectural decision below is
bounded by what that platform can actually do:

| Layer | What we have | What we do **not** have |
|---|---|---|
| Frontend | Generated React 18 + Tailwind + Radix, prompt-driven | — |
| Data | Taskade **Projects** = flat tables of "nodes" with **string** `fieldValues` | No relational DB, no joins, no foreign keys, no transactions |
| Reads/writes | `getNodes / createNode / updateNode / deleteNode` via `/api/taskade/*` | No SQL, no aggregate queries, no server-side filtering |
| Backend logic | Taskade **Automations (flows)** — form / webhook / cron / manual triggers, HTTP + AI actions | No long-running server, no cron of our own, no queue we control |
| File storage | **Google Drive links** (paste a URL) | **No native file/blob storage.** Cannot host PDFs/audio ourselves |
| 3rd-party keyed APIs | `GenesisClient.proxy()` + Workspace **Secrets** (`{{secret}}` substitution) | No secrets in client code |
| Auth | OIDC (`<GenesisAuth>`) + email/MFA fallback | — |

**Consequences for both tasks:**

1. Anything "heavy" (a quiz engine, a scraper) is either **client-side React** or a
   **Taskade flow** — there is no third place to put code.
2. We never store binaries. We store **metadata + external URLs** and render/preview
   from those URLs.
3. The flat string-field model means every "relationship" is a **title match** (e.g.
   a lesson's `Module` field holds the module's *title*, not an id — see
   `CourseViewer.tsx:53`). This is fragile and is itself part of the problem.

---

# PART A — Course Builder

## A1. What exists today

`src/pages/teacher/CourseBuilder.tsx` (384 lines) + `src/pages/student/CourseViewer.tsx`.
Data model: **Courses → Course Modules → Course Lessons** (+ Course Media, Enrollments).

It already does the *skeleton* of an LMS:

- 3-level hierarchy (course / module / lesson) with add + delete.
- Lesson **types** exist as labels: Video, Reading, Assignment, Quiz, Practice, Listening.
- Media = paste a Google Drive shareable link, tag it a type.
- A draft/published `Status` string.

## A2. Why it doesn't feel like Moodle yet — the honest gap analysis

The builder is a **thin CRUD form over four flat tables**. Moodle *feels* like Moodle
because of the layers underneath the outline. We have the outline and almost none of the
layers:

| Moodle capability | Status here | Evidence / root cause |
|---|---|---|
| **Progress that persists** | ❌ Broken | `CourseViewer.tsx:31` keeps `completedLessons` in a local `useState` `Set`. Refresh = progress gone. Nothing writes to `Enrollments.Progress %`. This is the single most damaging gap. |
| **Quiz engine** (question bank, MCQ/true-false, auto-grade, attempts) | ❌ None | "Quiz" is only a lesson-type label. No questions, no answers, no scoring. |
| **Assignments** (student submission → teacher grade → feedback) | ❌ None | "Assignment" is a label. No submission table, no upload, no grade flow. |
| **Gradebook** | ❌ None | No grades exist to aggregate. |
| **Rich content authoring** | ⚠️ Weak | Lesson `Content` is a plain `<textarea>`. No rich text, no embedded player — video/audio are just a link that opens Drive in a new tab. |
| **Drag-and-drop ordering** | ❌ Fake | `GripVertical` icons are decorative; `@hello-pangea/dnd` **is installed but unused**. Ordering is a hand-typed `Order` number. |
| **Sequencing / prerequisites / completion rules** | ❌ None | No "finish module 1 to unlock module 2," no completion criteria. |
| **Certificates / badges** | ⚠️ Partial | Students have `XP Points` + `Daily Streak` but courses award nothing. |
| **Discussions / Q&A** | ❌ None | — |
| **Enrollment & cohort management from the builder** | ⚠️ Thin | `Enrollments` table exists; the builder can't invite/enroll/track a class. |
| **Structural integrity** | ⚠️ Fragile | Relationships are title-string matches (`CourseViewer.tsx:53`), so renaming a module silently orphans its lessons. |

**Summary:** it resembles a course *outliner*, not a *learning management system*, because
it has no **assessment**, no **persistent progress/grades**, and no **content playback** —
the three things that make Moodle Moodle.

## A3. Options evaluated

### Option 1 — Integrate real Moodle (LTI / iframe / Moodle Web Services API)
Run/host a Moodle instance and connect it.
- ➕ Instantly "is" Moodle; battle-tested pedagogy features.
- ➖ Moodle needs PHP + MySQL hosting we **cannot** run inside Taskade Genesis. It becomes
  a second product to operate, pay for, secure, and sync users into. Deep visual
  integration is impossible — best case is an iframe that breaks our SSO, theming, and the
  AI-coach context. Massive overkill for a music school. **Rejected.**

### Option 2 — Google Classroom integration as the LMS backend
Use the Classroom API so coursework lives in Classroom.
- ➕ Free; many teachers/students already have Google accounts (we already do Google OIDC).
- ➖ Verified blockers (Google's own docs): **no LTI**; a token only sees courses the
  teacher **personally owns**; you **cannot modify coursework you didn't create** and
  can't push grades to it; **no resource library**, no sections. It is designed as an
  *assignment distribution* surface, **not** a general LMS backend. Trying to make it the
  system of record means fighting the API forever. **Rejected as the backend.**
- ✅ **But** the one thing the Classroom API is genuinely good at — `courseWork` with a
  **link back to an external resource** and a grade round-trip on *assignments we created* —
  is a perfect **optional export**: "Push this lesson to Google Classroom." Keep it as a
  bonus, not the foundation.

### Option 3 — Build an "LMS-lite" natively inside Taskade Genesis (RECOMMENDED)
Add the missing Moodle *layers* (assessment, persistent progress, playback, sequencing,
certificates) as React + a few new Taskade projects + light flows — targeting the 20% of
Moodle that matters for a music school, not the 100%.
- ➕ One product, one login, one theme, one AI coach that already knows the data. No new
  hosting. Uses our existing XP/streak gamification. Fits how the app is already built.
- ➖ We build (and maintain) the assessment/progress logic ourselves; the flat data model
  makes some of it verbose. Acceptable and bounded.

### Option 4 — Hybrid: Option 3 + optional one-way Google Classroom **export**
Native LMS-lite as the system of record, plus a "Send to Google Classroom" button that
uses the sweet-spot of the Classroom API (create linked coursework, read grades back).

## A4. Decision

**Choose Option 4: build the native LMS-lite (Option 3) now, and add the Google Classroom
one-way export as a later, optional enhancement.**

Rationale: Moodle and Google-Classroom-as-backend both fight the platform we're on and add
a second system to run. The felt gap is not "we lack an LMS product" — it's that we lack
**assessment, persistent progress, and content playback**. Those are buildable natively,
reuse our identity/AI/gamification, and keep everything in one coherent app. Google
Classroom earns its place only where its API is actually strong: exporting a linked
assignment for teachers who live in Classroom.

## A5. Build plan (phased)

**New Taskade Projects to create** (ask the builder to create these and note their IDs into
`src/config/app.ts`):

- **Quiz Questions** — `Lesson` (title ref), `Question`, `Type` (Multiple Choice / True-False /
  Short Answer), `Options` (newline-separated), `Correct Answer`, `Points`, `Order`.
- **Quiz Attempts** — `Student`, `Lesson`, `Course`, `Score`, `Max Score`, `Passed`,
  `Answers (JSON)`, `Submitted At`.
- **Assignment Submissions** — `Student`, `Lesson`, `Course`, `Submission URL`, `Text
  Response`, `Status` (Submitted / Graded / Returned), `Grade`, `Teacher Feedback`,
  `Submitted At`, `Graded At`.
- **Lesson Progress** — `Student`, `Course`, `Lesson`, `Status` (Not Started / In Progress /
  Completed), `Completed At`. (Persist per-lesson; roll up into `Enrollments.Progress %`.)
- **Certificates** — `Student`, `Course`, `Issued At`, `Certificate ID`.

**Phase 1 — Fix the foundation (highest value, smallest effort)**
1. Persist progress: `CourseViewer` writes `Lesson Progress` on complete/uncomplete and
   recomputes `Enrollments.Progress %`. Load initial completion from the table.
2. Real drag-and-drop ordering in `CourseBuilder` using the already-installed
   `@hello-pangea/dnd`; persist the new `Order` on modules and lessons.
3. Switch module↔lesson linkage from title-match to **node id** references to stop orphaning
   on rename (store `Module ID`; keep `Module` title as display only).

**Phase 2 — Assessment (the biggest "feels like Moodle" jump)**
4. **Quiz builder** in `CourseBuilder`: add/edit questions per Quiz lesson (MCQ, true/false,
   short answer), points, correct answers.
5. **Quiz player** in `CourseViewer`: take the quiz, auto-grade objective questions, write a
   `Quiz Attempts` row, show score + pass/fail, allow configurable retries.
6. **Assignment submission**: student submits a Drive link + text; teacher sees a grading
   queue, enters grade + feedback, sets status; student sees the returned grade.

**Phase 3 — Content playback & authoring**
7. Rich lesson content: render `Content` as Markdown (we already ship `react-markdown` +
   `remark-gfm`); **embed** YouTube/Vimeo/audio inline instead of link-out; render
   `MusicXML URL` inline (see Part B's OpenSheetMusicDisplay/Verovio decision — shared).

**Phase 4 — Sequencing, completion & rewards**
8. Prerequisites / conditional release (unlock module N+1 when N is complete or its quiz is
   passed). Completion criteria per lesson (viewed / quiz-passed / assignment-graded).
9. On 100% completion: award XP, bump gamification, issue a **Certificate** row and render a
   printable certificate page.

**Phase 5 — Optional Google Classroom export**
10. "Send to Google Classroom" on a lesson/course → create linked `courseWork` via the
    Classroom API (proxy + Google OAuth scope), store the returned id, optionally read the
    grade back. One-way, best-effort, clearly optional.

**Effort:** Phases 1–2 are the bulk of the perceived value and are the core of the submitted
prompt. Phases 3–5 are staged follow-ups.

---

# PART B — Music Score Library (scraping & import)

## B1. What exists today

- **Music Scores Library** project (curated metadata: Title, Composer, Era, Instrument,
  Difficulty, Genre, Key, Pages, Description, **IMSLP URL**, **Google Drive PDF URL**).
- `MusicLibrary.tsx` (browse/filter/save) + `ScoreDetail.tsx` (viewer).
- The "import/scrape" mechanism today is a **hack**: `ScoreDetail.tsx:246` POSTs a *comment*
  onto the score node reading `"[Scraper Trigger] Requesting first-page scrape…"` and hopes a
  flow picks it up. There is no real importer, and **IMSLP forbids embedding** (`ScoreDetail.tsx:228`),
  so the in-app viewer is often empty.

## B2. Technical constraints for a real library

1. **We can't host files.** No PDF/audio blob storage. We must keep **stable external URLs**
   or **renderable MusicXML**, plus metadata rows.
2. **Embedding rules differ per source.** IMSLP blocks iframing (confirmed in our own code).
   IIIF image endpoints and Google Drive `/preview` *do* embed.
3. **Rendering in-app** (the real "asset") means either (a) a **page-image viewer** over
   scanned PDFs/IIIF, or (b) **notation rendering from MusicXML/MEI** via a client library.
   Only (b) gives interactive, transposable, playable scores.
4. **The importer must be a Taskade flow** (cron/webhook) doing HTTP + write `createNode`, or
   a client-side "search & import" panel calling public APIs directly. Keyed APIs
   (Europeana) go through `GenesisClient.proxy()` + a Workspace Secret.
5. **Legality is a feature, not an afterthought.** The library is a public asset, so prefer
   **public-domain / CC0** sources and record provenance + license on every row.

## B3. Data-source evaluation

| Source | What it gives | API / access | License | Embed / render in-app | Verdict |
|---|---|---|---|---|---|
| **IMSLP / Petrucci** | Largest PD score collection (scanned PDFs) + rich metadata | Official list API (people/works, JSON, paged) + MediaWiki API; community wrappers exist | PD (mostly; Canada rules) | **No iframe** — deep-link only | **Metadata + deep links**, not embedding |
| **OpenScore (MuseScore×IMSLP)** — Lieder & String Quartet corpora | Clean, engraved **MusicXML/MIDI/PDF** | **GitHub** corpora (files + CSV metadata) | **CC0** | ✅ Renders beautifully from MusicXML | **Primary renderable source** |
| **PDMX** | 250k+ **MusicXML** from MuseScore, with genre/tags | Open dataset (download) | Public-domain subset | ✅ MusicXML | **Bulk MusicXML seed** (curate) |
| **Mutopia Project** | 2,000+ engraved scores | Site + files | PD / CC | ✅ (PDF/MIDI; LilyPond source) | **Secondary** |
| **Europeana** (aggregates **DNB**, national libraries) | Millions of cultural items incl. music manuscripts/prints | **Free REST API key** + **IIIF manifests**; metadata **CC0** | Metadata CC0; item rights vary (filter `REUSABILITY=open`) | ✅ IIIF viewer embeds | **Best aggregator API** — use for breadth incl. DNB |
| **DNB direct** | German bibliographic records | SRU/OAI (free) | Metadata open | Mostly **not** digitized full scores | Reachable **via Europeana** instead |
| **Library of Congress / Bavarian State Library** | High-res IIIF scans | IIIF | PD | ✅ IIIF | Optional IIIF add-ons |

**Key finding:** the user's instinct about "a better, still-free API (DNB etc.)" resolves to
**Europeana** — it is the free, well-documented REST + IIIF API that *aggregates* DNB and the
other national libraries, with CC0 metadata and an `open` reusability filter. It's a better
integration target than DNB's raw SRU.

## B4. Decision

**Two-track library, both free and legally clean:**

1. **Renderable core — CC0 MusicXML** from **OpenScore corpora + a curated PDMX subset**
   (seed via a Taskade import flow from their GitHub/dataset). Render **in-app** with
   **OpenSheetMusicDisplay** (or **Verovio** for MEI). This is the differentiating asset:
   interactive, transposable, playable notation that lives inside My Music Coach.
2. **Breadth & scans — metadata + viewers**: **Europeana API** (covers DNB + national
   libraries, IIIF-embeddable, filtered to `open` rights) for scanned historical editions,
   plus **IMSLP as deep-link + metadata** (never embedded).

Drop the comment-hack "scraper trigger." Replace with (a) a **teacher/admin "Search &
Import" panel** that queries these APIs live and one-click-saves a normalized row, and (b) an
optional **scheduled import flow** that bulk-seeds the CC0 corpora. Every row records
`Source`, `Source URL`, `License`, and (when available) `MusicXML URL` / `IIIF Manifest` /
`PDF URL`.

Why not "just scrape IMSLP into Drive"? It's legally grey, brittle (HTML scraping), storage
we can't hold, and IMSLP won't embed anyway. CC0 MusicXML + Europeana IIIF gives a better,
safer, genuinely in-app experience.

## B5. Build plan

**Extend the Music Scores Library project** with: `Source` (IMSLP / OpenScore / Europeana /
MuseScore-PDMX / Mutopia / Manual), `Source ID`, `Source URL`, `License`, `MusicXML URL`,
`IIIF Manifest URL`, `Audio URL`, `Imported At`. Keep existing fields.

**Phase 1 — In-app rendering (the asset)**
1. Add **OpenSheetMusicDisplay** (MusicXML) — and optionally **Verovio** (MEI) — as a
   client dependency. Build a `<ScoreRenderer>` that loads `MusicXML URL` and renders
   notation; wire it into `ScoreDetail.tsx` above/instead of the PDF iframe. Add
   play/transpose if using OSMD + a synth.
2. IIIF viewer branch: when a row has `IIIF Manifest URL`, embed a IIIF viewer instead of the
   Drive iframe. Keep IMSLP as a deep-link button only.

**Phase 2 — Live "Search & Import" panel (teacher/admin)**
3. A search UI that queries **Europeana** (`proxy` + `europeana` secret, filter
   `reusability=open`, `TYPE=IMAGE`/music) and **OpenScore/IMSLP** metadata; shows results;
   "Import" writes a normalized `Music Scores` row with full provenance + license.

**Phase 3 — Bulk seed via flow**
4. A **scheduled/manual Taskade flow** that pulls the OpenScore Lieder corpus (GitHub CSV +
   raw MusicXML URLs) and a curated PDMX slice, de-dupes on `Source ID`, and bulk-creates
   rows. This replaces the comment-hack trigger.

**Phase 4 — Curation & UX**
5. Admin review/curate queue, difficulty tagging (reuse existing selects), dedupe, and
   library-to-course linking (attach a score to a lesson — shared with Part A Phase 3).

**Secrets to add** (Space Settings → Secrets): `europeana` (Europeana API key). IMSLP,
OpenScore GitHub, PDMX, and Mutopia need no key (public).

---

## Implementation notes & gotchas (post-first-build)

**Europeana — which API do you actually need?** One free API key (`wskey`) works for all
Europeana endpoints; you do **not** need a separate "content" API. Europeana is a *discovery +
IIIF* layer — it returns **metadata and links to the object hosted at the providing library**,
it does **not** host/serve the score files. Use:
- **Search API** — `.../record/v2/search.json?wskey=KEY&query=...&qf=TYPE:IMAGE&reusability=open`
  to find items (each hit has `edmPreview`, `edmIsShownBy`/`edmIsShownAt`, `rights`, dataset+local id).
- **Record API** — `.../record/v2{id}.json?wskey=KEY` for one item's full metadata.
- **IIIF Manifest API** — `https://iiif.europeana.eu/presentation{id}/manifest` to actually
  display the scanned pages in an embeddable viewer.

So: Europeana = discovery + IIIF viewing of scanned editions. For genuinely interactive,
in-app *notation* you still use CC0 **MusicXML** (OpenScore/PDMX). Keep both tracks.

**Why the IMSLP scraping / advanced API and the big Course-Builder module likely didn't build:**
- **CORS.** A browser `fetch()` to `imslp.org` or `api.europeana.eu` is blocked cross-origin.
  Any external call must go through **`GenesisClient.proxy()`** (keyed APIs) or a **Taskade
  flow** (server-side). A client-side IMSLP fetch will silently fail — this is the #1 cause.
- **IMSLP has no clean embed and its API is MediaWiki-shaped** (paged list endpoints + HTML),
  so treat it as metadata + deep-link only; don't expect embedded PDFs.
- **New Taskade Projects aren't auto-created**, and a single mega-prompt tends to yield a
  partial build. Create the projects first, then submit **one phase at a time** and verify each.

**Diagnosis against the current repo (verified):** as of this branch, *none* of the
Taskade-generated work has landed in GitHub — `origin/main` is still the initial commit,
**`GenesisClient.proxy()` is called nowhere** (so no Europeana/IMSLP API is actually wired),
and the only IMSLP "scraper" is the dead comment-POST hack at `ScoreDetail.tsx:251` with no
flow consuming it. `CourseBuilder.tsx` is still the thin CRUD (the `Quiz`/`Certificate`
strings are just lesson-type labels, not an engine). So the practical reasons the IMSLP
scraping and the Moodle-style module "don't work" are: (a) they were never built into code
here, and (b) even the stub that exists can't reach IMSLP from the browser (CORS) and has no
server-side flow. **Also check that your Taskade project is actually syncing to this GitHub
repo** — if generated builds aren't appearing on `main`, the repo and the live Taskade app are
decoupled, which would explain seeing no changes at all.

**API keys:** store the Europeana key only as the Taskade Workspace Secret `europeana` — never
commit it to the repo or paste it where it's persisted. If a key has been shared in the clear,
rotate it in the Europeana account settings.

## Sources
- IMSLP API — https://imslp.org/wiki/IMSLP:API ; wrappers: https://github.com/jlumbroso/imslp , https://github.com/josefleventon/imslp-api
- Europeana APIs (free key + IIIF, CC0 metadata) — https://pro.europeana.eu/page/apis , https://pro.europeana.eu/page/get-api , https://github.com/europeana/iiif-manifest-api
- OpenScore (CC0 MusicXML) — https://fourscoreandmore.org/openscore/ ; Mutopia Project — https://www.mutopiaproject.org/ ; MusicXML sources list — https://www.musicxml.com/music-in-musicxml/ ; PDMX — https://arxiv.org/html/2409.10831v1
- Google Classroom API + limitations — https://developers.google.com/workspace/classroom/guides/coursework-integration , https://ed.link/community/how-google-classroom-integration-differs-from-other-lmss/

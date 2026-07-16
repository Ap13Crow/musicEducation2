# Taskade prompt — Upgrade the Course Builder into an "LMS-lite" (Moodle-grade essentials)

> Paste this into the Taskade builder for My Music Coach. It targets the parts of Moodle
> that matter for a music school — persistent progress, quizzes, assignments/grading, content
> playback, sequencing, and certificates — without leaving the Taskade Genesis architecture.
> Build it in the phases below; Phase 1–2 first.

---

You are upgrading the existing **My Music Coach** app (Taskade Genesis / React). Keep the
current data helpers (`@/lib/genesis-data`: `getNodes/createNode/updateNode/deleteNode`,
`getFieldValue/getFieldNumber`), the `PROJECTS` map in `src/config/app.ts`, the existing
theme, routing, `useCurrentUser`, and role model. Do **not** introduce a database or external
hosting — persist everything in Taskade Projects. Reuse the already-installed
`@hello-pangea/dnd`, `react-markdown`, and `remark-gfm`.

**Goal:** make `src/pages/teacher/CourseBuilder.tsx` and `src/pages/student/CourseViewer.tsx`
behave like a real learning-management flow, not a static outline.

### Create these new Taskade Projects and add their IDs to `src/config/app.ts`
1. **Lesson Progress** — fields: `Student`, `Course`, `Lesson`, `Lesson ID`, `Status`
   (Not Started / In Progress / Completed), `Completed At`.
2. **Quiz Questions** — `Lesson`, `Lesson ID`, `Question`, `Type` (Multiple Choice /
   True-False / Short Answer), `Options` (newline-separated), `Correct Answer`, `Points`,
   `Order`.
3. **Quiz Attempts** — `Student`, `Course`, `Lesson`, `Score`, `Max Score`, `Passed`,
   `Answers (JSON)`, `Submitted At`.
4. **Assignment Submissions** — `Student`, `Course`, `Lesson`, `Submission URL`,
   `Text Response`, `Status` (Submitted / Graded / Returned), `Grade`, `Teacher Feedback`,
   `Submitted At`, `Graded At`.
5. **Certificates** — `Student`, `Course`, `Certificate ID`, `Issued At`.

### Phase 1 — Fix the foundation
- **Persist progress.** In `CourseViewer`, when a student marks a lesson complete/incomplete,
  write/update a **Lesson Progress** row (keyed by student + `Lesson ID`) instead of the local
  `Set`. On load, hydrate completion from that table. After each change, recompute the
  student's `Enrollments.Progress %` for the course and `updateNode` it.
- **Real drag-and-drop ordering.** In `CourseBuilder`, use `@hello-pangea/dnd` to reorder
  modules and lessons; persist the new `Order` values. Remove the decorative-only grip.
- **Stable references.** Store and match lessons↔modules by **node id** (`Module ID`), keeping
  the title only for display, so renaming a module never orphans its lessons.

### Phase 2 — Assessment
- **Quiz builder** (teacher, in `CourseBuilder`): for any lesson of type `Quiz`, add/edit/delete
  questions (Multiple Choice, True-False, Short Answer) with options, correct answer, points,
  and order — stored in **Quiz Questions**.
- **Quiz player** (student, in `CourseViewer`): render the quiz, let the student answer,
  auto-grade objective questions, write a **Quiz Attempts** row with score + pass/fail, show
  the result, and allow configurable re-attempts. A passed quiz counts as lesson completion.
- **Assignments:** student submits a Google Drive link + text response → **Assignment
  Submissions** row (`Submitted`). Teachers get a **grading queue** page listing submissions
  for their courses; they enter a grade + feedback and set `Graded/Returned`. The student sees
  the returned grade and feedback in `CourseViewer`.

### Phase 3 — Content playback & authoring
- Render lesson `Content` as **Markdown** (`react-markdown` + `remark-gfm`).
- **Embed** media inline: YouTube/Vimeo → responsive iframe, audio URLs → `<audio>` player,
  instead of link-out.
- Render a lesson's `MusicXML URL` **inline** as notation (shared `<ScoreRenderer>` from the
  Score Library prompt — OpenSheetMusicDisplay).

### Phase 4 — Sequencing, completion & rewards
- **Conditional release:** a module unlocks when the previous module's lessons are complete
  (and its quiz, if any, is passed). Show locked modules as disabled with a hint.
- **Completion criteria** per lesson type (viewed / quiz-passed / assignment-graded).
- On **100% course completion:** award XP to the student (reuse the existing XP/gamification
  fields), create a **Certificates** row, and add a printable certificate page/route.

### Phase 5 — Optional: one-way Google Classroom export
- Add a **"Send to Google Classroom"** action on a lesson/course that creates linked
  `courseWork` via the Google Classroom API (through `GenesisClient.proxy()` with a Google
  OAuth token + `classroom.coursework.*` scope), stores the returned coursework id on the
  lesson, and can read the grade back. Strictly optional and best-effort — the native flow
  above remains the system of record. Do not attempt to make Google Classroom the backend.

### Quality bar
- Match the existing visual style (Radix + Tailwind tokens, rounded-xl cards, muted borders).
- Handle loading/empty/error states like the current pages do.
- Everything must work for the student, teacher, and admin roles already in the app.

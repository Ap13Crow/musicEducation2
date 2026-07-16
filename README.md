# My Music Coach — Music School Management Platform

A full-stack music school platform built on Taskade Genesis: student/teacher/admin portals, course builder, music score library with IMSLP integration, booking system, events, evaluations, and AI-powered coaching.

**Live URL**: https://music-growth-studio-6903.taskade.app

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS 3 + Radix UI primitives
- **State**: Zustand + localStorage persistence + react-hook-form + Zod validation
- **Routing**: react-router-dom v6 with role-based route configs
- **Auth**: OIDC via `<GenesisAuth>` (Google sign-in) + email/password fallback with MFA (TOTP)
- **Data Layer**: Taskade Projects via `@/lib/genesis-data` (getNodes/createNode/updateNode/deleteNode)
- **AI Chat**: Agent Chat SDK v2 (`@ai-sdk/react` + Taskade agent backend)
- **Charts**: Recharts for dashboard analytics
- **Backend**: Taskade Automations (flows) for cron jobs, webhooks, and event-driven logic

## Project Structure

```
src/
├── App.tsx                    # Root: auth gating, role-based routing, lazy loading
├── main.tsx                   # Entry: GenesisRoot + ThemeProvider
├── index.css                  # CSS variables, Tailwind layers, theme tokens
├── config/
│   └── app.ts                 # SPACE_ID, AGENT_ID, PROJECTS map, UserRole types
├── components/
│   ├── AppLayout.tsx           # Authenticated layout: Sidebar + main content
│   ├── Sidebar.tsx             # Role-based navigation (student/teacher/admin/moderator)
│   ├── PublicLayout.tsx        # Public-facing layout (landing, courses, events)
│   ├── RoleSwitcher.tsx        # Admin/moderator role impersonation dropdown
│   ├── EmailLogin.tsx          # Email/password sign-in form
│   ├── MFAVerify.tsx           # TOTP verification step
│   ├── MFASetup.tsx            # TOTP enrollment (QR code)
│   ├── ui/                     # 50+ shadcn primitives (never edited directly)
│   ├── ai-elements/            # Pre-built chat UI components
│   └── blocks/                 # FloatingAgentChat, LeadCaptureForm, MetricsDashboard, PipelineBoard
├── pages/
│   ├── Landing.tsx             # Public homepage
│   ├── Onboarding.tsx          # Post-signup role selection
│   ├── StudentOnboarding.tsx   # Student profile setup (instrument, skill level)
│   ├── TeacherApplication.tsx  # Teacher registration flow
│   ├── public/                 # Public pages (courses, events, teachers)
│   ├── student/                # 12 student pages (see Routes below)
│   ├── teacher/                # 7 teacher pages
│   └── admin/                  # 7 admin pages
├── hooks/                      # useCurrentUser, use-theme, use-mobile, use-toast
├── lib/
│   ├── genesis-data/           # Taskade project CRUD (getNodes, createNode, etc.)
│   ├── genesis-flows/          # Trigger automations (submitForm, runFlow)
│   ├── genesis-auth.tsx        # <GenesisAuth> OIDC wrapper
│   ├── genesis-gateway.ts      # Shared fetch for /api/taskade/*
│   ├── agent-chat/v2/          # Agent Chat SDK (createConversation + createAgentChat)
│   ├── auth.ts                 # Email/password session management
│   ├── createPersistentStore.ts # zustand + localStorage persistence
│   └── utils.ts                # cn() classname merger
└── stores/
    └── roleStore.ts            # Role impersonation state (persisted)
```

---

## Data Layer — 18 Taskade Projects

All app data lives in Taskade Projects (backed by the Genesis Gateway). The `src/config/app.ts` file maps project IDs to constant keys.

### Core Identity Projects

| Project | ID | Purpose | Key Fields |
|---|---|---|---|
| User Profiles | `Q5N5xFmrwjQtJ8AK` | Unified user identity across roles | Email, Display Name, Role (select), OIDC Sub, Password Hash, TOTP Secret, MFA Enabled, Instrument, Skill Level, Linked Student ID, Linked Teacher ID |
| Students | `yCzPZwvjD6s124Yr` | Student-specific data | Email, Instrument (select), Skill Level (select), XP Points, Daily Streak, Membership |
| Teachers | `XqBrvi6eTkrZPkQL` | Teacher profiles & credentials | Email, Instrument (select), Hourly Rate, Location (select), Certification (select), Years of Experience, Specialization (select), Bio, Rating, Google Booking URL |

### Course System Projects

| Project | ID | Purpose | Key Fields |
|---|---|---|---|
| Courses | `mz6xvBkYZCiQ5ASh` | Course catalog | Title, Description, Category (select), Difficulty (select), Price, Duration, Instructor, Status (board view) |
| Course Modules | `JvcyXNxVya2hypCU` | Module structure under courses | Title, Description, Course (string), Order (number), Status (Draft/Published/Archived) |
| Course Lessons | `mF787SepJLQRXCyK` | Individual lessons within modules | Title, Content, Module (string), Order (number), Type (Video/Reading/Assignment/Quiz/Practice/Listening), Duration (min), Media URL, MusicXML URL |
| Course Media | `K7tCbkH1kvXs2axc` | Uploaded teaching materials | File Name, File Type (PDF/PowerPoint/Keynote/Audio/Video/MusicXML/Image), Google Drive URL, Course (string), Uploaded By |
| Enrollments | `AQjMqkkXwhAH2cX8` | Student course enrollment tracking | Course (string), Student (string), Progress %, Status (Active/Completed/Dropped/Paused) |

### Music Library Projects

| Project | ID | Purpose | Key Fields |
|---|---|---|---|
| Music Scores Library | `DXd1EuJ8awCBmp35` | Curated sheet music database | Title, Composer, Era (select), Instrument (select), Difficulty (select), Genre (select), Key Signature, Pages (number), Description, IMSLP URL, Google Drive PDF URL |
| User Scores Library | `QfqeEMtjSgqJFuv1` | Per-user saved scores | User (string), Score Title (string), Notes |

### Booking & Events Projects

| Project | ID | Purpose | Key Fields |
|---|---|---|---|
| Bookings | `haf1nb5VT6sWLuBt` | Lesson bookings | Student, Teacher, Instrument (select), Location (select), Duration, Status (board), Meet Link, Student GCal Event ID, Teacher GCal Event ID |
| Events | `Xw8uUjocwMyHWjhp` | Masterclasses, concerts, workshops | Title, Category (select), Venue, Price, Capacity, Status (board) |
| Event Attendees | `duWFSi51oxhwTsL1` | Event registrations | Event, Attendee, Ticket Type, Price Paid, Attendance status |
| Teacher Availability | `hA5jeKe1uHJZ1bqa` | Teacher weekly schedule | Teacher Email, Instrument (select), Location (select), Day of Week (select), Start Time, End Time, Active |

### Support Projects

| Project | ID | Purpose | Key Fields |
|---|---|---|---|
| Payments | `LK2Qh6EadjSeJ7VB` | Financial transactions | User, Amount, Type (select), Payment Status (select), Description |
| Evaluations | `YB5Wt5tbeQw5a3bE` | AI-generated skill assessments | User, Evaluated Role (select), Score, Category (select), AI Notes, Recommended Action |
| Friend Requests | `oT3nXgc8Jf8d9UMT` | Social connections | From User, To User, Status (Pending/Accepted/Rejected/Blocked) |

---

## Intelligence Layer — 4 AI Agents

| Agent | ID | Role | Knowledge Sources |
|---|---|---|---|
| My Music Coach | `01KXDA6ZBJVY41NNK419WW3J40` | Main assistant — helps students/teachers/admins navigate the platform | User Profiles, Students, Teachers, Courses, Enrollments, Bookings, Events, Payments, Evaluations, Music Scores, Teacher Availability |
| AI Evaluator | `01KXDA6ZBM5BFWQJNC4KY9YYCA` | Analyzes student performance, generates evaluations | Students, Teachers, Courses, Enrollments, Bookings, Evaluations, User Profiles |
| Course Architect | `01KXKMA1K41SAT5B8E7468GP32` | Helps build course curriculum | Courses, Course Modules, Course Lessons |
| Music Librarian | `01KXKMADK1NP0VGK50CBCMDPRQ` | Curates music scores, recommends repertoire | Music Scores Library, User Scores Library, Courses |

---

## Automation Layer — 12 Flows

### Music Library Automation
| Flow | ID | Trigger | Actions | Status |
|---|---|---|---|---|
| Music Library Grower | `01KXKQ26W51C124F0VFH1K657R` | Every 10 min | web.search → ai.ask → task.create on Music Scores | Disabled |
| IMSLP Score Scraper | `01KXKQ8H0YG4HFZNNKBEZSNXZH` | Manual (CustomTrigger) | http.sendRequest → ai.ask → task.addComment | Enabled |
| Auto-Scrape New Scores | `01KXKQB5PRH4KB41JG4E3SQW9C` | task.added on Music Scores | flow.run (calls scraper) | Enabled |
| IMSLP Score Import | `01KXKKWRT14H9BNEB1QKDSDRMN` | Form submission | ai.ask → task.create on Music Scores | Enabled |

### Course Automation
| Flow | ID | Trigger | Actions | Status |
|---|---|---|---|---|
| Course Auto-Builder | `01KXKM7X1T9AC5ZRN1CN75YNZT` | Form submission | ai.ask → task.create on Courses | Enabled |
| Course Enrollment Welcome | `01KXDA81474RQM63C2B4JWYZ2J` | task.added on Enrollments | notify.email → task.addComment | Enabled |

### Booking & Calendar Automation
| Flow | ID | Trigger | Actions | Status |
|---|---|---|---|---|
| Calendar Sync - New Booking | `01KXGPGS9CGB893NQ5D2162J3A` | task.added on Bookings | Google Calendar event creation | Enabled |
| Calendar Sync - Booking Cancelled | `01KXGQFRF9NWEG0QY4S42JW4KW` | custom_attribute_updated on Bookings | Google Calendar event update/cancel | Enabled |
| Calendar Sync - Course Enrollment | `01KXGQGKT5SFHRRR7Q8460V4QY` | task.added on Enrollments | Google Calendar event creation | Enabled |
| Calendar Sync - Event Purchase | `01KXGQJE7297MY38N6BK57W4J6` | task.added on Event Attendees | Google Calendar event creation | Enabled |
| Booking Confirmation | `01KXDA80N4RHHNTM5RXJZY2Z5D` | task.added on Bookings | notify.email → task.addComment | Enabled |

### Reporting
| Flow | ID | Trigger | Actions | Status |
|---|---|---|---|---|
| Weekly Progress Digest | `01KXDA8026QACBF7PB4EDAD0SW` | Every Monday 9am | ai.ask → task.create on Evaluations | Enabled |

---

## Interface — App Routes

### Public (no auth)
| Path | Page | Description |
|---|---|---|
| `/` | Landing.tsx | Homepage with CTA |
| `/courses` | public/Courses.tsx | Public course catalog |
| `/events` | public/Events.tsx | Public events listing |
| `/teachers` | public/Teachers.tsx | Public teacher directory |
| `/login` | EmailLogin.tsx | Email/password sign-in |

### Auth Flows
| Path | Page | Description |
|---|---|---|
| `/onboarding` | Onboarding.tsx | Role selection after first sign-in |
| `/onboarding/student` | StudentOnboarding.tsx | Instrument & skill level setup |
| `/apply/teacher` | TeacherApplication.tsx | Teacher registration form |
| `/mfa/setup` | MFASetup.tsx | TOTP enrollment |
| `/mfa/verify` | MFAVerify.tsx | TOTP verification gate |

### Student Portal (12 routes)
| Path | Page | Description |
|---|---|---|
| `/dashboard` | student/Dashboard.tsx | Stats, progress, upcoming lessons |
| `/discover/courses` | student/CourseCatalog.tsx | Browse & enroll in courses |
| `/discover/teachers` | student/TeacherDirectory.tsx | Browse teacher profiles |
| `/discover/teachers/:id` | student/TeacherDetail.tsx | Teacher profile + booking |
| `/my-courses` | student/MyCourses.tsx | Active enrollments |
| `/my-courses/:id` | student/CourseViewer.tsx | Course content viewer |
| `/library` | student/MusicLibrary.tsx | Browse IMSLP scores, save to collection |
| `/library/score/:id` | student/ScoreDetail.tsx | Score viewer with PDF embed |
| `/my-bookings` | student/MyBookings.tsx | Upcoming & past lessons |
| `/events` | student/Events.tsx | Browse & register for events |
| `/friends` | student/Friends.tsx | Social connections |
| `/profile` | student/Profile.tsx | Personal stats, saved scores, badges |

### Teacher Portal (7 routes)
| Path | Page | Description |
|---|---|---|
| `/dashboard` | teacher/Dashboard.tsx | Student overview, upcoming lessons |
| `/students` | teacher/Students.tsx | Student roster with progress |
| `/my-courses` | teacher/MyCourses.tsx | Courses they teach |
| `/course-builder` | teacher/CourseBuilder.tsx | Modules, lessons, media upload |
| `/my-bookings` | teacher/MyBookings.tsx | Schedule management |
| `/events` | teacher/Events.tsx | Events they host |
| `/profile` | teacher/Profile.tsx | Bio, availability, rates |

### Admin/Moderator Portal
Admin: 9 routes; Moderator: 7 routes (no Bookings or Users)
| Path | Page | Description |
|---|---|---|
| `/dashboard` | admin/Dashboard.tsx | Platform-wide stats |
| `/admin/students` | admin/Students.tsx | Student management |
| `/admin/teachers` | admin/Teachers.tsx | Teacher approval |
| `/admin/courses` | admin/Courses.tsx | Course oversight |
| `/course-builder` | teacher/CourseBuilder.tsx | Build courses |
| `/admin/bookings` | admin/Bookings.tsx | All bookings (admin only) |
| `/admin/events` | admin/Events.tsx | Event management |
| `/admin/users` | admin/Users.tsx | User management (admin only) |
| `/profile` | student/Profile.tsx | Admin profile view |

---

## Data Access Pattern

All pages read/write data through the Genesis Gateway:

```typescript
// Reading data
import { getNodes, getFieldValue, getFieldNumber } from '@/lib/genesis-data';
const nodes = await getNodes(PROJECTS.musicScores);
const title = getFieldValue(node, 'Title');      // string fields
const pages = getFieldNumber(node, 'Pages');      // number fields

// Writing data
import { createNode, deleteNode } from '@/lib/genesis-data';
await createNode(PROJECTS.courseLessons, {
  Title: 'Lesson 1',
  Content: 'Learn scales',
  Module: 'Module A',
  Order: '1',
  Type: 'Practice',
});
await deleteNode(PROJECTS.courseLessons, nodeId);
```

**Critical conventions:**
- Nodes arrive flat with `parentId` of `null` OR the project root ID — NEVER filter `parentId !== null`
- Field values are always STRINGS from the gateway — coerce with `Number(...)` before math/charts
- Field keys in `createNode`/`updateNode` must match the project's field paths exactly

---

## Known Issues & Areas for Improvement

### Course Builder (src/pages/teacher/CourseBuilder.tsx)
- **Current state**: Functional but bare — modules and lessons are flat lists keyed by string name (not foreign key IDs)
- **Media tab**: Google Drive URL paste only (no direct upload)
- **Missing**: Rich text lesson editor, drag-and-drop reordering, bulk import, PPTX viewer integration
- **Module/Lesson linking**: Uses string title matching (`moduleRef === mod.title`) which breaks on renames

### Music Library & IMSLP Scraping
- **Music Library Grower flow is DISABLED** — the 10-minute cron job needs to be enabled
- **IMSLP scraping**: The IMSLP Score Scraper flow exists but the Auto-Scrape watcher passes a static payload (not dynamic scoreNodeId/imslpUrl). The scraper needs manual triggering for now.
- **Score Viewer**: Google Drive PDFs embed via iframe, but scores without a `gdriveUrl` only show an IMSLP link + "Request Page Scrape" button
- **MusicXML viewer**: Not implemented — MusicXML URLs are stored but not rendered as interactive sheet music

### Auth
- **Google OIDC** requires setup in Genesis App Publish settings (not yet configured)
- **Email/password auth** uses a custom system with bcrypt-ish password hashing stored in User Profiles

### General
- **No real-time sync**: Pages fetch data on mount via `useEffect` — no WebSocket or polling
- **String-based foreign keys**: Modules reference courses by title string, lessons reference modules by title string — fragile to renames
- **No pagination**: `getNodes()` fetches all rows — will degrade with large datasets

---

## How to Push to GitHub

```bash
# From the /app directory:
cd /app
git init
git add .
git commit -m "Initial commit: My Music Coach platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/my-music-coach.git
git push -u origin main
```

To push: copy the entire `/app` directory to your local machine, or use a GitHub Personal Access Token to create the repo and push programmatically.

---

## Environment

- **Build**: esbuild with hot reload
- **Dev server**: Live preview on save
- **CSS**: Tailwind CSS v3 with `@tailwind` directives (NOT Tailwind v4 `@import`)
- **Node**: 18+
- **Package Manager**: npm

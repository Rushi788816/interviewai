# InterviewAI — Codebase Analysis

This document describes the **interviewai** workspace: purpose, what has been built so far, structure, APIs, database, auth, and follow-ups.

---

## What we built in this project (to date)

### Product overview

**InterviewAI** is a **Next.js 14** app that helps users prepare for jobs with:

1. **Live Interview Assistant** — Browser speech recognition, streaming AI answers in a green panel, session timer, credits, Desi mode, language and interview-type tabs; sessions can be saved to the database when the user stops.
2. **Mock Interview** — Multi-step flow: pick role, company type, difficulty; AI generates five questions; voice answers; per-question scoring and a results report; results can be saved as a **MockSession**.
3. **Resume Builder** — Six-step form (personal info, summary, experience, education, skills, projects), three PDF templates, AI “enhance” and ATS check, export to PDF via **html2canvas** + **jsPDF**.
4. **Dashboard** — Stats, quick actions, recent interview sessions.
5. **Settings** — Profile edit, credits/plan cards (Razorpay placeholder), session history, sign out.
6. **Marketing landing** — Full landing sections plus a floating launcher that sends guests to **login** or opens the assistant for logged-in users.

Styling for new features is **plain HTML + Tailwind** (no shadcn/Radix on those surfaces). Legacy **`components/ui/*`** pieces may remain for older imports; some were simplified so the app builds cleanly.

---

### Database (Supabase + Prisma)

- **`prisma/schema.prisma`**: PostgreSQL via **`DATABASE_URL`**; models **User**, **InterviewSession**, **Payment**, **MockSession** (relations and cascade deletes where defined).
- **`lib/prisma.ts`**: Singleton Prisma client for API routes.
- **Typical commands**: `npx prisma generate`, `npx prisma db push` — tables live in Supabase.

---

### Authentication

- **`lib/auth.ts`**: NextAuth with **JWT**; **Google** OAuth; **credentials** login with **bcryptjs** and Prisma **User.password**; JWT/session callbacks expose **id**, **credits**, **plan**.
- **`app/api/auth/[...nextauth]/route.ts`**: NextAuth route handlers.
- **`app/api/auth/register/route.ts`**: Registers users (hashed password, default **30** credits).
- **`app/(auth)/login/page.tsx`**, **`signup/page.tsx`**, **`forgot-password/page.tsx`**: Auth UI; login/signup wired to NextAuth and register API.

---

### Dashboard and navigation

- **`app/(dashboard)/layout.tsx`**: Client layout — **`useSession`**, redirect to **`/login`** if unauthenticated; sidebar + mobile menu; dark background **`#0a0a0f`**.
- **`components/layout/DashboardSidebar.tsx`**: Nav items (Dashboard, Interview, Mock Interview, Resume Builder, Settings), active route styling, credits badge, **Upgrade** when credits are low.
- **`app/(dashboard)/dashboard/page.tsx`**: Time-based greeting, stat cards, quick actions, recent sessions table (with loading skeletons); data from **`/api/sessions/stats`** and **`/api/sessions/recent`**.

---

### API routes (server)

| Area | Routes |
| ---- | ------ |
| AI (Groq) | **`POST /api/ai/interview-answer`** — SSE stream for live coaching; **`POST /api/ai/mock-interview`** — generate questions / evaluate answers; **`POST /api/ai/resume-generate`** — enhance copy / ATS JSON |
| Auth | **`/api/auth/[...nextauth]`**, **`POST /api/auth/register`** |
| Credits | **`GET /api/credits/balance`**, **`POST /api/credits/deduct`** |
| Sessions | **`GET /api/sessions/recent`**, **`GET /api/sessions/stats`**, **`POST /api/sessions/save`**, **`POST /api/sessions/save-mock`** |
| User | **`PATCH /api/user/profile`** |

Mock interview and resume AI routes require a logged-in user and enforce **credit** checks and Prisma updates where implemented.

---

### AI layer (Groq)

- **`lib/anthropic.ts`**: Despite the filename (historical), this file **only exports the Groq client** — `import Groq from "groq-sdk"` → **`export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })`**. All AI calls use **`groq.chat.completions.create`** (e.g. model **`llama-3.3-70b-versatile`**) for streaming interview answers and non-streaming JSON/text for mock and resume flows.
- **Environment**: **`GROQ_API_KEY`** in **`.env.local`** (the old Anthropic SDK has been removed from dependencies).

---

### Interview Assistant (implementation notes)

- **`components/interview/InterviewAssistant.tsx`**: Overlay UI, Zustand **`interviewStore`**, **`useSpeechRecognition`** with silence-based trigger to POST **`/api/ai/interview-answer`** and parse **SSE** (`data: {"text":...}` / `[DONE]`). Stopping the session POSTs **`/api/sessions/save`** with duration, credits used, **qaHistory**, language, mode, Desi flag; uses shared **toast** feedback where implemented.
- **`hooks/useSpeechRecognition.ts`**: Web Speech API with local TypeScript types for broad TS compatibility.
- **`app/(dashboard)/interview/page.tsx`**: Auth, credits warning, mounts assistant with **userId** / credits props.

---

### Mock interview

- **`components/mock-interview/`**: **MockInterviewSession**, **QuestionCard**, **VoiceRecorder**, **FeedbackReport**.
- **`app/(dashboard)/mock-interview/page.tsx`**: Auth and minimum credits to start.

---

### Resume builder

- **`components/resume/`**: **ResumeBuilder**, **TemplateSelector**, **ResumePreview**, **ClassicTemplate**, **ModernTemplate**, **MinimalTemplate**.
- **`app/(dashboard)/resume-builder/page.tsx`**: Form + sticky preview.

---

### Settings

- **`app/(dashboard)/settings/page.tsx`**: Profile (**PATCH /api/user/profile**), credits/plan UI, session history from **`/api/sessions/recent?limit=20`**, sign out, danger zone.

---

### Global UX and tooling

- **`components/shared/Toast.tsx`**, **`hooks/useToast.ts`**, **`ToastContainer`** (via providers/layout).
- **`components/shared/Skeleton.tsx`**: Shimmer placeholders.
- **`app/layout.tsx`**: **SessionProvider**, app metadata, fonts as configured.
- **Dependencies** (among others): **next-auth**, **Prisma**, **bcryptjs**, **groq-sdk**, **zustand**, **html2canvas**, **jspdf**.

---

## 1. What this project is (one line)

**InterviewAI** — AI-assisted interview practice and resume help with **speech input**, **streaming answers**, **credits**, and **PostgreSQL** on **Supabase**.

---

## 2. Technology stack

| Layer | Choice |
| ----- | ------ |
| Framework | Next.js **14** (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | **next-auth** (JWT, Google + credentials) |
| Database | PostgreSQL (Supabase) + **Prisma** |
| AI | **Groq** (`groq-sdk`) via **`lib/anthropic.ts`** → **`groq`** export |
| Client state | Zustand (`store/interviewStore.ts`), toast store |

---

## 3. Repository layout (highlights)

| Area | Contents |
| ---- | -------- |
| `app/(marketing)/` | Landing + interview launcher |
| `app/(auth)/` | Login, signup, forgot password |
| `app/(dashboard)/` | Layout, dashboard, interview, mock interview, resume builder, settings |
| `app/api/` | AI, auth, credits, sessions, user |
| `components/interview/` | Interview assistant stack |
| `components/mock-interview/` | Mock flow components |
| `components/resume/` | Builder + templates + preview |
| `components/layout/` | Dashboard sidebar |
| `components/shared/` | Toast, skeleton |
| `hooks/` | Speech, credits, toast |
| `lib/` | `auth`, `anthropic` (Groq client), `prisma`, `speechLanguages` |
| `prisma/schema.prisma` | User, InterviewSession, Payment, MockSession |

---

## 4. Database

- **Connection**: Supabase PostgreSQL using **`DATABASE_URL`** in `.env.local`.
- **Models / tables**: **User**, **InterviewSession**, **Payment**, **MockSession**.
- **Defaults**: New users typically start with **30** credits and plan **`free`**.

---

## 5. Auth flow (summary)

1. **Sign up** → **`POST /api/auth/register`** → user row with hashed password → **`signIn("credentials")`** → JWT with **id / credits / plan** → **`/dashboard`**.
2. **Sign in** → credentials or **Google**; Google users are linked/created in Prisma as needed.
3. **Protected pages** → **`useSession`** on the client; server routes use **`getServerSession(authOptions)`** where applicable.

---

## 6. UI / product surface

| Surface | Status |
| ------- | ------ |
| Landing | Implemented — sections + floating interview launcher |
| Login / Signup | Implemented |
| Dashboard | Implemented |
| Interview Assistant | Implemented — dashboard + landing launcher |
| Mock Interview | Implemented |
| Resume Builder | Implemented |
| Settings | Implemented |

---

## 7. Not done / follow-ups

- **Razorpay**: Live payments not wired; UI may show “coming soon” or similar.
- **Credits on live interview**: Confirm whether **`/api/ai/interview-answer`** should deduct credits per answer in production (currently focused on streaming + session save).
- **Secrets**: Keep **`GROQ_API_KEY`**, **`DATABASE_URL`**, **`NEXTAUTH_SECRET`**, and Google OAuth values **only** in environment variables; rotate any key that was exposed.

---

## 8. Build and quality

- **`npm run build`**: Project is set up to pass typecheck and lint for the App Router and API routes.
- API routes that call **`getServerSession`** declare **`export const dynamic = 'force-dynamic'`** so Vercel/Next do not try to statically analyze them at build time.

---

## 9. Deployment (Vercel + Supabase)

- **Hosting**: [Vercel](https://vercel.com) (free tier is sufficient to start). Import the GitHub repo **[Rushi788816/interviewai](https://github.com/Rushi788816/interviewai)** in the Vercel dashboard (or run **`vercel`** / **`vercel link`** from the CLI) so **pushes to `main`** trigger automatic production deploys.
- **Production URL**: Shown in Vercel → Project → **Domains** (default shape: `https://<project-name>.vercel.app`). Replace this placeholder after your first successful deploy.
- **Database**: Supabase PostgreSQL; set **`DATABASE_URL`** in Vercel to your pooled or direct connection string (never commit it). Prisma: **`postinstall`** runs **`prisma generate`** on each Vercel install.
- **Required environment variables** (Vercel → Project → Settings → Environment Variables): **`GROQ_API_KEY`**, **`DATABASE_URL`**, **`NEXTAUTH_SECRET`**, **`NEXTAUTH_URL`** (must match the live site exactly: `https://…` with **no trailing slash**), **`GOOGLE_CLIENT_ID`**, **`GOOGLE_CLIENT_SECRET`**.
- **OAuth / Supabase dashboard**: Add the production site URL to Google OAuth authorized origins/redirects and to Supabase **allowed origins** / connection settings as needed.
- **Build config**: `next.config.js` sets **`serverComponentsExternalPackages: ['pdf-parse']`** and server-side webpack **externals** for **`html2canvas`** and **`jspdf`** (resume PDF path).

---

*Last updated: March 22, 2026*

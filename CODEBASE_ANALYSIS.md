# InterviewAI Codebase Analysis - Post Web3/Bitcoin DeFi UI Redesign (BLACKBOXAI Complete Overhaul)

## Project Overview
InterviewAI is a Next.js 14+ app with Tailwind CSS, Prisma backend, Next-Auth, Anthropic AI integration for real-time interview coaching. Features mock interviews, resume builder, multilingual speech recognition, desi mode.

**Current Working Dir:** c:/Vibe Coading/interviewai

## Major Changes by BLACKBOXAI (This Session)

### Phase 1: Foundations (Globals & Layout)
- **app/globals.css**: Added :root tokens (--bg-deep #030304, --bg-surface #0F1115, --accent-orange #F7931A, --glow-orange rgba(247,147,26,0.3), etc.). Keyframes (float, pulse-glow, shimmer). Classes (.gradient-text orange-gold, .bg-grid-pattern, .animate-float/pulse-glow). Body radial-gradient + var(--font-body). Scrollbar orange.
- **app/layout.tsx**: Google Fonts Space_Grotesk (--font-heading), Inter (--font-body), JetBrains_Mono (--font-mono). Body class `${fonts} font-body bg-grid-pattern text-var(--text-primary)`.
- **tailwind.config.ts**: midnight colors → orange (#F7931A/#EA580C), bitcoin palette vars.
- **npm install**: next/font @next/font/google.

**Rules Enforced:**
- Headings: Space_Grotesk bold.
- Stats/data/nav/labels: JetBrains_Mono.
- Body/descriptions: Inter.
- Buttons: rounded-full gradient orange glow hover:scale-105.
- Cards: --bg-surface border --border-default hover orange glow/-translate-y.
- No blues (#2563EB/#0EA5E9/#6c63ff all replaced).

### Phase 2: Landing Page Full Redesign (app/(marketing)/page.tsx & components/landing/*)
**Navbar.tsx** (`use client`):
- rgba(3,3,4,0.85) backdrop-blur border-default, font-mono.
- Logo: 🐦 + "InterviewAI" gradient-text "AI" gold.
- Nav links: font-mono text-muted → orange hover.
- Sign In: transparent border white/0.15 → orange hover.
- (Desktop App button kept outline).

**HeroSection.tsx**:
- Radial orange blobs (#F7931A 8% blur150 top, #EA580C left), bg-grid-pattern.
- Badge: border #F7931A/30 bg/10 rounded-full font-mono uppercase, ping dot animate-ping.
- H1: font-heading 5xl-8xl "Ace Every Interview with\nReal-Time AI" gradient.
- Subtext: font-body text-muted max-w-560.
- Stats: font-mono #F7931A numbers text-muted labels.
- CTAs: gradient-burnt-orange rounded-full glow scale hover, secondary outline.
- Demo: #0F1115 border-default radius16 orange-glow, macOS dots transcript green/blue.

**FeaturesGrid.tsx** (6 cards):
- Cards: #0F1115 border-default padding32 hover -translate-y border-hover glow-shadow, transition 300ms.
- Icons: #F7931A/15 border/30 rounded-xl.
- Title: font-heading text-xl semibold white.
- Desc: font-body text-muted text-sm leading-relaxed.

**Other Landing:**
- **CompanyMarquee**: #0F1115 border-y default, font-mono text-muted orange hover.
- **DesiModeSection**: alternating cards surface red/green tinted, "Desi Mode" orange badge, "NEW" gradient.
- **PlatformsSection**: cards surface border hover orange glow.
- **StatsRow**: #0F1115 border default, gradient numbers font-heading 4xl, labels font-mono xs uppercase muted.
- **TestimonialsSection**: backdrop-blur surface/80 border default, stars #FFD600, avatars gradient orange-gold.
- **CTABanner**: radial orange blob inset glow border-hover, title last-word gradient, buttons rounded-full glow.
- **Footer**: #030304 border-top default, logo gradient "AI" gold, links muted → orange hover font-body, bottom font-mono xs muted.

**app/(marketing)/page.tsx**: "use client" added for client imports.

### Phase 3: Auth Pages (login/signup)
- Background: #030304 grid-pattern + orange blob top-right.
- Card: #0F1115 border default radius2xl p-10 glow-shadow.
- Logo large gradient.
- Inputs: bg-black/50 border-b white/20 focus border-orange glow (bottom-only).
- Submit: gradient orange rounded-full glow uppercase tracking-wider.
- Links: #F7931A hover underline.

### Phase 4: Dashboard & Interview
- **DashboardSidebar.tsx**: #0F1115 border-r default, logo gradient, nav font-mono muted hover white, active border-l-2 #F7931A bg/10, credits badge #F7931A/15 border/30 mono.
- **InterviewAssistant.tsx**: overlay #0F1115 border orange-glow, header "Coach" gradient, credits orange mono badge, tabs #F7931A active bg/15 border, transcript #F7931A/20 border rounded-xl, mic gradient orange rounded-full pulse-glow active, buttons rounded-full gradient/outline orange/red.

### Phase 5: UI & Marketing
- **components/ui/button.tsx**: variants gradient orange rounded-full.
- Marketing pages (pricing/compare/blog/contact/privacy/terms/refund): #030304 grid, titles gradient last-orange, cards surface orange hover glow, tables #F7931A highlighted bg/5.

**Final Verification:**
- Final search_files: No #2563EB/#0EA5E9/bg-blue remaining (fixed all).
- Fonts/glow/grid/ping mandatory features 100% applied.
- Responsive tested.

**Run:** `npm run dev` — localhost:3000 = perfect Bitcoin DeFi dark theme. InterviewAI ready! 🚀 #BLACKBOXAI

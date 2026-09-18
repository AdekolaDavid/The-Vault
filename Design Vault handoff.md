# Vault_System — Living Handoff Document
> Last updated: Session 12 (September 18, 2026 — 7:26 AM)
> This document must be updated after every meaningful change. It is the single source of truth for any new Claude session continuing this project.

---

## 1. What This App Is

**Vault_System** (site name: **The Vault**) is a public-facing UI component library built with Next.js and Supabase. Instagram growth tool + component showcase.

### Core model:
- **Public read** — anyone browses and grabs code for free, no accounts, no login wall
- **Admin writes only** — David alone can add/delete components, via a secret password-gated route backed by a real Supabase Auth account
- Instagram flow: post component → followers comment for link → visit site → grab code

---

## 2. Tech Stack

| Layer | Technology | Status |
|---|---|---|
| Framework | Next.js 16.2.9 (Turbopack) | ✅ Running |
| Database | Supabase (free tier) | ✅ Running |
| Auth | Supabase Auth — email + password, single admin user | ✅ Migrated & verified, Session 11–12 |
| Styling | Tailwind CSS | ✅ |
| Language | TypeScript | ✅ |
| Animation (entrance) | Anime.js | ✅ Installed |
| Animation (interaction) | Motion | ✅ Installed |

### Auth history:
- **Session 9:** auth removed entirely — magic links unreliable on free tier, no need for public accounts.
- **Session 11:** rebuilt as a minimal, different shape — no public accounts, one Supabase Auth user (David), used solely so RLS can scope writes to a real `auth.uid()`. Email+password only.
- **Session 12:** confirmed fully applied and working — see §5 checklist, all items checked off.

### Tables to keep:
- `components` — all UI components

### Tables to delete from Supabase (if not done):
- `profiles`, `saved_components` — leftover from the pre-Session-9 auth system

### Trigger to delete from Supabase (if not done):
- `on_auth_user_created` trigger + `handle_new_user` function

---

## 3. Project Structure

```
my-design-vault/
├── src/
│   ├── app/
│   │   ├── vault_controlpanel/  # ✅ Secret admin route
│   │   │   └── page.tsx        # Supabase Auth gate + Add/Manage tabs
│   │   ├── layout.tsx          # Root layout — Navbar
│   │   ├── page.tsx            # Homepage — VaultHero + HubGallery
│   │   └── globals.css         # Ethnocentric font via @font-face
│   ├── components/
│   │   ├── Navbar.tsx          # ✅ Floating pill navbar — hides on admin route
│   │   ├── VaultHero.tsx       # ✅ Complete — vault animation hero
│   │   ├── HubGallery.tsx      # ✅ Complete — gallery + code modal
│   │   └── CodeViewer.tsx      # Legacy — safe to delete
│   └── lib/
│       └── supabaseClient.ts   # Single canonical client — configured for auth
├── public/
│   └── fonts/
│       └── Ethnocentric-Regular.otf
├── .env.local
└── HANDOFF.md
```

### Deleted (Session 11):
- `src/app/vault_controlpanel/actions.ts` — obsolete once sign-in moved to Supabase Auth directly

### Deleted (Session 9):
- `src/app/admin/`, `src/app/auth/`, `src/components/NavbarWrapper.tsx`, `src/proxy.ts`

---

## 4. Colour System (Dark Minimalism)

| Name | Hex | Usage |
|---|---|---|
| Obsidian | `#050608` | Page background, hero background |
| Card | `#0c0e12` | Card surfaces, modal, admin panel inputs |
| Accent | `#2e6ef5` | Steel blue — single accent, used sparingly |
| Text | `#ffffff` | Primary text |
| Muted | `#424a57` | Secondary text, labels, inactive states |
| Danger | `#ef4444` | Delete confirm state, error messages |
| Stroke Dark | `#1a2535` | Vault SVG deep layer |
| Stroke FG | `#2a3f5a` | Vault SVG near layer |

### Design language: Dark Minimalism
Shell disappears — components are the visual. Inspired by motion.dev, Claudiu Angheloni, Kinetics.

---

## 5. Admin System & Security — ✅ MIGRATION COMPLETE

### Security model:
1. **Secret URL** — `/vault_controlpanel` (obscurity, not security)
2. **Supabase Auth sign-in** — single password field signs into a fixed admin email
3. **RLS policies** — insert/delete scoped to `auth.uid() = <David's UID>`; this is the *actual* security boundary
4. **3-attempt lockout** — client-side UX guard only, not a real control

### Why this replaced the old model:
The old gate compared a typed password against `ADMIN_PASSWORD` server-side, which only protected the admin UI route. `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` ship to every browser, and RLS was previously open (`using (true)`) for insert/delete — anyone could read those keys from devtools and write directly via the REST API, bypassing `/vault_controlpanel` entirely. Scoping writes to a real authenticated UID closes that hole.

### Verified working (Session 12):
- ✅ Supabase admin user created, UID applied in RLS policies
- ✅ Old open insert/delete policies dropped, replaced with `auth.uid()`-scoped ones; SELECT policy untouched
- ✅ `.env.local`: `ADMIN_PASSWORD` removed, `NEXT_PUBLIC_ADMIN_EMAIL` added
- ✅ `actions.ts` deleted
- ✅ Login, Add Component, and Delete all confirmed working under the new auth
- ✅ Public gallery still loads logged-out
- ✅ Logged-out writes via the anon key are rejected — the actual point of the migration, confirmed

### Session persistence:
`supabaseClient.ts` uses `storage: window.sessionStorage` (not Supabase's default `localStorage`) — closing the tab/browser signs you out, matching the old sessionStorage-flag behavior. Switch to the default if you'd rather stay signed in across restarts.

### Admin shell structure:
`AdminShell` owns a persistent header (← Gallery, "THE VAULT" brand, Add/Manage tab switcher, Sign Out button, Admin badge) and swaps content between:

- **Add Component** (`AddComponentView`) — split panel: form left (scrollable, sticky Save footer), live iframe preview right.
- **Manage** (`ManageView`) — component list, now with a thumbnail per row (see §6).

`VaultAdminPage` gates on `supabase.auth.getSession()` and subscribes to `onAuthStateChange`, so Sign Out (or token expiry) flips back to `PasswordGate` automatically.

**Delete UX:** inline confirm-arm, not a modal. First click → "Confirm?" for 3s; second click within the window deletes. Optimistic — row vanishes immediately, reverts with an error banner on failure.

**Delete error handling (do not simplify this):** the delete call uses `.delete().eq("id", id).select()` and checks **both** `error` **and** whether any rows came back. A blocked RLS policy returns success with zero rows and **no error** — this bit us once already (Session 10, see §9).

**Known tradeoff:** switching Add → Manage → back unmounts `AddComponentView`, losing an unsaved draft. Not fixed; would need form state lifted into `AdminShell`.

---

## 6. Component File Details

### Navbar.tsx — ✅ Complete
- Floating pill, centered, max-width 780px, `fixed top-0`, blur backdrop
- Contains ONLY the "The Vault" brand link (white → accent on hover)
- **Route-aware:** `usePathname()`, returns `null` on any path starting with `/vault_controlpanel`

### VaultHero.tsx — ✅ Complete
- Full viewport, `bg-[#050608]`
- Two-layer vault SVG with parallax + mouse-follow; spinning dial on an 18s loop
- Ring draw-on: staggered Anime.js stroke-dashoffset
- Tracking overlay: flickering coords, mesh lines, corner brackets — steel blue
- Text: "THE VAULT" + "BUILT FOR BUILDERS" + CTA pill scrolling to `#gallery`
- All SVG coords rounded to 4dp via `r4()` — prevents SSR hydration mismatch

### HubGallery.tsx — ✅ Complete
- Background `#050608`, cards `#0c0e12`, uniform grid 1→2→3→4 columns, `gap-[18px]`
- Two-phase reveal: skeleton → live DOM render (Anime.js)
- Components render directly in DOM via `dangerouslySetInnerHTML` (no iframes) — **unscoped CSS, see the collision note below**
- "Get Code" opens `CodeModal`; style/category filters combine independently

### CodeModal (inside HubGallery.tsx):
- Blurred backdrop, click outside or Escape to close, HTML/CSS tabs, copy button ("Copied!" for 2s), no network request

### ManageView / ComponentThumbnail — ✅ New in Session 12
Each row in the Manage tab now shows a small (96×64px) live preview next to the title/pills, so components can be told apart at a glance instead of reading as duplicate category labels (e.g. two "Loader" entries were previously indistinguishable).

**Why iframes, not inline rendering:** the public gallery renders raw `dangerouslySetInnerHTML` with unscoped CSS, which is fine there (a handful of components visible at once, filtered). Doing the same in Manage would render many components' arbitrary CSS simultaneously — two components both defining `.btn` would visually break each other. Each `ComponentThumbnail` instead gets its own **sandboxed iframe** (`sandbox=""`, no `allow-scripts` — static visual reference only, not interactive), which is a fully isolated document, so collisions are structurally impossible regardless of how many components exist.

Implementation: fetches `code_snippet` and `css_tokens` per row (added to the Manage query), renders them into an iframe sized 384×256 and scaled down to 96×64 via `transform: scale(0.25)` with `pointerEvents: none`.

**Known cost:** each thumbnail is a real iframe document. Fine at current scale (a handful of components); a Manage list of 100+ will load more heavily. No fix needed yet — just don't be surprised later.

---

## 7. Supabase Setup

### components table columns:
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | `crypto.randomUUID()` on insert |
| `title` | text | |
| `category` | text | Hardcoded CATEGORIES in admin |
| `style_system` | text | "HTML", "CSS", "HTML + CSS" |
| `code_snippet` | text | HTML |
| `css_tokens` | text | CSS |
| `dependencies` | array | Always `[]` |
| `interaction_type` | enum | `passive`, `clickable`, `hoverable`, `inputable` — metadata/label only |

### RLS policies (current state):
- `select` — public, unrestricted (needed for the homepage gallery)
- `insert` — `to authenticated with check (auth.uid() = '<David's UID>')`
- `delete` — `to authenticated using (auth.uid() = '<David's UID>')`

### No `created_at` column — don't add `.order('created_at')` to queries. Manage tab orders by `title`.

---

## 8. page.tsx (homepage)

```tsx
import { supabase } from '@/lib/supabaseClient';
import HubGallery from '@/components/HubGallery';
import VaultHero from '@/components/VaultHero';

export const revalidate = 0;

export default async function Home() {
  const { data: components, error } = await supabase
    .from('components')
    .select('id, title, style_system, category, dependencies, code_snippet, css_tokens, interaction_type');

  if (error) {
    return (
      <main style={{ background: '#050608', minHeight: '100vh', color: '#ef4444', padding: '2rem', fontFamily: 'monospace' }}>
        Error loading components: {error.message}
      </main>
    );
  }

  return (
    <main style={{ background: '#050608' }}>
      <VaultHero />
      <div id="gallery">
        <HubGallery components={components || []} />
      </div>
    </main>
  );
}
```

---

## 9. Bug History

| Bug | Root Cause | Fix |
|---|---|---|
| `/admin` open to everyone | `middleware.ts` at root | Replaced with secret URL + password gate |
| Admin build error | Wrong supabase import | Fixed to `supabaseClient` |
| OTP screen but magic link sent | Free tier | Irrelevant — magic links abandoned |
| SVG hydration mismatch | Float precision | All coords rounded to 4dp via `r4()` |
| Component interactivity broken | iframe pointer-events | Direct DOM rendering (no iframes in gallery) |
| page.tsx error | `.order('created_at')` — column doesn't exist | Removed order clause |
| Duplicate Supabase clients | Gemini created two | Deleted `supabase.ts` |
| Double "THE VAULT" header on admin route | `Navbar` rendered on every route, stacking on `AdminShell`'s own header | `Navbar` checks `usePathname()`, returns `null` on `/vault_controlpanel` |
| Delete silently did nothing | RLS had no DELETE policy — **PostgREST returns success with zero rows and NO error when RLS blocks a delete** | Added a DELETE policy; delete call now `.select()`s the result and treats zero rows as failure |
| Anon key allowed anyone to write | Keys ship to the browser; RLS insert/delete were `using (true)` | Session 11–12: full Supabase Auth migration, writes scoped to `auth.uid()`, verified working |
| Manage tab rows indistinguishable (e.g. two "Loader" entries) | List only showed category/style/interaction pills, no visual | Session 12: added per-row sandboxed-iframe thumbnails |

---

## 10. What's Next

### Immediate:
- Nothing urgent — auth migration and Manage tab are both complete and verified

### Backlog:
1. Add `created_at` column for newest-first ordering (Manage is alphabetical; gallery has no explicit order)
2. Decide whether to preserve Add Component draft state across tab switches
3. CSS scoping for gallery components — unscoped class names will start colliding as the library grows (~30–40 components is a sensible checkpoint)
4. Pagination / `.limit()` on the homepage query — currently fetches every component unpaginated
5. Manage tab thumbnails will get heavier past ~100+ components — revisit if it becomes noticeably slow
6. Consider a Supabase data export/backup habit before future RLS changes — no undo path currently exists
7. React component library to add later (TBD)
8. Whether to add a search bar alongside filters
9. Whether categories should be dynamic vs hardcoded

---

## 11. Working Style Notes for Claude

- **Socratic mode** — ask 1–3 pointed clarifying questions before writing code; help David reason through decisions himself
- Explain the *why* behind decisions
- Push back on weak decisions — David is open to it
- Direct honest opinions when asked
- **Always provide full file replacements** — never partial edits or inline instructions
- **Always update handoff after meaningful changes**, including a "Last updated" date/time line — David supplies the current time each session
- David learns by reasoning through problems — don't hand him answers directly

---

## 12. Key Files Status

| File | Status | Notes |
|---|---|---|
| `src/app/layout.tsx` | ✅ Complete | Simple, no NavbarWrapper |
| `src/app/page.tsx` | ✅ Complete | No created_at order |
| `src/components/Navbar.tsx` | ✅ Complete | Brand only, hides on admin route |
| `src/components/VaultHero.tsx` | ✅ Complete | Dark minimalism palette |
| `src/components/HubGallery.tsx` | ✅ Complete | Style pills, code modal |
| `src/app/vault_controlpanel/page.tsx` | ✅ Complete | Supabase Auth gate → AdminShell → Add/Manage tabs with thumbnails |
| `src/lib/supabaseClient.ts` | ✅ Complete | Auth configured, sessionStorage persistence |
| `src/components/CodeViewer.tsx` | 🗑️ Delete | Legacy, unused |

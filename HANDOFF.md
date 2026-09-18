# Vault_System — Living Handoff Document
> Last updated: Session 11 (August 20, 2026 — time TBC, David to confirm)
> This document must be updated after every meaningful change. It is the single source of truth for any new Claude session continuing this project.

---

## ⚠️ READ FIRST — Session 11 is MID-MIGRATION

Session 11 replaced the fake password gate with real Supabase Auth. **The code is written but NOT yet verified end-to-end by David.** A new session must confirm the checklist in §5.1 before treating this as done.

If admin login or saving is broken when you pick this up, work through §5.1 in order — the most likely culprit is a missed step in Supabase (user not created, UID not pasted into the policies, or old open policies not dropped).

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
| Auth | Supabase Auth — email + password, single admin user | ⚠️ New in Session 11, unverified |
| Styling | Tailwind CSS | ✅ |
| Language | TypeScript | ✅ |
| Animation (entrance) | Anime.js | ✅ Installed |
| Animation (interaction) | Motion | ✅ Installed |

### Auth history (important context):
- **Session 9:** auth removed entirely — magic links were unreliable on free tier and user accounts served no purpose.
- **Session 11:** auth brought back, but **deliberately minimal and different in shape**. There are still no public user accounts. There is exactly one Supabase Auth user (David), used solely so RLS policies can scope writes to a real `auth.uid()`. Email+password only — no magic links, no OTP, no signup flow. Do not re-introduce public accounts; that is not what this is.

### Tables to keep:
- `components` — all UI components

### Tables to delete from Supabase (if not done):
- `profiles` — no longer needed
- `saved_components` — no longer needed

### Trigger to delete from Supabase (if not done):
- `on_auth_user_created` trigger + `handle_new_user` function

---

## 3. Project Structure

```
my-design-vault/
├── src/
│   ├── app/
│   │   ├── vault_controlpanel/  # ✅ Secret admin route
│   │   │   └── page.tsx        # Password gate (Supabase Auth) + Add/Manage tabs
│   │   ├── layout.tsx          # Root layout — Navbar
│   │   ├── page.tsx            # Homepage — VaultHero + HubGallery
│   │   └── globals.css         # Ethnocentric font via @font-face
│   ├── components/
│   │   ├── Navbar.tsx          # ✅ Floating pill navbar — hides on admin route
│   │   ├── VaultHero.tsx       # ✅ Complete — vault animation hero
│   │   ├── HubGallery.tsx      # ✅ Complete — gallery + code modal
│   │   └── CodeViewer.tsx      # Legacy — safe to delete
│   └── lib/
│       └── supabaseClient.ts   # Single canonical client — now configured for auth
├── public/
│   └── fonts/
│       └── Ethnocentric-Regular.otf
├── .env.local
└── HANDOFF.md
```

### Deleted in Session 11:
- `src/app/vault_controlpanel/actions.ts` — the server action that string-compared `ADMIN_PASSWORD`. Obsolete; sign-in now goes through Supabase Auth directly from the client, which is the standard safe pattern (same reason the anon key is safe to expose).

### Deleted in Session 9:
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

## 5. Admin System & Security

### Security model:
1. **Secret URL** — `/vault_controlpanel` (obscurity, not security)
2. **Supabase Auth sign-in** — single password field signs into a fixed admin email
3. **RLS policies** — insert/delete scoped to `auth.uid() = <David's UID>`; this is the *actual* security boundary
4. **3-attempt lockout** — client-side UX guard only, trivially bypassable, not a real control

### Why this replaced the old model (Session 11 reasoning):
The old gate compared a typed password against `process.env.ADMIN_PASSWORD` in a server action. That protected the *admin UI route* but nothing else: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` ship to every visitor's browser, and RLS policies were open (`using (true)`) for insert and delete. Anyone could read those keys from devtools and insert or wipe the `components` table via the Supabase REST API without ever touching `/vault_controlpanel`. Scoping writes to a real authenticated UID closes that hole.

### 5.1 MIGRATION CHECKLIST — verify before treating Session 11 as done

- [ ] **Supabase user created.** Dashboard → Authentication → Users → Add user. Real-looking email (e.g. `admin@thevault.internal`, doesn't need to be reachable) + strong password. Copy the User UID.
- [ ] **RLS policies replaced.** SQL Editor, with the real UID substituted:
  ```sql
  drop policy if exists "Allow public insert on components" on components;
  drop policy if exists "Allow public delete on components" on components;

  create policy "Admin insert only"
  on components for insert
  to authenticated
  with check (auth.uid() = 'YOUR-USER-UUID-HERE');

  create policy "Admin delete only"
  on components for delete
  to authenticated
  using (auth.uid() = 'YOUR-USER-UUID-HERE');
  ```
  Check Authentication → Policies for the exact existing policy names if the `drop` statements don't match. **Leave the existing SELECT policy alone** — the public gallery depends on it.
- [ ] **`.env.local` updated.** Remove `ADMIN_PASSWORD` (dead — the real password now lives hashed in Supabase Auth). Add `NEXT_PUBLIC_ADMIN_EMAIL=admin@thevault.internal`. Safe to expose: it's a username, not a secret.
- [ ] **`actions.ts` deleted.**
- [ ] **Login works** with the new Supabase password.
- [ ] **Add Component saves** while signed in.
- [ ] **Delete works** while signed in.
- [ ] **Public gallery still loads** in a logged-out/incognito window.
- [ ] **Writes are actually blocked when logged out** — the real test of the whole migration. In an incognito devtools console, try an insert against the REST API with the anon key. It should be rejected.

### Session persistence decision:
`supabaseClient.ts` sets `storage: window.sessionStorage` rather than the Supabase default of `localStorage`. This deliberately preserves the old behavior — closing the tab/browser signs you out. Switch to the default (omit `storage`) if staying signed in across restarts is preferred.

### Admin shell structure:
`AdminShell` owns a persistent header (← Gallery, "THE VAULT" brand, Add/Manage tab switcher, Sign Out button, Admin badge) and swaps content between:

- **Add Component** (`AddComponentView`) — split panel: form left (scrollable, sticky Save footer), live iframe preview right.
- **Manage** (`ManageView`) — component list with category/style/interaction pills and a Delete button per row.

`VaultAdminPage` gates on a real session via `supabase.auth.getSession()` and subscribes to `onAuthStateChange`, so Sign Out (or token expiry) flips back to `PasswordGate` automatically.

**Delete UX:** inline confirm-arm, not a modal. First click → "Confirm?" for 3s; second click within the window deletes. Optimistic — row vanishes immediately, reverts with an error banner on failure. Chosen over a modal because this is a casual single-admin tool; 3s is enough to stop a stray double-click.

**Delete error handling (important):** the delete call uses `.delete().eq("id", id).select()` and checks **both** `error` **and** whether any rows came back. A blocked RLS policy returns success with zero rows and **no error** — see §9. Never simplify this back to an `error`-only check.

**Known tradeoff:** switching Add → Manage → back unmounts `AddComponentView`, losing an unsaved draft. Not fixed; would require lifting form state into `AdminShell`.

**No live thumbnails in Manage:** deliberate. Components render via `dangerouslySetInnerHTML` with unscoped CSS, so rendering many previews at once multiplies class-collision risk (two components both defining `.btn`) on a screen whose only job is "scan title, prune." Needs real CSS scoping first.

---

## 6. Component File Details

### Navbar.tsx — ✅ Complete
- Floating pill, centered, max-width 780px, `fixed top-0`, blur backdrop
- Contains ONLY the "The Vault" brand link (white → accent on hover)
- **Route-aware:** uses `usePathname()`, returns `null` on any path starting with `/vault_controlpanel`

### VaultHero.tsx — ✅ Complete
- Full viewport, `bg-[#050608]`
- Two-layer vault SVG with parallax + mouse-follow; spinning dial on an 18s loop
- Ring draw-on: staggered Anime.js stroke-dashoffset
- Tracking overlay: flickering coords, mesh lines, corner brackets — steel blue
- Text: "THE VAULT" (white Ethnocentric) + "BUILT FOR BUILDERS" (55% white) + CTA pill scrolling to `#gallery`
- All SVG coords rounded to 4dp via `r4()` — prevents SSR hydration mismatch

### HubGallery.tsx — ✅ Complete
- Background `#050608`, cards `#0c0e12`, uniform grid 1→2→3→4 columns, `gap-[18px]`
- Two-phase reveal: skeleton → live DOM render (Anime.js)
- Components render directly in DOM via `dangerouslySetInnerHTML` (no iframes)
- "Get Code" opens `CodeModal` (not a route)
- Style system pills: All / HTML / CSS / HTML + CSS; category filter dropdown; filters combine independently

### CodeModal (inside HubGallery.tsx):
- Blurred backdrop, click outside or Escape to close, HTML/CSS tabs, copy button ("Copied!" for 2s)
- No network request — data already in memory

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
| `interaction_type` | enum | `passive`, `clickable`, `hoverable`, `inputable` — metadata/label only, no longer controls pointer-events |

### No `created_at` column — don't add `.order('created_at')` to queries. Manage tab orders by `title` as a result.

---

## 8. page.tsx

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
| **Delete silently did nothing** | RLS had no DELETE policy. **PostgREST returns success with zero rows and NO error when RLS blocks a delete** — the code only checked `error`, so it looked like it worked | Added a DELETE policy, and changed the call to `.select()` the deleted rows and treat a zero-row result as a failure |
| Anon key allowed anyone to write | Keys ship to the browser; RLS insert/delete policies were `using (true)` | Session 11 auth migration — writes scoped to `auth.uid()` |

---

## 10. What's Next

### Immediate:
1. **Finish verifying the Session 11 auth migration** — §5.1 checklist, especially the logged-out write test
2. Consider a Supabase data export before touching RLS policies again — there's currently no backup path and no undo

### After that:
3. Add `created_at` column for newest-first ordering (Manage is alphabetical; gallery has no explicit order)
4. Decide whether to preserve Add Component draft state across tab switches
5. CSS scoping for gallery components — unscoped class names will start colliding as the library grows (~30–40 components is a sensible checkpoint)
6. Pagination / `.limit()` on the homepage query — currently fetches every component unpaginated
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
| `src/app/vault_controlpanel/page.tsx` | ⚠️ Written, unverified | Supabase Auth gate → AdminShell → Add/Manage tabs |
| `src/lib/supabaseClient.ts` | ⚠️ Written, unverified | Auth configured, sessionStorage persistence |
| `src/app/vault_controlpanel/actions.ts` | 🗑️ Delete | Obsolete after auth migration |
| `src/components/CodeViewer.tsx` | 🗑️ Delete | Legacy, unused |

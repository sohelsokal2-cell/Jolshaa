# Jolshaa Frontend Redesign — Handoff Plan (Safe UI Redesign, Page by Page)

This document is a self-contained handoff so **another AI/session** can continue the
redesign work without needing the original conversation history. Follow it exactly,
one page/unit at a time.

---

## 0. Hard Rules (never break these)

1. **DO NOT** change/remove/rename any function, state variable, `useState`,
   `useEffect`, API call, or event handler.
2. **DO NOT** change any prop names passed between components.
3. **DO NOT** remove any existing feature/button/option even if it's absent from the
   reference design in `stitch_jolshaa_social_media_platform/` — keep it, just restyle it.
4. **ONLY** change CSS/Tailwind classes, layout structure (flex/grid), and visual
   elements (icons, button shapes, card styles).
5. Use the shared `jolshaa-*` Tailwind design tokens (see §1) — don't invent new
   colors/tokens.
6. Do **ONE page/unit at a time**. After each page, give a full testing checklist of
   every interactive element on that page, and wait for confirmation before moving on.
7. After finishing a page/file, grep-verify it's clean (see §3) before declaring it done.

Reference designs live in `stitch_jolshaa_social_media_platform/jolshaa_*/code.html`
(and `stitch_jolshaa_social_media_platform/jolshaa/DESIGN.md` for the full token/type/
spacing spec). Use these for visual direction (spacing, card shapes, shadows, type
scale) — not for feature parity.

---

## 1. Design System Reference

### 1a. Target tokens (`jolshaa-*`, defined in `frontend/tailwind.config.js`)

```
jolshaa-teal, jolshaa-teal-container, jolshaa-on-teal
jolshaa-indigo, jolshaa-indigo-container, jolshaa-indigo-fixed,
  jolshaa-indigo-fixed-dim, jolshaa-on-indigo-fixed
jolshaa-coral, jolshaa-coral-container
jolshaa-surface, jolshaa-surface-container-lowest, jolshaa-surface-container-low,
  jolshaa-surface-container, jolshaa-surface-container-high
jolshaa-on-surface, jolshaa-on-surface-variant
jolshaa-outline, jolshaa-outline-variant
shadow-ambient, shadow-ambient-hover   (box-shadow utilities)
font-display                           (Be Vietnam Pro, for headings)
```

Semantic Tailwind color classes (`red-*`, `amber-*`, `green-*`, `blue-*`, `orange-*`,
`emerald-*`, `purple-*`, `pink-*`) are **kept** for error/warning/success/info states —
just strip any `dark:` variant paired with them.

### 1b. OLD systems to remove — there are TWO legacy layers, not one

**Layer A — "Aetheric Social" raw Tailwind classes** (from the old violet/navy palette
in `tailwind.config.js`):
- `neutral-*`, `primary-[0-9]+` (e.g. `primary-500`, `primary-600`), `accent-*`
- any `dark:` variant
- old shadows: `shadow-nav`, `shadow-dropdown`, `shadow-card`, `shadow-modal`
- `border-neutral-*`

**Layer B — "Aetheric Social" component aliases** (defined in
`frontend/src/index.css` under `@layer components` / `@layer utilities` — these look
like plain semantic names and are easy to mistake for the new system, but they are
NOT jolshaa tokens):
- `card`, `card-hover` (bare classes — glass-morphism dark card)
- `input`, `input-error` (bare classes — dark translucent input)
- `btn`, `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`, `btn-success`,
  `btn-sm`, `btn-lg`, `btn-icon`
- `badge`, `badge-primary`, `badge-success`, `badge-warning`, `badge-danger`,
  `badge-neutral`
- `text-on-surface`, `text-on-surface-variant` (defined in `@layer utilities`,
  resolve to hardcoded hex `#dae2fd` / `#cbc3d7` — **not** related to
  `jolshaa-on-surface`)
- `text-primary-aetheric`, `text-outline`
- `skeleton`, `divider`, `avatar`, `avatar-xs/sm/md/lg/xl/2xl/3xl`, `avatar-ring`
- `dropdown`, `dropdown-item`
- `modal-overlay`, `modal-content`
- `nav-link`, `nav-link-active`
- `glass-panel`, `glass-nav`, `glass`, `glass-heavy`
- `chip`
- `text-gradient-violet`, `glow-violet`, `glow-violet-sm`

Every file using Layer B classes needs the same treatment as Layer A files: replace
with the equivalent `jolshaa-*` utility combo directly in the component (do not edit
`index.css` — other legacy pages may still depend on those definitions until they're
migrated too).

### 1c. Quick replacement cheatsheet (guideline, adapt per context)

| Old | New |
|---|---|
| `card` | `bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-4` |
| `input` | `w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal` |
| `btn-primary` | `bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container rounded-lg px-4 py-2 text-sm font-medium transition-colors` |
| `btn-secondary` | `bg-jolshaa-indigo-fixed text-jolshaa-on-indigo-fixed hover:bg-jolshaa-indigo-fixed-dim rounded-lg px-4 py-2 text-sm font-medium` |
| `btn-ghost` | `text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low rounded-lg px-4 py-2 text-sm font-medium` |
| `btn-danger` | `bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-medium` |
| `text-on-surface` | `text-jolshaa-on-surface` |
| `text-on-surface-variant` | `text-jolshaa-on-surface-variant` |
| `neutral-900/800 text-` | `text-jolshaa-on-surface` |
| `neutral-500/400/600 text-` | `text-jolshaa-on-surface-variant` |
| `bg-white dark:bg-neutral-800` | `bg-jolshaa-surface-container-lowest` |
| `bg-neutral-50 dark:bg-neutral-800` | `bg-jolshaa-surface-container-low` |
| `border-neutral-200/300 dark:border-neutral-*` | `border-jolshaa-outline-variant` |
| `primary-600/500 bg-` (brand action) | `bg-jolshaa-teal` (or `jolshaa-indigo` if it's a nav/secondary action — check reference) |
| `shadow-card` | `shadow-ambient` |
| `shadow-modal`/`shadow-dropdown` | `shadow-ambient-hover` |
| headings (`<h1>-<h4>`) | add `font-display` |

Keep `red-*/amber-*/green-*/blue-*/orange-*/emerald-*/purple-*/pink-*` for status
colors — just drop `dark:` pairs.

---

## 2. Execution Order (one unit at a time, do not skip ahead)

All of `frontend/src/pages/` is now DONE (verified clean — see §4 for the full list).
Remaining work is entirely inside `frontend/src/components/`.

### Step 1 — Small leftover `dark:` variants (quick wins, do first)
These already use `jolshaa-*` base classes — just a single stray `dark:` variant
still paired on. Not full retints, just delete the stray `dark:` class.
- [ ] **DarkModeToggle.js** (1 leftover `dark:` — line ~9, `dark:hover:bg-jolshaa-surface-container-high`)
- [ ] **MultiAdNetworks.js** (1 leftover — line ~290, `dark:bg-jolshaa-surface-container-high` / `dark:border-jolshaa-outline-variant`)
- [ ] **SubscribeButton.js** (1 leftover — line ~24, `dark:bg-jolshaa-surface-container-high`)
- [ ] **StarGiftButton.js** (1 leftover `dark:text-amber-400 dark:hover:text-amber-300`)
- [ ] **StarPurchaseModal.js** (1 leftover `dark:text-green-400`)

### Step 2 — Small/medium components
- [ ] **StarGiftModal.js** (3 old classes)
- [ ] **SubscriberBadge.js** (4 old classes)
- [ ] **WarningOverlay.js** (4 old classes)
- [ ] **ShortsPlayer.js** (7 old classes)
- [ ] **VideoUploadProgress.js** (7 old classes)

### Step 3 — Larger components
- [ ] **FactCheckVoteModal.js** (11 old classes)
- [ ] **HelpCoordinationChat.js** (11 old classes)
- [ ] **admin/AdsterraSettings.js** (15 old classes)
- [ ] **FactCheckBadge.js** (17 old classes)
- [ ] **VideoAnalyticsDashboard.js** (21 old classes)

### Not needed (confirmed non-issues)
- `CreatorSubscriptionManager.js` — pure redirect component (`return null`), no JSX.
- `CreatePost.js` (page file) — already clean.
- `components/CreatePostBox.js` — already clean (verified this pass).

---

## 3. Verification command (run after every file)

```bash
grep -nE "neutral-[0-9]|primary-[0-9]{2,}|accent-[0-9]|dark:|shadow-nav|shadow-dropdown|shadow-card|shadow-modal|border-neutral" <file>
grep -nE '"card"|className="card|className="input|text-on-surface\b|surface-high\b|surface-highest\b|btn-primary|btn-secondary|btn-ghost|btn-danger|btn-success' <file>
```

Both should return **zero matches** (aside from intentional `bg-white` toggle-knob
spans, which are fine to keep — those are literal white dots on a colored switch, not
theme classes).

Full-repo sanity sweep (run once after all Step 1–3 files are done, to confirm nothing
was missed anywhere in `frontend/src`):

```bash
cd frontend/src
grep -rlE "neutral-[0-9]|primary-[0-9]{2,}|accent-[0-9]|dark:|shadow-nav|shadow-dropdown|shadow-card|shadow-modal|border-neutral" --include="*.js" .
grep -rlE '"card"|className="card|className="input|text-on-surface\b|surface-high\b|surface-highest\b|btn-primary|btn-secondary|btn-ghost|btn-danger|btn-success|nav-link|dropdown-item|modal-overlay|modal-content|glass-panel|glass-nav\b' --include="*.js" .
```
Both should return no files.

---

## 4. Already fully done (verified clean, no action needed)

**Pages (`frontend/src/pages/` — all 43 files, 100% done):**
AdminPanel.js, AdNetworksManager.js, AdsManagerDashboard.js, CreateEvent.js,
CreateGroup.js, CreatePage.js, CreatePost.js, CreatorDashboard.js, CreatorEarnings.js,
CreatorSubscriptionManager.js (non-issue, redirect only), EditProfile.js, EventPage.js,
Events.js, FriendRequests.js, GroupPage.js, Groups.js, HashtagPage.js, HelpFeed.js,
HelpRequestDetail.js, Landing.js, ListingDetail.js, Login.js, MarketplacePage.js,
MemoriesPage.js, Messages.js, MonetizationApplicationPage.js, NewsFeed.js,
NoteDetail.js, NotesPage.js, NotificationSettings.js, NotificationsPage.js,
PagePage.js, Pages.js, PaymentResult.js, PrivacySettings.js, Profile.js,
SavedPostsPage.js, SearchResults.js, Security.js, Signup.js,
SubscriptionTiersPage.js, TopicFeedPage.js, TrendingPage.js.

**Admin components:** `components/admin/MonetizationTab.js`,
`components/admin/BulkActionBar.js`, `components/admin/Drawer.js`.

**Other components confirmed clean:** `components/CreatePostBox.js`.

---

## 5. After each file

Provide a testing checklist enumerating every interactive element in that
component (buttons, links, form fields, toggles, modals, tabs) so the user can click
through and confirm nothing broke before moving to the next item in §2.

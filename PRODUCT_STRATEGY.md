# Jolshaa — Product Strategy, Unique Ideas & Fix Plan

> Target: Bangladesh-first, internationally-capable social platform ("like Facebook, not Facebook").
> This doc has 3 parts: (A) Unique feature ideas, (B) Problems & gaps found in the codebase, (C) Prioritized fix plan.

---

## PART A — Unique feature ideas (things Facebook does NOT do well for BD users)

These are chosen to be **defensible differentiators** — things you can put on a landing page as "why Jolshaa, not Facebook."

### A1. "Ekসাথে" — Community Help & Crisis Coordination (you already started this!)
You already have `HelpRequest`, `helpController`, `HelpCoordinationChat`. **Lean into it hard** — this is your single best differentiator.
- Bangladesh reality: floods (বন্যা), blood donation, missing persons, load-shedding info, exam/admission help.
- Turn it into a first-class tab: **"সাহায্য" (Help)** with categories: Blood, Flood/Disaster, Lost & Found, Free giveaway (জিনিস দান), Local emergency.
- Location + urgency based feed. Verified helpers get a badge. This is genuinely life-saving and Facebook groups do it badly.
- **Marketing hook:** "The only social app that helps your para (পাড়া) in a crisis."

### A2. Low-data / "Village Mode" (ডেটা সেভার)
You already have `DataSaverContext` + `mediaProcessor`. Make it a **headline feature**:
- One toggle → text-first feed, images load on tap, autoplay off, aggressive compression.
- Show "You saved X MB this week." BD users are extremely data-price sensitive.
- **Marketing hook:** "চলে কম MB-তে" — works on 2G/slow 3G.

### A3. bKash/Nagad-native creator economy
You have subscriptions, tips, payouts, `paymentService`, SSLCommerz-style flow. Make the money layer **local**:
- Tips in Taka, "Send চা-নাস্তা" (micro-tip ৳10/৳20) style playful tipping.
- Creator payout directly to bKash/Nagad, minimum ৳ threshold suited to BD.
- **Marketing hook:** "Get paid in Taka, cash out to bKash." No other global app does this.

### A4. Bangla-first UX
- Bilingual toggle (বাংলা ↔ English) everywhere, Bangla search that handles phonetic ("banan" tolerance).
- Bangla auto-caption / hashtag suggestions (you have `aiCaption` — extend to Bangla).
- Festival themes: Eid, Pohela Boishakh, Victory Day auto-skins.

### A5. "Para" (locality) groups + hyperlocal feed
- Auto-suggest groups by area (Dhanmondi, Mirpur, Sylhet...).
- Local marketplace + local events + local help = a "neighborhood" super-tab. You already have Marketplace, Events, Groups — bundle them into a **locality view**.

### A6. Trust & Safety as a *feature* (not just admin)
You have a HUGE moderation/fact-check backend. Expose the good parts to users:
- **Fact-check badge** on viral posts (you have `FactCheckReport`, `factCheckController`) — huge for BD misinformation problem.
- "Why am I seeing this" transparency, community notes style.
- **Marketing hook:** "Kom গুজব (rumors), verified news."

> Pick **2–3 to lead with** (recommend A1 Help + A2 Data Saver + A3 bKash money). Don't market all six — focus wins.

---

## PART B — Problems & gaps found

### B1. **CRITICAL: Massive Admin↔User parity gaps**
The admin backend is enormous and mature, but many admin features manage data that **users have no way to create**. The admin side is "waiting for input that never comes."

| Admin CAN manage | User CAN create it? | Status |
|---|---|---|
| Support Tickets (`SupportTicket`, full CRUD in admin) | ❌ No user route/UI | **BROKEN LOOP** |
| Contact Messages (`ContactMessage`) | ❌ No "Contact us" form | **BROKEN LOOP** |
| User Feedback (`UserFeedback`) | ❌ No feedback UI | **BROKEN LOOP** |
| Account Recovery (`AccountRecovery`) | ❌ No user recovery request flow | **BROKEN LOOP** |
| Appeals (admin handles) | ✅ `/users/appeals` exists | OK (but no UI?) |
| Reports (admin handles) | ✅ `/reports` exists | OK |
| Verification requests | ⚠️ `requestVerification` exists in controller | Verify UI wired? |

**Impact:** Admin dashboards for Support/Contact/Feedback/Recovery will always be empty in production — dead features. Either build the user side or hide the admin side.

### B2. **Reverse gap: User features with no admin oversight**
Things users generate that admin may not be able to see/moderate. Verify each has an admin view:
- **Marketplace listings** — admin moderation exists ✅ (`/moderation/listings`).
- **Notes** (`Note`, `NotesPage`) — is there admin moderation? ❓ Check.
- **Polls** (`Poll`) — admin view? ❓
- **QA** (`QA`, `qaController`) — admin view? ❓
- **Highlights / Story archives** — admin/report path? ❓
- **Help requests** — admin moderation of abuse? ❓ (people could misuse "blood/help").

### B3. Feature completeness / dead-end checks
- **Appeals UI**: backend route exists (`/users/appeals`, `/users/my-appeals`) but is there a page for a banned/warned user to actually submit an appeal? If not, appeals are backend-only.
- **Verification request**: `requestVerification` controller exists — is there a "Apply for blue badge" button in user settings?
- **Notification preferences**: `NotificationPreference` model + route exist — is the settings UI complete?
- **2FA**: exists for admins (`/security/2fa/*`). Do **regular users** get 2FA? BD users increasingly want account security. Currently admin-only.

### B4. Consistency / correctness risks (from existing TODO.md — mostly done, verify)
- `TODO.md` Step 6 verification is **unchecked** — socket security (banned/suspended can't connect), liveComment parity, pagination `before` cursor. **Run these smoke tests before launch.**

### B5. Scale/quality concerns for a real launch
- **N+1 queries**: `getConversations` was fixed per TODO — audit other list endpoints (feed, notifications, groups) for the same pattern.
- **Indexes**: confirm indexes on hot query fields (Message.conversation+createdAt, Notification.user, Post feed queries).
- **Rate limiting**: socket events are rate-limited; confirm HTTP endpoints (login, signup, post-create, report) are too — abuse/spam vector for a public launch.
- **Media abuse**: file/video upload size checked client-side (25MB/100MB) — confirm **server-side** enforcement too (never trust client).

---

## PART C — Prioritized fix plan

Work top-to-bottom. Each item is scoped so one AI/session can do it independently.

### 🔴 Phase 1 — Close the broken loops (highest ROI, makes existing admin work real)
1. **Contact Us form** (user) → `POST /users/contact` + a simple `/contact` page or footer modal. Wire to existing `ContactMessage` admin inbox.
2. **Support Ticket creation** (user) → `POST /support/tickets` (user-scoped) + "Help & Support" page listing user's own tickets + reply thread. Admin side already exists.
3. **Feedback widget** (user) → small "Send feedback" button (e.g. in settings) → `POST` to `UserFeedback`. Admin side exists.
4. **Appeal UI** → when a user is banned/suspended/warned, show a screen with an "Appeal this decision" form hitting the existing `/users/appeals` route.
5. **Verification request UI** → "Apply for verification" in profile settings → wire to `requestVerification`.

> After Phase 1, every admin support/contact/feedback/appeal/verification dashboard becomes functional end-to-end.

### 🟠 Phase 2 — Reverse parity (moderation coverage)
6. Audit each user-generated content type (Notes, Polls, QA, Help requests, Highlights) and ensure there is: (a) a **report** path, and (b) an **admin moderation** view. Add whichever is missing.
7. Add **user 2FA** (reuse the admin 2FA controller/flow for regular users) — security differentiator for BD.

### 🟡 Phase 3 — Pre-launch hardening
8. Complete `TODO.md` Step 6 verification (socket security, liveComment parity, pagination). Check the boxes.
9. Server-side enforcement audit: upload size limits, HTTP rate limits on auth/post/report, N+1 sweep on list endpoints, DB indexes on hot paths.
10. Data privacy: confirm the `exportUserData` (currently admin-only) has a **user-facing "Download my data"** option (GDPR-style; good for international expansion).

### 🟢 Phase 4 — Differentiator polish (the marketing-worthy stuff)
11. Elevate **Help/সাহায্য** to a top-level tab with BD categories (Blood, Flood, Lost&Found, Giveaway).
12. Make **Data Saver** a prominent onboarding toggle + "MB saved" counter.
13. Localize money: bKash/Nagad tip presets in Taka, playful micro-tips.
14. Bangla/English UI toggle + festival themes.

---

## How to use this doc
- Treat **Part B table (B1)** as a checklist — each ❌ is a concrete task.
- Do Phase 1 first: it's the cheapest work with the biggest "the app now feels complete" payoff.
- For marketing, commit to A1 + A2 + A3 as the three pillars.

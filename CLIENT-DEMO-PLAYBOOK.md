# Client Demo Playbook — cross-app patterns

A portable recipe for making any internal SaaS / B2B app safely demoable to
clients. Apply alongside your app's design system; this covers the *behavior*
that makes a demo work, not the visual language.

## 1. Demo mode flag, separate from dev-bypass

Don't reuse "dev mode" as "demo mode" — they have different needs.

| Flag | Purpose | Visible in client demos? |
|---|---|---|
| `*_DEV_BYPASS_AUTH` | Skip auth for local development | No |
| `*_DEMO_MODE` | Client-safe demo on top of bypass | Yes |

Demo mode **implies** bypass infra (so the "Try Demo" entry works) but
**suppresses** every internal-only chrome surface: user-switchers,
seed-user pickers, "dev mode is on" footers, impersonation dropdowns,
debug indicators.

Both flags must be hard-killed on production hostnames — never trust
env vars alone. Add a `PRODUCTION_HOSTS` allowlist that short-circuits
the helper before reading the env.

## 2. Try Demo entry points (one per demo locale)

The screenshot step signs in through a **Try Demo** button rather than real
credentials, so no real user data is captured. By default
`take-screenshots.py` expects two buttons on the signin page,
`Try Demo · India` and `Try Demo · US`, and clicks the one matching
`DEMO_LOCALE`. If your product demos a different set of locales (or only
one), change the labels and the allowed `DEMO_LOCALE` values in
`take-screenshots.py` to match; keep one button per locale.

Each button:
1. Calls a server endpoint that **idempotently** seeds the locale-specific
   demo company (re-clickable, doesn't wipe state)
2. Signs the visitor in as that demo's **admin** (not viewer — presenter
   must be able to demo every flow including admin-only)
3. Lands them on the dashboard with full read/write permissions
4. Sets a cookie / localStorage flag such as `demo_locale=US` so the app
   can branch on cosmetic differences (currency symbol, phone and date
   formats)

### What the demo data must contain (no empty states, see §3)

Each locale's seed bundle covers the same surfaces, with locale-correct
synthetic content: prices in the local currency, plausible local names,
cities and phone-number formats, local business hours and payment
references. Never use real customer or employee data.

### Implementation pattern (frontend-thin, backend-thick)

The frontend just hits one endpoint per locale; the backend owns the seed:

```ts
// auth/login/page.tsx (or equivalent)
async function tryDemo(locale: "IN" | "US") {
  const res = await fetch(`/api/demo/seed?locale=${locale}`, { method: "POST" });
  if (!res.ok) return alert("Demo seed failed — is DEMO_MODE on?");
  document.cookie = `demo_locale=${locale}; path=/`;
  window.location.href = "/dashboard";
}

// On the JSX:
<Button onClick={() => tryDemo("IN")}>Try Demo · India</Button>
<Button onClick={() => tryDemo("US")}>Try Demo · US</Button>
```

```ts
// api/demo/seed/route.ts
export async function POST(req: Request) {
  if (!process.env.DEMO_MODE) return new Response("Forbidden", { status: 403 });
  const locale = new URL(req.url).searchParams.get("locale") || "IN";
  const tenant = await seedDemoTenant({ locale });   // idempotent — find-or-create
  await signInAsAdmin(req, tenant.adminUserId);      // sets your session cookie
  return Response.json({ ok: true, tenantId: tenant.id });
}
```

### Pre-screenshot check (the pipeline enforces this)

Before `take-screenshots.py` runs, the `/new-video` skill verifies BOTH
buttons exist:

```bash
# Grep target product's source-repo for both buttons
grep -ril 'Try Demo · India\|tryDemo.*IN\|demo_locale=IN' source-repo/
grep -ril 'Try Demo · US\|tryDemo.*US\|demo_locale=US' source-repo/
```

If either grep returns no matches, the skill must STOP and offer to add
the buttons (or escalate to the user) before continuing.

## 3. No empty states

A demo with "No data yet" cards is dead on arrival. Every tab the client
could click must be populated. Audit your app's empty-state copy — wherever
you find one, the seed bundle is missing data.

Common gaps to fill in seed:
- Dashboard "pending actions" — needs items in approval queues
- Reviews / performance cycles — needs a launched cycle with submissions
- Reimbursements / expenses — needs claims in mixed states (draft,
  submitted, approved, processed)
- Birthdays / anniversaries — needs profile rows with DOBs (often a
  separate table from `users`)
- Holidays / calendar — needs a handful of upcoming entries
- Notifications / inbox — needs items for the admin's view

Seed data should use **mixed statuses** (pending + approved + processed)
so the demo can showcase state transitions, not just empty queues.

## 4. Auth flow must behave like production

The biggest demo leak: dev-bypass silently re-authenticating after logout.
A presenter clicks "Log out" expecting to return to signin, and the app
re-creates a default "Dev User" session — exposing the bypass.

Fix at two layers:
- **Proxy/middleware**: when demo mode is on, do **not** auto-bypass auth
  for normal pages. Only carve out endpoints the demo flow itself needs
  (the seed endpoint, the auth provider routes).
- **Session resolver**: when demo mode is on, do **not** fall back to a
  default dev user when there's no token. Return null so the page
  redirects to signin like in production.

Test: log in via Try Demo → Log out → must land on signin, not auto-relog.

## 5. Hide internal dev chrome

In demo mode, suppress every UI element that exists only for developers:
- Impersonation / user-switcher widgets in the sidebar or settings
- "Pre-filled with a seeded account" hint copy on signin
- Internal admin dashboards that aren't part of the product story
- Debug overlays, feature-flag toggles, role switchers
- Default seed-user lists exposed via signin or settings

Keep these on the same flag as the Try Demo button — flip one bit, the
whole demo persona changes.

## 6. Branding & contrast

When rebranding or theming, **screenshot the app on every primary
surface** (light card, dark sidebar, brand-color header, modal overlay).
A logo that shares a color with the sidebar disappears — but the issue
only shows up after you actually look at the surface.

Build a logo component that accepts an `inverted` (or `variant`) prop
and explicitly renders different fills for dark surfaces. Don't rely on
CSS filters — they look wrong on multi-color marks.

## 7. Idempotent + cleanable seed

The seed endpoint should:
- **Be idempotent within a locale/bundle**: reseeding returns the same
  admin ID, doesn't wipe the client's mid-demo edits.
- **Clean up FK-bound rows before deleting users**: every new seeded
  table (reviews, reimbursements, profiles, balances) needs explicit
  cleanup or the slow path's `DELETE FROM users` fails with FK errors.
- **Have a versioning signal**: bump the fast-path detection (e.g. check
  for the newest seeded artifact) so adding new seed surfaces auto-
  triggers a reseed on next click — bundles top themselves up.

## 8. Pre-demo checklist

Run before every client call:

```
□ Confirm DEMO_MODE=true; restart app to pick up env
□ Open /signin in incognito; verify only public buttons visible
□ Click Try Demo; verify lands on dashboard with seeded data
□ Walk every tab — none should say "No data" / "No cycles" / "Empty"
□ Verify logo contrasts on every screen (sidebar, modals, headers)
□ Verify Log out → /signin (no auto-relog)
□ Open DevTools console — zero red errors during the full walk
□ Disable any telemetry/analytics that clients shouldn't see firing
□ Check no real employee names/emails or compensation data exposed
```

## 9. What NOT to demo-ize

Avoid the temptation to fake-mock things. The seed must hit your real
database with real schemas, real permissions, real workflows. If a
feature genuinely doesn't work yet, hide it from the sidebar in demo
mode — don't show a broken screen.

If your app has destructive admin actions (delete user, drop data),
either guard them with a confirm modal that exists in production too,
or scope them to non-demo accounts.

## 10. Ship behind a flag, then sunset

Demo mode is a permanent feature, not a one-off prep step. Keep it
behind the env var forever, but make sure:
- CI runs at least one e2e test in demo mode
- The production-host hard-kill is unit-tested
- The flag's default in production is `false`

Document the flag in your `.env.example` and onboarding docs so a new
engineer can fire up a demo without ceremony.

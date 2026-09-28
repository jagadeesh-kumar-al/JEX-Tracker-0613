# SpendWise — Design

A personal spending tracker shipping on **web** (dashboard) and **mobile** (iOS/Android via Expo).
Visual direction follows the supplied reference: deep violet→indigo gradient headers, soft
lavender-grey canvas, floating white cards with large radii, bright multi-hue category icons.
Core job: see what you spent this month, log a transaction in seconds, understand where it went.

**Auth:** Google sign-in only, through Runable managed auth (Better Auth + `@runablehq/managed-auth`).
One screen offers "Sign up" and "Sign in" as tabs — both run the same Google flow; the tab only
frames the copy, and returning visitors land on "Sign in". Every table that holds user data
(`categories`, `transactions`, `settings`) carries a `user_id`, and every API procedure is an
`authed` procedure scoped to the session's user — no account can read or write another's rows.
New accounts are provisioned with a starter category set and their own blank settings row.

## Brand & Colors

One token set, consumed per platform. Web/desktop: CSS vars in `packages/web/src/web/styles.css`.
Mobile: `Colors.light`/`Colors.dark` in `packages/mobile/constants/theme.ts` via `useColors()`.

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| primary | #7C3AED | #A78BFA | Buttons, active tab, gradient end |
| primaryDeep | #5B21B6 | #7C3AED | Gradient start, headings on light |
| background | #F4F2FA | #0B0A12 | Page/screen canvas (lavender tinted) |
| card | #FFFFFF | #16141F | Cards, sheets, surfaces |
| foreground | #1A162B | #F6F4FF | Primary text |
| mutedForeground | #6E6A85 | #A09CB8 | Labels, secondary text |
| border | #E8E5F2 | #26233340 | Hairlines |
| destructive | #E0245E | #FF4D79 | Expense amounts, delete |
| success | #12B981 | #34D399 | Income amounts |

Category hues (icon tiles, chart series): violet #7C3AED, emerald #10B981, sky #0EA5E9,
amber #F59E0B, rose #F43F5E, indigo #6366F1, teal #14B8A6, orange #FB923C, pink #EC4899,
lime #84CC16, cyan #06B6D4, slate #64748B. Tile = 14% tint of the hue, icon = full hue.

Gradient: `linear-gradient(160deg, #5B21B6 0%, #7C3AED 55%, #A78BFA 100%)` — used only on the
header/hero band, never behind body text blocks.

## Typography

- **Display / numbers**: Sora (600/700), tabular figures, tight tracking. Amounts always Sora.
- **Body / UI**: Plus Jakarta Sans (400/500/600).
- Web loads both from Google Fonts in `index.html`; mobile via `useFonts` + `@expo-google-fonts/*`,
  exposed through `Fonts` in `constants/theme.ts`.

## Shape & Depth

Radii: cards 24px, tiles/chips 18px, inputs 14px, pills 999px. Shadow: `0 18px 40px -24px
rgba(43,20,92,.28)`. Hero band has a 32px bottom radius overlapping the cards below it.

## Pages & Screens

Web (`packages/web/src/web/`):
- **Overview** (`pages/index.tsx`) — gradient hero with monthly spend + income/balance, month
  switcher, budget ring, category breakdown donut, recent transactions, quick add.
- **Transactions** (`pages/transactions.tsx`) — filterable list (month, category, search), inline
  delete, add-transaction dialog.
- **Analytics** (`pages/analytics.tsx`) — 6-month trend bars, weekly/monthly toggle, per-category
  spend bars with share %, top merchants, averages.
- Sidebar nav on ≥lg, bottom tab bar below that. Shared shell in `components/shell.tsx`.

Mobile (`packages/mobile/app/`):
- **Home** (`(tabs)/index.tsx`) — gradient header, monthly spend card, category strip, recent list.
- **Analytics** (`(tabs)/analytics.tsx`) — period toggle, bar chart, donut, history.
- **Account** (`(tabs)/account.tsx`) — budget, category management, app info.
- **Add** (`add.tsx`) — amount keypad, category picker entry, note, date, save.
- **Select Category** (`categories.tsx`) — search + 4-col icon grid, "Add" tile creates one.

## Key User Flows

1. Open → Home shows this month's spend vs budget and the last transactions.
2. Tap `+` → type amount → pick category (grid, searchable) → optional note → Save → list and
   analytics update instantly (optimistic).
3. Analytics → switch Weekly/Monthly → see trend bars and category shares for the period.

## Architecture

- **DB** (`packages/web/src/api/database/schema.ts`): `categories` (name, icon, color, kind,
  monthlyBudget) and `transactions` (amount in **cents**, categoryId, note, kind, occurredAt).
- **API**: oRPC — `routes/categories.ts`, `routes/transactions.ts`, `routes/analytics.ts`.
  Analytics is computed server-side (month summary, category breakdown, daily/weekly series,
  6-month trend).
- **Clients**: typed oRPC + TanStack Query hooks in `queries/` (one file per feature) on both
  platforms; optimistic delete/add.
- **Charts**: hand-built SVG (bars, donut) — `lucide-react` icons on web, `@expo/vector-icons` +
  `react-native-svg` + `expo-linear-gradient` on mobile. No chart library.

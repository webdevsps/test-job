# Shamsy Demo — Master Plan

> **Scope:** Paid trial task only — the order entry screen. Not the full platform.
> **Stack:** Next.js App Router + TypeScript + Supabase + Tailwind CSS
> **Goal:** Build one screen where a sales adviser records an order, enforcing business rules server-side.

---

## What We Are NOT Building (Demo Scope)

- Payments, stock, PDF quotes, CRM, WhatsApp, Arabic interface
- Steps 2–12 of the full platform
- Polished design — plain and functional is fine

---

## Database Schema

### Tables

| Table | Columns | Notes |
|---|---|---|
| `settings` | `id`, `key`, `value` (integer) | Stores `minimum_rate` (default 8000 SDG/USD) |
| `products` | `id`, `name`, `price_usd_cents` (integer) | $515 → 51500. Read-only to advisers. |
| `customers` | `id`, `name`, `city` | 3 seeded dealers |
| `profiles` | `id` (FK auth.users), `role` (owner \| adviser) | Extends Supabase auth |
| `orders` | `id`, `customer_id`, `adviser_id`, `rate_sdg` (integer), `status` (draft \| confirmed), `created_at` | `rate_sdg` stored at creation — **never recalculated** |
| `order_lines` | `id`, `order_id`, `product_id`, `quantity`, `price_usd_cents` (snapshot), `discount_usd_cents`, `discount_status` (none \| sand \| red \| blocked), `owner_approved` (bool) | Price snapshot taken at order creation |

### Money Rules
- All USD stored as **integer cents**: $515 → `51500`
- SDG stored as **integer pounds**: no decimals
- Rate stored as **integer** SDG per USD
- **Never** floating-point. **Never** recalculate historical amounts from current rates.

### DB Constraints
- `orders.rate_sdg >= 8000` — DB-level check constraint
- `order_lines.discount_usd_cents >= 0`

### RLS Policies
- Advisers: INSERT + SELECT own orders/lines only
- Owners: full access to all orders, can set `owner_approved = true`
- `settings`: readable by all authenticated, writable by owner only

---

## Seed Data

### Products
| Name | Price | Cents |
|---|---|---|
| SPF 6000 ES Plus — 6 kW inverter | $515 | 51500 |
| SPE 12000 ES — 12 kW inverter | $975 | 97500 |
| Hope 5.0L-B1 — 5 kWh battery | $810 | 81000 |
| Hope 16.0LM-A1 — 16 kWh battery | $2,070 | 207000 |

### Customers
| Name | City |
|---|---|
| Ahmed Trading | Khartoum |
| Nile Solar | Omdurman |
| Dongola Power | Dongola |

### Users (Supabase Auth + profiles)
| Email | Password | Role |
|---|---|---|
| adviser@shamsy.demo | Demo1234! | adviser |
| owner@shamsy.demo | Demo1234! | owner |

### Seed Script (`scripts/seed.ts`)
Run once with: `npx tsx scripts/seed.ts`

Uses the **service role key** (from `.env.local`) to:
1. Create auth users (adviser + owner) via Supabase Admin API
2. Insert their roles into `profiles` table
3. Insert products
4. Insert customers
5. Insert settings (`minimum_rate = 8000`)

Safe to re-run — checks if data already exists before inserting (idempotent).

---

## Application Pages

```
app/
├── auth/
│   └── login/page.tsx          ← existing, keep as-is
├── orders/
│   ├── new/page.tsx            ← MAIN DEMO SCREEN: order creation
│   └── [id]/page.tsx           ← view saved order (proves immutability)
├── approvals/
│   └── page.tsx                ← owner sees pending blocked lines
├── settings/
│   └── page.tsx                ← owner only: update minimum_rate
└── page.tsx                    ← redirect: logged in → /orders/new, else /login
```

---

## Architecture & Code Principles

### Logic — No Hardcoding
- `minimum_rate` is **always read from the database** — never written as `8000` anywhere in code
- Discount thresholds (3%, 5%) are **always read from `settings`** — never hardcoded as `0.03` or `0.05`
- Product prices are **always fetched from DB** — never trusted from the client
- All business rule thresholds live in one place: the `settings` table. Changing a value in the DB changes behaviour everywhere.

### Helper Functions (`lib/helpers/`)
All pure business logic lives here — no UI, no DB calls, just functions:

| File | Functions |
|---|---|
| `lib/helpers/money.ts` | `centsToDisplay(cents)`, `displayToCents(str)`, `formatUSD(cents)`, `formatSDG(pounds)`, `calcLineValue(priceCents, qty)`, `calcSDG(usdCents, rate)` |
| `lib/helpers/discount.ts` | `calcDiscountPct(discountCents, lineValueCents)`, `getDiscountStatus(pct, thresholds)`, `isOrderSaveable(lines)` |
| `lib/helpers/order.ts` | `calcOrderTotal(lines)`, `calcOrderSDG(totalCents, rate)` |

These are plain TypeScript functions — easy to unit test, used by both the UI and server actions.

### Component Architecture — Small & Focused
No component does more than one job. Every page is assembled from small pieces:

```
components/
├── ui/                          ← shadcn/ui primitives (button, input, etc.)
├── layout/
│   ├── AppHeader.tsx            ← sticky header with user name/logout
│   ├── BottomBar.tsx            ← fixed bottom save bar on mobile
│   └── PageContainer.tsx        ← max-w-md, padding, scroll wrapper
├── order/
│   ├── CustomerSelect.tsx       ← dealer dropdown
│   ├── ExchangeRateInput.tsx    ← rate input with min enforcement + hint
│   ├── OrderLineCard.tsx        ← single product line (qty, discount, colors)
│   ├── OrderLineSummary.tsx     ← line value, discount %, line total
│   ├── AddProductButton.tsx     ← opens product picker
│   ├── OrderSummary.tsx         ← total USD + total SDG card
│   └── SaveOrderBar.tsx         ← bottom bar button with status message
├── approvals/
│   ├── PendingOrderCard.tsx     ← one blocked order in owner queue
│   └── ApproveLineButton.tsx    ← approve single blocked line
└── settings/
    └── MinRateForm.tsx          ← owner updates minimum_rate
```

### Reusable Patterns
- **`formatUSD` / `formatSDG`** used everywhere money is displayed — one place to change formatting
- **`getDiscountStatus`** takes thresholds as a parameter — not hardcoded — works for any future threshold values
- **`PageContainer`** wraps every page — consistent padding, max-width, mobile scroll behaviour
- **`AppHeader`** used on every authenticated page
- **Server actions** in `lib/actions/` — reusable from any page, never duplicated

### What Goes Where
| Layer | Responsibility |
|---|---|
| `lib/helpers/` | Pure business logic — no DB, no UI |
| `lib/actions/` | Server actions — DB calls + business rules |
| `components/` | UI only — no business logic, no direct DB calls |
| `app/` pages | Fetch data (server components) + compose components |

---

## UI Design Principles

- **Mobile-first** — designed for a phone screen first, looks and feels like a native mobile app
- **Tailwind CSS** — clean, modern, no clutter
- **Max width `max-w-md` centered** on desktop, full width on mobile
- **Large tap targets** — buttons and inputs min 44px height, easy to tap with a thumb
- **Clear labels** — every field, heading and button uses plain business language (no dev jargon)
- **Status colors are obvious** — sand/red/blocked must be immediately visible without reading text
- **Fixed bottom bar** on mobile for the Save button — always reachable without scrolling
- **shadcn/ui components** for inputs, dropdowns, cards — consistent and polished out of the box

### Color Scheme for Discount Status
| Status | Background | Border | Label |
|---|---|---|---|
| None | white | gray | — |
| Sand (≤ 3%) | amber-50 | amber-400 | "Small discount" |
| Red (3–5%) | red-50 | red-400 | "Large discount" |
| Blocked (> 5%) | red-100 | red-600 | "Awaiting approval" |

### Field & Button Naming
| Element | Label |
|---|---|
| Customer dropdown | "Select dealer" |
| Rate input | "Exchange rate (SDG per $1)" |
| Rate hint | "Minimum rate: 8,000 SDG" |
| Discount input | "Discount ($)" |
| Line total | "Line total" |
| Order total USD | "Order total" |
| Order total SDG | "Amount in Sudanese pounds" |
| Save button (ok) | "Save Order" |
| Save button (blocked) | "Approval required — cannot save" |
| Approve button (owner) | "Approve discount" |
| Minimum rate input (settings) | "Minimum exchange rate (SDG per $1)" |

---

## Order Creation Screen (`/orders/new`)

### Layout (mobile-first, phone screen)

```
┌─────────────────────────────┐
│ ← Shamsy        [Jane Doe▾] │  ← sticky header, avatar/name dropdown
├─────────────────────────────┤
│                             │
│  New Order                  │  ← page title
│                             │
│  Select dealer              │
│  [Ahmed Trading           ▼]│  ← large dropdown, full width
│                             │
│  Exchange rate (SDG per $1) │
│  [        8,200            ]│  ← number input, large font
│  Minimum rate: 8,000 SDG    │  ← hint in gray
│                             │
├─────────────────────────────┤
│  Order lines                │  ← section heading
│                             │
│  ┌─────────────────────────┐│
│  │ SPF 6000 ES Plus  ╳    ││  ← product name + remove button
│  │ $515 per unit           ││  ← unit price (read-only, gray)
│  │ Qty    Discount ($)     ││
│  │ [4]    [$40    ]        ││
│  │ Line value: $2,060      ││
│  │ Discount: 1.94%         ││
│  │ ──────────────────────  ││
│  │ Line total: $2,020 ✓   ││  ← amber left border = sand
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ Hope 5.0L-B1       ╳   ││
│  │ $810 per unit           ││
│  │ Qty    Discount ($)     ││
│  │ [2]    [$70    ]        ││
│  │ Line value: $1,620      ││
│  │ Discount: 4.32%         ││
│  │ ──────────────────────  ││
│  │ Line total: $1,550 ⚠   ││  ← red left border = red
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ Hope 16.0LM-A1     ╳   ││
│  │ $2,070 per unit         ││
│  │ Qty    Discount ($)     ││
│  │ [1]    [$150   ]        ││
│  │ Discount: 7.25%         ││
│  │ ⛔ Awaiting approval    ││  ← red-100 bg, red-600 border
│  └─────────────────────────┘│
│                             │
│  [+ Add product            ]│  ← full width outlined button
│                             │
├─────────────────────────────┤
│  Order total     $5,490     │  ← summary card
│  In SDG   45,018,000 SDG    │
└─────────────────────────────┘
┌─────────────────────────────┐
│  [⛔ Approval required    ] │  ← fixed bottom bar, full width
└─────────────────────────────┘
```

### Discount Color Logic

```
discount_pct = discount_usd_cents / (price_usd_cents × quantity) × 100

pct = 0%        → no color, no restriction
0% < pct ≤ 3%   → SAND   (amber)   — save allowed
3% < pct ≤ 5%   → RED    (red)     — save allowed
pct > 5%        → BLOCKED (red border) — save blocked until owner approves
```

### Exchange Rate Validation
- If adviser enters < 8,000 → snap back to 8,000 + show error
- Read minimum from `settings` table (not hard-coded)

---

## Server Actions (`lib/actions/orders.ts`)

### `saveDraftOrder(data)`
- Re-fetches product prices from DB (never trust client)
- Reads `minimum_rate` from `settings`
- Validates `rate_sdg >= minimum_rate`
- Recomputes discount_pct per line
- Sets `discount_status` per line
- If any line is blocked → saves as `draft` (allowed)
- Stores `rate_sdg` on the order (snapshot)
- Returns `{ orderId, blockedLines }`

### `approveOrderLine(lineId)`
- Server-side role check: must be `owner`
- Sets `owner_approved = true`
- If all lines approved → order status becomes `confirmed`

### `confirmOrder(orderId)`
- Checks no blocked+unapproved lines remain
- Sets `status = confirmed`

---

## Owner Settings Page (`/settings`)

- **Owner only** — adviser gets a 403 if they try to access this page (enforced server-side via RLS)
- Shows current `minimum_rate` value
- Owner can update it to a higher number (e.g. 8,000 → 8,500 as the pound falls)
- Change takes effect on all **new** orders from that point forward
- **Existing saved orders are not affected** — their rate is already frozen

---

## Owner Approval Flow

1. Adviser creates order with blocked line → saved as `draft`
2. Adviser sees: _"Line 3 blocked — pending owner approval"_
3. **Owner logs in** → `/approvals` shows all draft orders with blocked lines
4. Owner approves the line
5. **Adviser logs back in** → order shows approved → can now confirm/save

---

## Worked Example — Must Match Exactly

**Rate: 8,200 SDG/USD**

| Line | Qty × Price | Line Value | Discount | % | Color | Total |
|---|---|---|---|---|---|---|
| SPF 6000 ES Plus | 4 × $515 | $2,060 | $40 | 1.94% | sand | $2,020 |
| Hope 5.0L-B1 | 2 × $810 | $1,620 | $70 | 4.32% | red | $1,550 |
| Hope 16.0LM-A1 | 1 × $2,070 | $2,070 | $150 | 7.25% | blocked | $1,920 |

**Verification checks:**
- [ ] Without line 3: $3,570 × 8,200 = **29,274,000 SDG**
- [ ] After owner approves line 3: $5,490 × 8,200 = **45,018,000 SDG**
- [ ] Change `minimum_rate` to 9,000 → reopen order → still shows **8,200** and **45,018,000 SDG**
- [ ] Enter rate 7,900 → refused → snaps to **8,000**
- [ ] Attempt to bypass 5% block via direct API call → rejected by server

---

## Files to Create / Modify

| File | Action | Purpose |
|---|---|---|
| `plan/MASTER_PLAN.md` | ✅ Created | This file |
| `supabase/migrations/001_init.sql` | Create | Schema + RLS policies |
| `scripts/seed.ts` | Create | Seeds everything: users, products, customers, settings |
| `lib/supabase/types.ts` | Create | TypeScript DB types |
| `lib/actions/orders.ts` | Create | Server actions |
| `app/orders/new/page.tsx` | Create | Order creation screen |
| `app/orders/[id]/page.tsx` | Create | View saved order |
| `app/approvals/page.tsx` | Create | Owner approvals queue |
| `app/settings/page.tsx` | Create | Owner updates minimum_rate |
| `app/page.tsx` | Modify | Redirect logic |

---

## Build Order

- [ ] 1. Database schema (`supabase/migrations/001_init.sql`)
- [ ] 2. TypeScript types (`lib/supabase/types.ts`)
- [ ] 3. Seed script (`scripts/seed.ts`) — run once to set up all data
- [ ] 4. Server actions (`lib/actions/orders.ts`)
- [ ] 5. Order creation screen (`app/orders/new/page.tsx`)
- [ ] 6. Saved order view (`app/orders/[id]/page.tsx`)
- [ ] 7. Owner approvals page (`app/approvals/page.tsx`)
- [ ] 8. Owner settings page (`app/settings/page.tsx`) — update minimum_rate
- [ ] 9. Root redirect (`app/page.tsx`)
- [ ] 9. End-to-end test against worked example

---

## Decisions

| Topic | Decision |
|---|---|
| Supabase | Use existing project from `.env.local` |
| Owner approval | Two separate logins (adviser + owner) |
| Hosting | User deploys to Vercel after build |
| Money | Integer cents for USD, integer pounds for SDG |
| Rate immutability | Stored on order at creation, DB check constraint ≥ 8,000 |

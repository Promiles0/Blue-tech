# Blue-tech

## Introduction

Blue-tech is a full-stack e-commerce platform pairing a React + Tailwind CSS frontend with a
Supabase backend (Postgres, Auth, Storage, and Edge Functions). It handles the full retail
lifecycle — product discovery, cart and checkout, coupons, payments, and admin operations
(orders, shipments, users, reviews) — without a separately hosted API server.

## System Architecture

* `Frontend/` — the React app (Vite). All UI, routing, and client-side state.
* `supabase/functions/api/` — a single Deno Edge Function that serves the REST API
  (`/auth`, `/products`, `/cart`, `/orders`, `/payments`, `/admin/*`, etc.).
* `supabase/migrations/` — versioned SQL migrations applied with `supabase db push`.
* `supabase/complete_schema.sql` / `reset_schema.sql` — the declarative schema, kept in sync
  with the migrations.

### Frontend structure

* `src/pages/` — route-level views, including the `admin/` dashboard pages.
* `src/components/` — reusable UI components.
* `src/api/` / `src/services/` — HTTP clients for the Supabase Edge Function API.
* `src/context/`, `src/hooks/`, `src/lib/` — app state, custom hooks, and shared utilities.

### Backend structure (Supabase)

* Auth — Supabase Auth (email/password and Google sign-in), with a lightweight app-issued
  JWT layered on top for Google users.
* Data — Postgres tables for users, products, orders, coupons, reviews, shipments, and more
  (see `supabase/complete_schema.sql`).
* API — the Edge Function in `supabase/functions/api/index.ts` implements every route,
  including admin-only endpoints gated by a role check against `public.users`/`public.profiles`.
* Rate limiting — Upstash Redis (optional; fails open if not configured).

## Tech Stack

Frontend: React, Vite, Tailwind CSS
Backend: Supabase (Postgres, Auth, Storage, Edge Functions on Deno)

## Key Features

1. Atomic checkout: stock reductions and coupon redemption use compare-and-swap updates to
   stay correct under concurrent requests.
2. Coupons: percent/fixed discounts with usage limits, min subtotal, and validity windows.
3. Admin console: dashboard stats, analytics, order/shipment management, user role and
   suspension controls, and review moderation.
4. Notifications: in-app notifications for order status changes and payment outcomes.

## Security & Integrity

1. Stateless Auth: requests are validated via Supabase session tokens or an app-issued JWT.
2. CORS: the Edge Function enforces an explicit allowed-origins list.
3. Data Privacy: API responses are shaped by explicit result-mapping functions, never raw
   database rows, so sensitive columns never reach the client.

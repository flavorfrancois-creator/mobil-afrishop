# Afrishop — Product Requirements Document

## Original Problem Statement
"With information of 'shop Platform 755', create their mobile app and give me the link for test. Only customers can log-in in this mobile app. The name of the mobile app is Afrishop. The address of the website is Africashop.win"

## Overview
Afrishop is the **customer-only** mobile companion app for the live African multi-boutique
marketplace **AfriMarket** (africashop.win). It connects to the real backend, so products,
shops, promotions, orders and wallet are live data.

## Architecture
- **Frontend:** Expo (React Native) + expo-router, react-query, trilingual i18n (FR default / EN / ES),
  Plus Jakarta Sans fonts, warm African-inspired theme (light + dark), Phosphor icons.
- **Backend:** FastAPI acting as a thin **reverse-proxy**. Any `/api/afm/{path}` is forwarded to
  `https://africashop.win/api/{path}` (method, query, Authorization header and body preserved).
  This avoids CORS on web and keeps the app same-origin. No local DB models are used.
- **Auth:** Upstream JWT via `/api/mobile/auth/login` and `/api/mobile/auth/register`.
  App enforces customer-only: logins whose `user.role !== "CLIENT"` are rejected.
  Token stored in secure storage.

## User Personas
- **Customer/Shopper** — browses boutiques, searches products, adds to cart, places live orders,
  tracks orders, views loyalty wallet balances, switches language.

## Core Requirements (static)
1. Customer-only login/registration.
2. Browse products, categories, shops, search.
3. Product detail with promotions (strike-through original + promo price).
4. Cart + fully live checkout (writes real orders upstream).
5. My orders + loyalty wallet + profile.
6. Trilingual UI (FR/EN/ES), multi-currency (CFA/XOF, GHS, XAF).

## Implemented (2026-06)
- [x] FastAPI reverse-proxy to africashop.win (`/api/afm/*`).
- [x] Auth store (customer-only enforcement) + secure token persistence.
- [x] Login/Register screen with hero + keyboard handling.
- [x] Bottom tabs: Home, Categories, Cart, Account (NativeTabs on iOS 26+, classic elsewhere).
- [x] Home: sticky header, hero, horizontal category chips, promotions, featured shops, product grid, pull-to-refresh.
- [x] Categories tab (grid + shops list) and Products listing with live search filter.
- [x] Product detail with gallery, promo badge, stock, sticky Add to cart.
- [x] Shop detail with shop products.
- [x] Cart with qty steppers, per-currency subtotals, persistence.
- [x] Live checkout + success screen (real orders), cart clears, caches invalidated.
- [x] My Orders (status, tracking, totals).
- [x] Wallet (available/pending balances, buckets, transactions).
- [x] Account: profile, wallet summary, language switcher, logout.
- [x] Toasts for feedback, light/dark theme, Plus Jakarta Sans fonts.
- [x] Backend + frontend E2E tested (iteration_1.json) — all pass, live orders verified.

## Backlog
- P1: Order detail screen with full line items and delivery status timeline.
- P1: Product reviews / ratings display.
- P2: Favourites / wishlist.
- P2: Address book for delivery.
- P2: In-app order tracking map.

## Test Credentials
See `/app/memory/test_credentials.md` — customer2@afrimarket.demo / Test@2026.

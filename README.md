# Allo Health – Real‑Time Distributed Inventory & Reservation System

## Table of Contents
1. [Project Synopsis](#project-synopsis)  
2. [Key Features](#key-features)  
3. [Tech Stack & Architecture](#tech-stack--architecture)  
4. [Getting Started (Local Development)](#getting-started-local-development)  
5. [Environment Configuration](#environment-configuration)  
6. [API Reference](#api-reference)  
7. [Design & UI Highlights](#design--ui-highlights)  
8. [Testing & Validation](#testing--validation)  
9. [Deployment Considerations](#deployment-considerations)  
10. [Future Improvements](#future-improvements)

---

## Project Synopsis
**Allo Health** is a Next.js 16 application that showcases a **distributed inventory management** system with **stock reservation** capabilities. Users can browse products, view per‑warehouse inventory, reserve units, and complete a checkout flow that locks stock for a limited period. Expired reservations automatically release inventory, guaranteeing consistency across multiple warehouses.

The app integrates **Supabase PostgreSQL** via **Prisma ORM**, using a **transaction‑pooler** (`DATABASE_URL`) for runtime queries and a **direct connection** (`DIRECT_URL`) for migrations.

---

## Key Features
- **Live inventory view**: Real‑time stock counts per warehouse.  
- **Reservation workflow**: Create, confirm, and release reservations with atomic updates.  
- **Automatic expiration**: Background cleanup of stale reservations; inventory is restored.  
- **Responsive, premium UI**: Gradient backgrounds, glass‑like cards, micro‑animations, and a polished dark‑mode‑friendly design.  
- **Robust API layer**: Type‑safe request handling via `zod`, concise error handling, and proper HTTP status codes.  
- **Optimistic UI & progressive enhancement**: Loading spinners, graceful error messaging, and disabled states for actions.

---

## Tech Stack & Architecture
| Layer | Technology |
|------|------------|
| **Frontend** | Next.js 16 (App Router), React 18, TypeScript, Vanilla CSS (no Tailwind) |
| **Styling** | Custom CSS with modern design tokens (gradient backgrounds, glassmorphism, subtle hover effects) |
| **Database** | Supabase PostgreSQL (transaction pooler on port 6543, direct connection on 5432) |
| **ORM** | Prisma (`@prisma/client`) with singleton `prisma` instance (`src/app/lib/prisma.ts`) |
| **Validation** | `zod` for request payload validation |
| **State Management** | React Context + component‑level hooks (`useState`, `useEffect`) |
| **Deployment** | Vercel (or any Node‑compatible host) – requires environment variables `DATABASE_URL` and `DIRECT_URL` |

**Folder Overview**
```
src/
├─ app/
│  ├─ api/
│  │  ├─ products/route.ts            # GET all products + stock
│  │  ├─ reservations/
│  │  │   ├─ route.ts                 # POST new reservation
│  │  │   ├─ [id]/confirm/route.ts    # POST confirm reservation
│  │  │   ├─ [id]/release/route.ts    # POST release reservation
│  │  │   └─ [id]/route.ts            # GET single reservation
│  │  └─ warehouses/route.ts          # GET list of warehouses
│  ├─ checkout/[id]/page.tsx          # Checkout UI with countdown
│  └─ page.tsx                        # Home page – product catalog & cleanup logic
├─ components/
│  ├─ Countdown.tsx                   # Countdown timer with auto‑expire callback
│  └─ ReserveButton.tsx               # Quantity selector + reserve action
├─ lib/
│  └─ prisma.ts                       # Prisma singleton (dev‑friendly)
└─ .env                               # Environment variables (see below)
```

---

## Getting Started (Local Development)
### Prerequisites
- **Node.js** ≥ 18 (LTS)  
- **npm** (comes with Node)  
- **Supabase account** with a PostgreSQL project  
- **Git** (for version control)

### Installation
```bash
# Clone the repository (if not already)
git clone https://github.com/shudhanshu002/Allo-health
cd allo-health

# Install dependencies
npm install

# Set up environment variables (see next section)
# Then start the dev server
npm run dev
```
The app will be reachable at `http://localhost:3000` (or another port if 3000 is busy).

---

## Environment Configuration
The `.env` file must contain **two connection strings**:
```dotenv
# Runtime connection – uses Supabase transaction pooler (port 6543)
DATABASE_URL="postgresql://postgres:<PASSWORD>@db.<PROJECT>.supabase.co:6543/postgres?sslmode=require&pgbouncer=true"

# Direct connection for Prisma migrations (port 5432)
DIRECT_URL="postgresql://postgres:<PASSWORD>@db.<PROJECT>.supabase.co:5432/postgres?sslmode=require"
```
> Replace `<PASSWORD>` and `<PROJECT>` with values from your Supabase dashboard.
> The `pgbouncer=true` flag ensures compatibility with serverless environments.

### Applying Prisma Migrations
```bash
npx prisma migrate dev --name init
```
This uses `DIRECT_URL` to run migrations without the pooler.

---

## API Reference
| Endpoint | Method | Description | Success Codes | Error Codes |
|---|---|---|---|---|
| `/api/products` | **GET** | List all products with per‑warehouse stock & availability. | `200` | `500` |
| `/api/warehouses` | **GET** | List all warehouses. | `200` | `500` |
| `/api/reservations` | **POST** | Reserve stock (`productId`, `warehouseId`, `quantity`). Returns reservation ID. | `201` | `409` (insufficient stock), `500` |
| `/api/reservations/:id` | **GET** | Retrieve reservation details. | `200` | `400`, `404`, `500` |
| `/api/reservations/:id/confirm` | **POST** | Confirm reservation → stock is permanently deducted. | `200` | `410` (expired), `400` (already processed), `500` |
| `/api/reservations/:id/release` | **POST** | Release reservation early (cancellation/failure). | `200` | `400` (already processed), `500` |
All responses are JSON‑encoded. Errors always include an `error` field with a human‑readable message.

---

## Design & UI Highlights
- **Gradient hero background** (`from-slate-50 via-white to-slate-100`).
- **Glass‑morphic product cards** with a thin top gradient strip.
- **Dynamic stock badges** (green for available, red for out‑of‑stock).
- **Animated “Reserve” button** with gradient hover, subtle scaling, and loading state.
- **Quantity selector** featuring increment/decrement buttons, numeric input, and clamping to stock limits.
- **Checkout page** with a polished loading skeleton, countdown timer, and graceful expiration handling.
- **Micro‑animations** (spin loader, fade‑in errors, button transitions) enhance perceived performance.

---

## Future Improvements
- **WebSocket / Server‑Sent Events** for real‑time stock updates across clients.
- **Authentication** (e.g., Clerk, NextAuth) to associate reservations with users.
- **Unit & integration test suite** (Jest + React Testing Library).
- **Dockerize** the application for consistent CI/CD pipelines.
- **CI workflow** that runs Prisma migrations automatically on deploy.

---

**Enjoy building and extending Allo Health!** If you need further assistance—whether it’s tweaking the UI, extending the API, or configuring deployment—just let me know.

# Luxe — Multi-Tenant Ecommerce Platform

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green?logo=postgresql)
![Stripe](https://img.shields.io/badge/Stripe-payments-635BFF?logo=stripe)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)

A full-stack, multi-tenant ecommerce SaaS platform with separate dashboards for buyers, sellers, and administrators — built with Next.js 16, PostgreSQL, Stripe, and Better Auth.

---

## Overview

Luxe is a production-ready ecommerce platform where multiple independent sellers can list and sell products through a single shared storefront. Each seller gets their own management dashboard with product listings, order tracking, analytics, a CRM, and a Kanban task board. Buyers browse the unified store, add items to their cart, and check out via Stripe.

The platform is organized around three user roles: **buyers** (shop, track orders, message sellers), **sellers** (manage products and customers, subscribe via Stripe), and **admins** (control the platform, manage users, run promotions, and send email campaigns). Every role has a dedicated dashboard with its own URL namespace and auth guard.

Key differentiators include admin-controlled flash sales with real-time countdowns, per-seller coupon codes, product variants, star ratings and written reviews, direct buyer-seller messaging, support ticket management, a bulk email center powered by Resend, and Stripe subscription billing for sellers.

---

## Features

### Public Store — `/store`

- Animated hero carousel with category sidebar
- Admin-controlled flash sales with live countdown timer
- Trending products and best sellers fetched live from the database
- Category grid linking to filtered product listings
- Product detail pages: image gallery, variant selector (size/color/etc.), coupon code input, stock indicator, wishlist button, add to cart
- Star ratings and written reviews (1–5 stars, one review per buyer per product)
- "You Might Also Like" recommendations from the same category
- Sign in / sign up: email + password or Google OAuth
- Newsletter signup and promotional banners

### Buyer Dashboard — `/buyer/[name]/dashboard`

- Shopping cart with quantity controls and variant support
- Stripe-powered checkout with address entry
- Order history with status tracking
- Saved wishlist
- Billing portal: saved payment methods, payment history, Stripe billing portal access
- Direct messaging with sellers
- Support helpline: submit and track support tickets

### Seller Dashboard — `/seller/[name]/dashboard`

- Product management: create/edit/delete products with multiple images, variants, pricing tiers, inventory levels, SEO metadata, and delivery estimates
- Order management: view incoming orders, update fulfillment status
- Sales analytics: revenue charts, order pipeline, top products
- Coupon codes: create percentage or fixed-amount discount codes
- CRM: manage customer contacts, track lead status and total spend
- Kanban board: custom columns and cards for task management
- Direct messaging with buyers
- Stripe subscription billing at $40/month
- Payment methods and billing history

### Admin Dashboard — `/luxe/[name]/dashboard`

- Platform-wide stats: total sellers, buyers, orders, revenue, active subscriptions
- User management: view all buyers and sellers, subscription status, order counts
- Cross-seller order monitoring with status filtering
- Flash sales management: create/edit/toggle promotions by category or all products
- Support ticket management: view all tickets, reply as admin, update status
- Email center: compose individual emails, run bulk campaigns, use templates, view send history and delivery stats
- CRM overview and platform analytics
- Platform settings and billing overview

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.1, React 19 |
| Language | TypeScript 5 |
| Database | PostgreSQL (Neon serverless) |
| ORM | Drizzle ORM 0.45.1 |
| Authentication | Better Auth 1.5.6 + Google OAuth 2.0 |
| Payments | Stripe (subscriptions + Checkout + billing portal) |
| Email | Resend |
| UI | Tailwind CSS v4, shadcn/ui, Radix UI |
| Icons | Lucide React |
| Animations | Framer Motion |
| Data Tables | TanStack React Table v8 |
| Carousel | Embla Carousel React |
| Linting | ESLint 9 |

---

## Project Structure

```
src/
├── app/
│   ├── (public)/store/          # Storefront, auth, product pages
│   ├── (buyer-dashboard)/       # /buyer/[name]/dashboard/*
│   ├── (seller-dashboard)/      # /seller/[name]/dashboard/*
│   ├── (admin)/                 # /luxe/[name]/dashboard/*
│   └── api/
│       ├── auth/[...all]/       # Better Auth handler
│       ├── store/               # Public: products, reviews, flash-sale, coupon
│       ├── buyer/               # Cart, checkout, orders, wishlist
│       ├── seller/              # Products, orders, analytics, CRM, coupons, kanban
│       ├── admin/               # Stats, users, orders, sales, email, communications
│       ├── messages/            # Buyer-seller conversations
│       ├── stripe/              # Webhooks, billing portal, payment methods
│       └── user/set-role/       # Role assignment
├── components/
│   ├── store/                   # HeroSection, ProductCard, ProductReviews, FlashSale, ...
│   ├── admin/                   # AdminSidebar, email sub-components
│   ├── buyer/                   # BuyerSidebar
│   ├── seller/                  # SellerSidebar
│   └── ui/                      # shadcn/ui primitives
└── lib/
    ├── schema.ts                 # Drizzle ORM schema (all 25 tables)
    ├── db.ts                     # Neon database client
    ├── auth.ts                   # Better Auth server config
    ├── auth-client.ts            # Better Auth client hooks
    ├── admin-auth.ts             # requireAdmin() server helper
    ├── stripe.ts                 # Stripe client
    ├── email.ts                  # sendEmail(), sendBulkEmails() via Resend
    ├── email-templates.ts        # Pre-built HTML email templates
    └── utils.ts                  # slugify(), cn(), helpers
```

---

## Database Schema

All tables are defined in `src/lib/schema.ts` and managed by Drizzle ORM.

| Category | Tables |
|---|---|
| Auth (Better Auth) | `user`, `session`, `account`, `verification` |
| Products | `product`, `product_variant`, `product_review` |
| Orders | `order` |
| Buyer Features | `cart_item`, `wishlist_item` |
| Coupons & Sales | `coupon`, `platform_sale` |
| Messaging | `conversation`, `message` |
| Seller Tools | `crm_contact`, `kanban_board`, `kanban_column`, `kanban_card`, `seller_subscription` |
| Admin | `support_ticket`, `email_log` |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A PostgreSQL database ([Neon](https://neon.tech) recommended — free tier available)
- A [Stripe](https://stripe.com) account
- A [Google Cloud Console](https://console.cloud.google.com) project with OAuth 2.0 credentials
- A [Resend](https://resend.com) account (free tier: 3,000 emails/month)

### Installation

```bash
git clone https://github.com/your-username/multi-tenant-ecommerce-plateform.git
cd multi-tenant-ecommerce-plateform
npm install
```

### Environment Variables

Create a `.env.local` file at the project root:

```env
# Database
DATABASE_URL="postgresql://..."           # Neon connection string

# Better Auth
BETTER_AUTH_SECRET="your-random-secret"  # Generate: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"   # App base URL

# Google OAuth (console.cloud.google.com → Credentials → OAuth 2.0 Client)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Admin
ADMIN_EMAIL="your@email.com"             # Only this email can access the admin dashboard

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Resend (resend.com → API Keys)
RESEND_API_KEY="re_..."
RESEND_FROM_ADDRESS="onboarding@resend.dev"  # Use your verified domain in production
```

### Database Setup

Push the schema to your database:

```bash
npx drizzle-kit push --force
```

### Seed the First Admin

After creating an account through the store, promote your user to admin via SQL:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your@email.com';
```

The `/api/user/set-role` endpoint intentionally blocks setting the admin role for security — only a direct database update can grant admin access.

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000/store](http://localhost:3000/store) to see the storefront.

---

## URL Reference

| Area | URL |
|---|---|
| Storefront | `/store` |
| Authentication | `/store/auth` |
| Product Listing | `/store/products` |
| Product Detail | `/store/products/[productId]` |
| Buyer Dashboard | `/buyer/[name]/dashboard` |
| Seller Dashboard | `/seller/[name]/dashboard` |
| Admin Dashboard | `/luxe/[name]/dashboard` |

The `[name]` segment is the slugified version of the signed-in user's display name (e.g. "John Doe" → `john-doe`).

---

## API Endpoints

### Public Store

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/store/products` | List active products (filter: category, search, sort, page) |
| GET | `/api/store/products/[id]` | Product detail, variants, seller, recommendations |
| GET | `/api/store/products/[id]/reviews` | Reviews and rating stats |
| POST | `/api/store/products/[id]/reviews` | Submit a review (authenticated) |
| GET | `/api/store/flash-sale` | Active flash sale and discounted products |
| POST | `/api/store/coupon/validate` | Validate a coupon code against a product |

### Buyer

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/buyer/cart` | View or update cart |
| POST | `/api/buyer/checkout` | Create Stripe checkout session |
| GET | `/api/buyer/orders` | Order history |
| GET/POST | `/api/buyer/wishlist` | View or toggle wishlist item |

### Seller

| Method | Endpoint | Description |
|---|---|---|
| GET/POST/PATCH/DELETE | `/api/seller/products` | Product CRUD |
| GET/PATCH | `/api/seller/orders` | Orders list and status update |
| GET | `/api/seller/analytics` | Revenue and order analytics |
| GET/POST/PATCH/DELETE | `/api/seller/coupons` | Coupon management |
| GET/POST/PATCH/DELETE | `/api/seller/customers` | CRM contacts |
| GET/POST/PATCH/DELETE | `/api/seller/kanban` | Kanban boards, columns, and cards |
| POST | `/api/seller/upload` | Upload product images |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/verify` | Verify admin session (used by layout auth guard) |
| GET | `/api/admin/stats` | Platform-wide statistics |
| GET | `/api/admin/users/sellers` | All sellers with enriched subscription and order data |
| GET | `/api/admin/users/buyers` | All buyers with order counts |
| GET | `/api/admin/orders` | All platform orders (optional status filter) |
| GET/POST/PATCH/DELETE | `/api/admin/sales` | Flash sale management |
| GET/POST/PATCH | `/api/admin/communications` | Support tickets |
| POST | `/api/admin/email` | Send individual email |
| POST | `/api/admin/email/bulk` | Send bulk email campaign |
| GET | `/api/admin/email/stats` | Email send history and delivery stats |

### Stripe

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/stripe/seller-subscription` | Create or manage seller subscription |
| POST | `/api/stripe/seller-webhook` | Stripe webhook handler |
| POST | `/api/stripe/billing-portal` | Create billing portal session |
| GET | `/api/stripe/payment-methods` | List saved payment methods |
| GET | `/api/stripe/payment-history` | Stripe payment history |
| POST | `/api/stripe/setup-intent` | Create setup intent for saving a card |

---

## Scripts

```bash
npm run dev                      # Start development server (http://localhost:3000)
npm run build                    # Build for production
npm run start                    # Start production server
npm run lint                     # Run ESLint

npx drizzle-kit push --force     # Push schema changes to the database
npx drizzle-kit generate         # Generate SQL migration files
npx drizzle-kit studio           # Open Drizzle Studio (database browser)
```

---

## Authentication

Better Auth handles all authentication with two sign-in methods:

- **Email + Password** — standard registration and login
- **Google OAuth** — one-click sign in via Google account

On first sign-up, all users receive the `buyer` role. Users can request a role change to `seller` through the UI, which calls `/api/user/set-role`. The admin role can only be granted via a direct database update (see [Seed the First Admin](#seed-the-first-admin)).

The admin dashboard layout makes an additional server-side call to `/api/admin/verify`, which checks both `role === "admin"` and that the user's email matches `ADMIN_EMAIL`. This double-check ensures that even if a role is manually set in the database, only the designated email address can access admin features.

---

## Stripe Setup

### Seller Subscriptions

Sellers subscribe at $40/month. Create a recurring price in your Stripe dashboard and reference the price ID in the seller billing flow. The webhook at `/api/stripe/seller-webhook` handles subscription lifecycle events.

### Buyer Checkout

Buyers pay per order through Stripe Checkout. After a successful payment, the order is created and the buyer is redirected to their order history.

### Webhooks

Register the following webhook endpoint in your Stripe dashboard:

```
https://your-domain.com/api/stripe/seller-webhook
```

Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.

---

## Email

Transactional email is sent via [Resend](https://resend.com). The `sendEmail()` and `sendBulkEmails()` functions in `src/lib/email.ts` handle individual and bulk sends. All outgoing emails are logged to the `email_log` table for audit purposes.

Pre-built email templates are available in `src/lib/email-templates.ts` and can be previewed and used directly from the admin Email Center.

For production, add and verify your sending domain in the Resend dashboard and update `RESEND_FROM_ADDRESS` to your verified domain address.

---

## License

MIT

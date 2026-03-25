# Multi-Tenant Ecommerce + CRM + Kanban SaaS – Full Planning

## 1. Tech Stack (STRICT)

* Next.js (App Router)
* TypeScript
* TailwindCSS
* shadcn/ui
* Neon DB (PostgreSQL Serverless)
* Drizzle ORM
* Better Auth (with Drizzle Adapter)
* Stripe

---

## 2. High-Level Architecture

### Multi-Tenant Strategy

* Shared database (Neon DB PostgreSQL)
* All tables include `tenantId` column
* Middleware enforces tenant isolation
* Better Auth Organization plugin for tenant/org management

### App Segments

```
/app
  /(admin)
  /(seller)
  /(buyer)
  /api
```

---

## 3. Roles & Permissions (RBAC via Better Auth)

### Better Auth Plugins Used

* `admin()` — App-level role management (role field on user table)
* `organization()` — Multi-tenant org management (org, member, invitation tables)
* `createAccessControl()` — Custom permission statements & role definitions

### Roles

* **Super Admin** (Platform) — `role: "superAdmin"` via admin plugin
* **Tenant Admin** (Seller/Owner) — `role: "owner"` via organization plugin
* **Staff** — `role: "admin"` or `role: "member"` via organization plugin
* **Buyer** — `role: "user"` (default role via admin plugin)

### Permission Statements (Access Control)

```typescript
import { createAccessControl } from "better-auth/plugins/access"

const statement = {
  orders: ["view", "manage", "export"],
  products: ["manage"],
  kanban: ["view", "update"],
  crm: ["manage"],
} as const

const ac = createAccessControl(statement)

// Role definitions
const superAdminRole = ac.newRole({
  orders: ["view", "manage", "export"],
  products: ["manage"],
  kanban: ["view", "update"],
  crm: ["manage"],
})

const tenantAdminRole = ac.newRole({
  orders: ["view", "manage", "export"],
  products: ["manage"],
  kanban: ["view", "update"],
  crm: ["manage"],
})

const staffRole = ac.newRole({
  orders: ["view", "manage"],
  kanban: ["view", "update"],
})

const buyerRole = ac.newRole({
  orders: ["view"],
})
```

### Authorization Logic

* Server-side: `auth.api.userHasPermission({ body: { userId, permissions } })`
* Client-side: `authClient.admin.hasPermission({ permissions })`
* Synchronous check: `authClient.admin.checkRolePermission({ permissions, role })`
* UI-level guards for visibility
* Middleware enforces tenant isolation via `activeOrganizationId` in session

---

## 4. Core Modules

### 4.1 E-commerce

* Products
* Categories
* Inventory
* Orders
* Payments (Stripe)
* Reviews

### 4.2 CRM

* Customers
* Leads
* Deals
* Notes
* Activity timeline

### 4.3 Kanban

* Boards
* Columns
* Cards
* Drag & Drop (dnd-kit)
* Linked entities (orders, deals)

### 4.4 Reporting System

* CSV Export
* PDF Export
* Report types:

  * Orders
  * Customers
  * Revenue
  * CRM deals

---

## 5. Dashboard Features

### Admin Panel (Platform Owner)

* Manage tenants
* View platform analytics
* Manage subscriptions (Stripe)
* Export reports (global)

### Seller Dashboard

* Product management
* Order management
* CRM
* Kanban boards
* Team management (RBAC)
* Export reports (tenant-scoped)

### Staff Dashboard

* Limited access based on permissions
* Kanban usage (if allowed)
* Order handling

### Buyer Dashboard

* Browse products
* Place orders
* View order history
* Download invoice PDF

---

## 6. Database Design (Neon DB PostgreSQL + Drizzle ORM)

Schema file: `src/lib/schema.ts`

### Better Auth Tables (auto-generated via `npx auth@latest generate`)

```typescript
// user — extended by admin plugin with role, banned, banReason, banExpires
// session — extended by organization plugin with activeOrganizationId
// account — OAuth & credential accounts
// verification — email verification tokens
```

### Organization Plugin Tables (auto-generated)

```typescript
// organization — id, name, slug, logo, metadata, createdAt
// member — id, userId, organizationId, role, createdAt
// invitation — id, email, inviterId, organizationId, role, status, expiresAt
```

### Application Tables (Drizzle ORM)

#### Tenants

```typescript
export const tenant = pgTable("tenant", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  plan: varchar("plan", { length: 50 }).default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
```

#### Categories

```typescript
export const category = pgTable("category", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenant.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
```

#### Products

```typescript
export const product = pgTable("product", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenant.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  stock: integer("stock").notNull().default(0),
  categoryId: text("category_id").references(() => category.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
```

#### Orders

```typescript
export const order = pgTable("order", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenant.id),
  userId: text("user_id").notNull(),
  total: integer("total").notNull(), // in cents
  status: varchar("status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const orderItem = pgTable("order_item", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => order.id),
  productId: text("product_id").notNull().references(() => product.id),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), // in cents at time of purchase
})
```

#### Reviews

```typescript
export const review = pgTable("review", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenant.id),
  productId: text("product_id").notNull().references(() => product.id),
  userId: text("user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
```

#### CRM Tables

```typescript
export const crmCustomer = pgTable("crm_customer", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenant.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const crmLead = pgTable("crm_lead", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenant.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  source: varchar("source", { length: 100 }),
  status: varchar("status", { length: 50 }).default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const crmDeal = pgTable("crm_deal", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenant.id),
  customerId: text("customer_id").references(() => crmCustomer.id),
  title: varchar("title", { length: 255 }).notNull(),
  value: integer("value"), // in cents
  stage: varchar("stage", { length: 50 }).default("lead"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const crmNote = pgTable("crm_note", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenant.id),
  dealId: text("deal_id").references(() => crmDeal.id),
  customerId: text("customer_id").references(() => crmCustomer.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
```

#### Kanban Tables

```typescript
export const kanbanBoard = pgTable("kanban_board", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenant.id),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const kanbanColumn = pgTable("kanban_column", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenant.id),
  boardId: text("board_id").notNull().references(() => kanbanBoard.id),
  name: varchar("name", { length: 255 }).notNull(),
  order: integer("order").notNull(),
})

export const kanbanCard = pgTable("kanban_card", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenant.id),
  boardId: text("board_id").notNull().references(() => kanbanBoard.id),
  columnId: text("column_id").notNull().references(() => kanbanColumn.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  linkedType: varchar("linked_type", { length: 50 }), // "order" | "deal"
  linkedId: text("linked_id"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
```

### Migration Workflow

```bash
npx auth@latest generate   # Generate Better Auth schema into src/lib/schema.ts
npx drizzle-kit generate   # Generate SQL migration files
npx drizzle-kit migrate    # Apply migrations to Neon DB
```

---

## 7. Authentication Setup (Better Auth + Drizzle + Neon DB)

### Dependencies

```
better-auth
@better-auth/drizzle-adapter
@neondatabase/serverless
drizzle-orm
drizzle-kit
```

### Environment Variables

```
DATABASE_URL=postgresql://...@neon.tech/...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Server Setup (`src/lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, organization } from "better-auth/plugins"
import { createAccessControl } from "better-auth/plugins/access"
import { db } from "./db"

// Define permission statements
const statement = {
  orders: ["view", "manage", "export"],
  products: ["manage"],
  kanban: ["view", "update"],
  crm: ["manage"],
} as const

const ac = createAccessControl(statement)

// Define roles
const superAdminRole = ac.newRole({
  orders: ["view", "manage", "export"],
  products: ["manage"],
  kanban: ["view", "update"],
  crm: ["manage"],
})

const tenantAdminRole = ac.newRole({
  orders: ["view", "manage", "export"],
  products: ["manage"],
  kanban: ["view", "update"],
  crm: ["manage"],
})

const staffRole = ac.newRole({
  orders: ["view", "manage"],
  kanban: ["view", "update"],
})

const buyerRole = ac.newRole({
  orders: ["view"],
})

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    admin({
      ac,
      roles: {
        superAdmin: superAdminRole,
        admin: tenantAdminRole,
        staff: staffRole,
        user: buyerRole,
      },
      defaultRole: "user",
      adminRoles: ["superAdmin"],
    }),
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      membershipLimit: 100,
    }),
  ],
})
```

### Database Setup (`src/lib/db.ts`)

```typescript
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)
```

### Client Setup (`src/lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react"
import { adminClient, organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [adminClient(), organizationClient()],
})

export const { signIn, signUp, useSession, signOut } = authClient
```

### API Route (`src/app/api/auth/[...all]/route.ts`)

```typescript
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

### Schema Generation & Migration

```bash
npx auth@latest generate   # Generates Better Auth tables into src/lib/schema.ts
npx drizzle-kit generate   # Generates SQL migration files in ./drizzle/
npx drizzle-kit migrate    # Applies migrations to Neon DB
```

### Drizzle Config (`drizzle.config.ts`)

```typescript
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

---

## 8. API Design

### REST Endpoints

#### Auth

* /api/auth/* (Better Auth)

#### Products

* GET /api/products
* POST /api/products

#### Orders

* GET /api/orders
* POST /api/orders

#### CRM

* GET /api/crm/deals

#### Kanban

* GET /api/kanban/boards
* POST /api/kanban/cards

#### Reports

* GET /api/reports/export?type=orders&format=csv

---

## 9. Report Export System

### Flow

1. Request report
2. Validate permissions
3. Fetch tenant-scoped data
4. Generate file
5. Return download

### Libraries

* CSV: json2csv
* PDF: pdfkit / react-pdf

---

## 10. UI System

* Component-driven (shadcn)
* Tailwind utility styling
* Reusable components:

  * DataTable
  * Forms (react-hook-form + zod)
  * Modals
  * Kanban board UI

---

## 11. Payment System (Stripe)

### Features

* Tenant subscriptions
* Webhooks for billing events

---

## 12. Security

* Tenant isolation via `tenantId` column on all tables (Drizzle ORM + PostgreSQL)
* RBAC enforcement via Better Auth `admin()` + `organization()` plugins
* Permission checks: `auth.api.userHasPermission()` server-side
* Session-based active organization for tenant scoping
* API validation (zod)
* Secure Stripe webhooks

---

## 13. Development Roadmap

### Phase 1

* Better Auth + Drizzle ORM + Neon DB setup
* RBAC (admin + organization plugins + access control)
* Multi-tenancy (organization plugin + tenantId on all tables)
* Drizzle schema + migrations
* Basic dashboards

### Phase 2

* E-commerce core
* Stripe integration

### Phase 3

* CRM system

### Phase 4

* Kanban system

### Phase 5

* Reports (CSV + PDF)

### Phase 6

* UI polish + performance

---

## 14. Future Enhancements

* Redis caching
* Background jobs (BullMQ)
* Notifications system
* Stripe Connect (marketplace)

---

## 15. Key Principles

* Always include `tenantId`
* Server-side authorization first
* Avoid over-engineering
* Build MVP fast, iterate later

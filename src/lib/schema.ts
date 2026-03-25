import {
  boolean,
  pgTable,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

// ─── Better Auth Core Tables ────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("buyer"),
  stripeCustomerId: text("stripe_customer_id"),
  // Required by Better Auth admin plugin
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── Seller Tables ───────────────────────────────────────────────────────────

export const product = pgTable("product", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId: text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  // Basic info
  name: text("name").notNull(),
  description: text("description"),
  brand: text("brand"),
  sku: text("sku"),
  tags: text("tags"), // JSON string[]
  // Media
  images: text("images"), // JSON string[] of URLs
  image: text("image"), // legacy compat — first image
  // Pricing
  price: integer("price").notNull(),
  salePrice: integer("sale_price"),
  saleStartDate: timestamp("sale_start_date"),
  saleEndDate: timestamp("sale_end_date"),
  costPrice: integer("cost_price"),
  // Inventory
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  // Category
  category: text("category"),
  subcategory: text("subcategory"),
  // Status
  status: text("status").notNull().default("draft"),
  publishDate: timestamp("publish_date"),
  // Shipping
  weight: text("weight"),
  dimensions: text("dimensions"), // JSON {l,w,h,unit}
  shippingClass: text("shipping_class"),
  deliveryEstimate: text("delivery_estimate"),
  // SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  slug: text("slug"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const order = pgTable("order", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId: text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  buyerId: text("buyer_id").references(() => user.id, { onDelete: "set null" }),
  productId: text("product_id").references(() => product.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull().default(1),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  shippingAddress: text("shipping_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const crmContact = pgTable("crm_contact", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId: text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  status: text("status").notNull().default("lead"),
  notes: text("notes"),
  totalSpent: integer("total_spent").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const kanbanBoard = pgTable("kanban_board", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId: text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const kanbanColumn = pgTable("kanban_column", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  boardId: text("board_id").notNull().references(() => kanbanBoard.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  color: text("color").default("#6366f1"),
});

export const kanbanCard = pgTable("kanban_card", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  columnId: text("column_id").notNull().references(() => kanbanColumn.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"),
  dueDate: timestamp("due_date"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sellerSubscription = pgTable("seller_subscription", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId: text("seller_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  status: text("status").notNull().default("inactive"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Messaging ────────────────────────────────────────────────────────────────

export const conversation = pgTable("conversation", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  buyerId: text("buyer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sellerId: text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  subject: text("subject"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const message = pgTable("message", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  status: text("status").notNull().default("sent"), // sent | seen
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Product Variants ─────────────────────────────────────────────────────────

export const productVariant = pgTable("product_variant", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  options: text("options").notNull(), // JSON: {Size:"M", Color:"Red"}
  sku: text("sku"),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(0),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Seller Coupons ───────────────────────────────────────────────────────────

export const coupon = pgTable("coupon", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId: text("seller_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  discountType: text("discount_type").notNull().default("percentage"), // percentage | fixed
  discountValue: integer("discount_value").notNull(), // percent (0-100) or cents
  expiryDate: timestamp("expiry_date"),
  minOrderValue: integer("min_order_value").default(0), // cents
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Buyer Cart & Wishlist ────────────────────────────────────────────────────

export const cartItem = pgTable("cart_item", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  variantId: text("variant_id"), // optional, no FK to allow variant deletion
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const wishlistItem = pgTable("wishlist_item", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Admin / Platform Sales ────────────────────────────────────────────────

export const platformSale = pgTable("platform_sale", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  discountType: text("discount_type").notNull().default("percentage"), // percentage | fixed
  discountValue: integer("discount_value").notNull(), // percent (0-100) or cents
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  targetType: text("target_type").notNull().default("all"), // all | category
  targetCategory: text("target_category"), // only when targetType = "category"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Product Reviews ──────────────────────────────────────────────────────────

export const productReview = pgTable("product_review", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1–5
  title: text("title"),
  body: text("body"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Admin / Email Log ───────────────────────────────────────────────────────

export const emailLog = pgTable("email_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  subject: text("subject").notNull(),
  body: text("body"),
  templateUsed: text("template_used"),
  status: text("status").notNull().default("sent"),
  recipientType: text("recipient_type").notNull().default("individual"),
  recipientCount: integer("recipient_count").default(1),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

// ─── Admin / Support Tickets ───────────────────────────────────────────────

export const supportTicket = pgTable("support_ticket", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  userRole: text("user_role").notNull().default("buyer"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // open | in-progress | resolved
  adminReply: text("admin_reply"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

const money = (name: string) =>
  numeric(name, { precision: 10, scale: 3, mode: "number" });

export type AddonSnapshot = {
  id: number;
  nameAr: string;
  nameEn: string;
  price: number;
  pricingType: string;
};

// ---------- Staff (admins + kitchen) ----------
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // owner | admin | kitchen
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  isProtected: boolean("is_protected").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Customers ----------
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  weight: text("weight").notNull().default(""),
  height: text("height").notNull().default(""),
  unwanted: text("unwanted").notNull().default(""),
  allergy: text("allergy").notNull().default(""),
  house: text("house").notNull().default(""),
  flat: text("flat").notNull().default(""),
  road: text("road").notNull().default(""),
  block: text("block").notNull().default(""),
  regionId: integer("region_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Catalog ----------
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descAr: text("desc_ar").notNull().default(""),
  descEn: text("desc_en").notNull().default(""),
  protein: integer("protein").notNull().default(0),
  carbs: integer("carbs").notNull().default(0),
  image: text("image").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const packageOptions = pgTable("package_options", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").notNull(),
  labelAr: text("label_ar").notNull(),
  labelEn: text("label_en").notNull(),
  mealsPerDay: integer("meals_per_day").notNull().default(1),
  price5: money("price_5").notNull().default(0), // price for 5 days
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const addons = pgTable("addons", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  price: money("price").notNull().default(0),
  pricingType: text("pricing_type").notNull().default("per_day"), // per_day | once
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const deliverySlots = pgTable("delivery_slots", {
  id: serial("id").primaryKey(),
  groupAr: text("group_ar").notNull().default(""),
  groupEn: text("group_en").notNull().default(""),
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  fee: money("fee").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percent"), // percent | fixed
  value: money("value").notNull().default(0),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  usageCount: integer("usage_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const popups = pgTable("popups", {
  id: serial("id").primaryKey(),
  titleAr: text("title_ar").notNull().default(""),
  titleEn: text("title_en").notNull().default(""),
  bodyAr: text("body_ar").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  image: text("image").notNull().default(""),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  active: boolean("active").notNull().default(true),
});

export const carouselImages = pgTable("carousel_images", {
  id: serial("id").primaryKey(),
  image: text("image").notNull(),
  captionAr: text("caption_ar").notNull().default(""),
  captionEn: text("caption_en").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // benefitpay | card | cash
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  mime: text("mime").notNull(),
  data: text("data").notNull(), // base64
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Subscriptions / payments / orders ----------
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").notNull(),
    packageId: integer("package_id").notNull(),
    optionId: integer("option_id").notNull(),
    packageAr: text("package_ar").notNull(),
    packageEn: text("package_en").notNull(),
    optionAr: text("option_ar").notNull(),
    optionEn: text("option_en").notNull(),
    protein: integer("protein").notNull().default(0),
    carbs: integer("carbs").notNull().default(0),
    mealsPerDay: integer("meals_per_day").notNull().default(1),
    days: integer("days").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    regionId: integer("region_id").notNull(),
    regionAr: text("region_ar").notNull(),
    regionEn: text("region_en").notNull(),
    house: text("house").notNull().default(""),
    flat: text("flat").notNull().default(""),
    road: text("road").notNull().default(""),
    block: text("block").notNull().default(""),
    slotId: integer("slot_id").notNull(),
    slotGroupAr: text("slot_group_ar").notNull().default(""),
    slotGroupEn: text("slot_group_en").notNull().default(""),
    slotStart: text("slot_start").notNull(),
    slotEnd: text("slot_end").notNull(),
    addons: jsonb("addons").$type<AddonSnapshot[]>().notNull().default([]),
    unwanted: text("unwanted").notNull().default(""),
    allergy: text("allergy").notNull().default(""),
    weight: text("weight").notNull().default(""),
    height: text("height").notNull().default(""),
    subtotal: money("subtotal").notNull().default(0),
    discount: money("discount").notNull().default(0),
    discountCode: text("discount_code").notNull().default(""),
    deliveryFee: money("delivery_fee").notNull().default(0),
    total: money("total").notNull().default(0),
    paymentMethod: text("payment_method").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("subs_customer_idx").on(t.customerId)],
);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  subscriptionId: integer("subscription_id").notNull(),
  method: text("method").notNull(),
  amount: money("amount").notNull().default(0),
  status: text("status").notNull().default("paid"), // paid | cod
  reference: text("reference").notNull().default(""),
  cardLast4: text("card_last4").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    subscriptionId: integer("subscription_id").notNull(),
    customerId: integer("customer_id").notNull(),
    deliveryDate: date("delivery_date", { mode: "string" }).notNull(),
    dayNumber: integer("day_number").notNull().default(1),
    status: text("status").notNull().default("not_ready"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_date_idx").on(t.deliveryDate)],
);
// ---------- Custom Meal Options ----------
export const customMealOptions = pgTable("custom_meal_options", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // protein | carb | grams | days | packaging
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  price: money("price").notNull().default(0), // السعر أو التكلفة الإضافية إن وجدت
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});
export const proteinPrices = pgTable("protein_prices", {
  id: serial("id").primaryKey(),
  weightKey: text("weight_key").notNull().unique(),
  labelAr: text("label_ar").notNull(),
  labelEn: text("label_en").notNull(),
  price: money("price").notNull().default(0),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
});
// ---------- Unwanted Food Options Catalog ----------
export const unwantedOptions = pgTable("unwanted_options", {
  id: serial("id").primaryKey(),
  nameKey: text("name_key").notNull().unique(), // مثلاً: chicken, meat, shrimp...
  labelAr: text("label_ar").notNull(),
  labelEn: text("label_en").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
});

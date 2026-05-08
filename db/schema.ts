import {
  boolean,
  check,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { CATEGORY_VALUES } from "@/lib/categories";

export const categoryEnum = pgEnum("category", CATEGORY_VALUES);
export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "live",
  "rejected",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const places = pgTable("places", {
  id: uuid("id").primaryKey().defaultRandom(),
  googlePlaceId: text("google_place_id").notNull().unique(),
  name: text("name").notNull(),
  category: categoryEnum("category").notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  address: text("address"),
  photoUrl: text("photo_url"),
  status: submissionStatusEnum("status").notNull().default("pending"),
  submittedBy: uuid("submitted_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: uuid("place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  specialToYou: text("special_to_you").notNull(),
  energy: text("energy").notNull(),
  whatToDo: text("what_to_do").notNull(),
  status: submissionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export const affirmations = pgTable(
  "affirmations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id),
    anonCookieId: text("anon_cookie_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("affirmations_place_user_unique")
      .on(t.placeId, t.userId)
      .where(sql`${t.userId} is not null`),
    uniqueIndex("affirmations_place_anon_unique")
      .on(t.placeId, t.anonCookieId)
      .where(sql`${t.anonCookieId} is not null`),
    check(
      "affirmations_one_identity",
      sql`(${t.userId} is null) <> (${t.anonCookieId} is null)`,
    ),
  ],
);

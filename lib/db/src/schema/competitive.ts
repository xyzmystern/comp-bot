import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const competitivePlayersTable = pgTable("competitive_players", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  // Registration fields (null = not registered yet)
  ign: text("ign"),
  country: text("country"),
  region: text("region"),
  platform: text("platform"),
  gameId: text("game_id"),
  // PR (competitive points)
  pr: integer("pr").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompetitivePlayerSchema = createInsertSchema(competitivePlayersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompetitivePlayer = z.infer<typeof insertCompetitivePlayerSchema>;
export type CompetitivePlayer = typeof competitivePlayersTable.$inferSelect;

export const prHistoryTable = pgTable("pr_history", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  delta: integer("delta").notNull(),
  reason: text("reason"),
  moderatorId: text("moderator_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPrHistorySchema = createInsertSchema(prHistoryTable).omit({ id: true, createdAt: true });
export type InsertPrHistory = z.infer<typeof insertPrHistorySchema>;
export type PrHistory = typeof prHistoryTable.$inferSelect;

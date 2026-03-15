import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const linkedWalletsTable = pgTable("linked_wallets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  label: text("label").notNull(),
  encryptedApiKey: text("encrypted_api_key"),
  encryptedSecretKey: text("encrypted_secret_key"),
  maskedKey: text("masked_key"),
  status: text("status").notNull().default("connected"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLinkedWalletSchema = createInsertSchema(linkedWalletsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertLinkedWallet = z.infer<typeof insertLinkedWalletSchema>;
export type LinkedWallet = typeof linkedWalletsTable.$inferSelect;

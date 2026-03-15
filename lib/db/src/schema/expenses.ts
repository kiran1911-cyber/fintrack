import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExpenseSchema = createInsertSchema(expensesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;

export const expenseCategoriesTable = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const chatHistoryTable = pgTable("chat_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const investmentProfilesTable = pgTable("investment_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  monthlyIncome: numeric("monthly_income", { precision: 12, scale: 2 }),
  monthlySavings: numeric("monthly_savings", { precision: 12, scale: 2 }),
  riskTolerance: text("risk_tolerance"),
  investmentGoal: text("investment_goal"),
  age: integer("age"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

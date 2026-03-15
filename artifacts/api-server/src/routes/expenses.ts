import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { expensesTable } from "@workspace/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/expenses", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { month, year, category } = req.query;

  try {
    let conditions = [eq(expensesTable.userId, userId)];

    if (month && year) {
      const m = parseInt(month as string);
      const y = parseInt(year as string);
      const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const endDate =
        m === 12
          ? `${y + 1}-01-01`
          : `${y}-${String(m + 1).padStart(2, "0")}-01`;
      conditions.push(
        sql`${expensesTable.date} >= ${startDate} AND ${expensesTable.date} < ${endDate}`,
      );
    }

    if (category && category !== "all") {
      conditions.push(eq(expensesTable.category, category as string));
    }

    const expenses = await db
      .select()
      .from(expensesTable)
      .where(and(...conditions))
      .orderBy(desc(expensesTable.date));

    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    res.json({
      expenses: expenses.map((e) => ({
        ...e,
        amount: parseFloat(e.amount),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      total,
      count: expenses.length,
    });
  } catch (err) {
    console.error("Error listing expenses:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/expenses", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { title, amount, category, date, notes } = req.body;

  if (!title || amount === undefined || !category || !date) {
    res.status(400).json({ error: "title, amount, category, date are required" });
    return;
  }

  try {
    const [expense] = await db
      .insert(expensesTable)
      .values({
        userId,
        title,
        amount: String(amount),
        category,
        date,
        notes: notes || null,
      })
      .returning();

    res.status(201).json({
      expense: {
        ...expense,
        amount: parseFloat(expense.amount),
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Error creating expense:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/expenses/summary/monthly", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const now = new Date();
  const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));
  const year = parseInt((req.query.year as string) || String(now.getFullYear()));

  try {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStart = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
    const prevEnd = startDate;

    const [expenses, prevExpenses] = await Promise.all([
      db
        .select()
        .from(expensesTable)
        .where(
          and(
            eq(expensesTable.userId, userId),
            sql`${expensesTable.date} >= ${startDate} AND ${expensesTable.date} < ${endDate}`,
          ),
        ),
      db
        .select()
        .from(expensesTable)
        .where(
          and(
            eq(expensesTable.userId, userId),
            sql`${expensesTable.date} >= ${prevStart} AND ${expensesTable.date} < ${prevEnd}`,
          ),
        ),
    ]);

    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const previousMonthTotal = prevExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const catMap: Record<string, { total: number; count: number }> = {};
    expenses.forEach((e) => {
      const cat = e.category;
      if (!catMap[cat]) catMap[cat] = { total: 0, count: 0 };
      catMap[cat].total += parseFloat(e.amount);
      catMap[cat].count++;
    });

    const categoryBreakdown = Object.entries(catMap).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0,
    }));

    const dailyMap: Record<string, number> = {};
    expenses.forEach((e) => {
      const d = e.date;
      dailyMap[d] = (dailyMap[d] || 0) + parseFloat(e.amount);
    });

    const dailyTotals = Object.entries(dailyMap)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      month,
      year,
      totalSpent,
      categoryBreakdown,
      dailyTotals,
      expenseCount: expenses.length,
      previousMonthTotal,
    });
  } catch (err) {
    console.error("Error getting monthly summary:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/expenses/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const id = parseInt(req.params.id);

  try {
    const [expense] = await db
      .select()
      .from(expensesTable)
      .where(and(eq(expensesTable.id, id), eq(expensesTable.userId, userId)));

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    res.json({
      expense: {
        ...expense,
        amount: parseFloat(expense.amount),
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Error getting expense:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/expenses/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const id = parseInt(req.params.id);
  const { title, amount, category, date, notes } = req.body;

  try {
    const [existing] = await db
      .select()
      .from(expensesTable)
      .where(and(eq(expensesTable.id, id), eq(expensesTable.userId, userId)));

    if (!existing) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const updateData: Partial<typeof expensesTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = String(amount);
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = date;
    if (notes !== undefined) updateData.notes = notes;

    const [updated] = await db
      .update(expensesTable)
      .set(updateData)
      .where(eq(expensesTable.id, id))
      .returning();

    res.json({
      expense: {
        ...updated,
        amount: parseFloat(updated.amount),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Error updating expense:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/expenses/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const id = parseInt(req.params.id);

  try {
    const [existing] = await db
      .select()
      .from(expensesTable)
      .where(and(eq(expensesTable.id, id), eq(expensesTable.userId, userId)));

    if (!existing) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    await db.delete(expensesTable).where(eq(expensesTable.id, id));

    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

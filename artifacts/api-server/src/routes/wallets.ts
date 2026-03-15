import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { linkedWalletsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function maskKey(key: string): string {
  if (!key || key.length < 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}

function generateGrowwPortfolio() {
  const holdings = [
    { symbol: "RELIANCE", name: "Reliance Industries Ltd", quantity: 12, avgPrice: 2450, currentPrice: 2680, type: "Stock" },
    { symbol: "HDFC-NIFTY50", name: "HDFC Nifty 50 Index Fund", quantity: 250, avgPrice: 180, currentPrice: 195, type: "Mutual Fund" },
    { symbol: "TCS", name: "Tata Consultancy Services", quantity: 8, avgPrice: 3500, currentPrice: 3820, type: "Stock" },
    { symbol: "MIRAE-ELSS", name: "Mirae Asset Tax Saver Fund", quantity: 500, avgPrice: 28, currentPrice: 32, type: "ELSS" },
    { symbol: "INFY", name: "Infosys Ltd", quantity: 20, avgPrice: 1450, currentPrice: 1580, type: "Stock" },
    { symbol: "SBI-BLUECHIP", name: "SBI Blue Chip Fund", quantity: 180, avgPrice: 65, currentPrice: 71, type: "Mutual Fund" },
  ];

  return holdings.map((h) => {
    const currentValue = h.quantity * h.currentPrice;
    const invested = h.quantity * h.avgPrice;
    const gainLoss = currentValue - invested;
    const gainLossPercent = (gainLoss / invested) * 100;
    return {
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      currentPrice: h.currentPrice,
      currentValue,
      gainLoss,
      gainLossPercent,
      type: h.type,
    };
  });
}

function generateBinancePortfolio() {
  const holdings = [
    { symbol: "BTC", name: "Bitcoin", quantity: 0.0125, avgPrice: 3800000, currentPrice: 4250000, type: "Crypto" },
    { symbol: "ETH", name: "Ethereum", quantity: 0.85, avgPrice: 180000, currentPrice: 225000, type: "Crypto" },
    { symbol: "BNB", name: "Binance Coin", quantity: 2.5, avgPrice: 22000, currentPrice: 26500, type: "Crypto" },
    { symbol: "SOL", name: "Solana", quantity: 8, avgPrice: 8500, currentPrice: 12000, type: "Crypto" },
    { symbol: "USDT", name: "Tether USD", quantity: 15000, avgPrice: 83, currentPrice: 83, type: "Stablecoin" },
  ];

  return holdings.map((h) => {
    const currentValue = h.quantity * h.currentPrice;
    const invested = h.quantity * h.avgPrice;
    const gainLoss = currentValue - invested;
    const gainLossPercent = (gainLoss / invested) * 100;
    return {
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      currentPrice: h.currentPrice,
      currentValue,
      gainLoss,
      gainLossPercent,
      type: h.type,
    };
  });
}

router.get("/wallets", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const wallets = await db
      .select()
      .from(linkedWalletsTable)
      .where(eq(linkedWalletsTable.userId, req.user.id));

    res.json({
      wallets: wallets.map((w) => ({
        id: w.id,
        userId: w.userId,
        provider: w.provider,
        label: w.label,
        maskedKey: w.maskedKey,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Error fetching wallets:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/wallets/link", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { provider, label, apiKey, secretKey } = req.body;

  if (!provider || !label) {
    res.status(400).json({ error: "provider and label are required" });
    return;
  }

  const validProviders = ["groww", "binance"];
  if (!validProviders.includes(provider.toLowerCase())) {
    res.status(400).json({ error: "Invalid provider. Supported: groww, binance" });
    return;
  }

  try {
    const maskedKey = apiKey ? maskKey(apiKey) : null;

    const [wallet] = await db
      .insert(linkedWalletsTable)
      .values({
        userId: req.user.id,
        provider: provider.toLowerCase(),
        label,
        encryptedApiKey: apiKey || null,
        encryptedSecretKey: secretKey || null,
        maskedKey,
        status: "connected",
      })
      .returning();

    res.json({
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        provider: wallet.provider,
        label: wallet.label,
        maskedKey: wallet.maskedKey,
        status: wallet.status,
        createdAt: wallet.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Error linking wallet:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/wallets/:id/unlink", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id);

  try {
    const [existing] = await db
      .select()
      .from(linkedWalletsTable)
      .where(and(eq(linkedWalletsTable.id, id), eq(linkedWalletsTable.userId, req.user.id)));

    if (!existing) {
      res.status(404).json({ error: "Wallet not found" });
      return;
    }

    await db.delete(linkedWalletsTable).where(eq(linkedWalletsTable.id, id));

    res.json({ success: true, message: "Wallet unlinked successfully" });
  } catch (err) {
    console.error("Error unlinking wallet:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/wallets/:id/portfolio", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id);

  try {
    const [wallet] = await db
      .select()
      .from(linkedWalletsTable)
      .where(and(eq(linkedWalletsTable.id, id), eq(linkedWalletsTable.userId, req.user.id)));

    if (!wallet) {
      res.status(404).json({ error: "Wallet not found" });
      return;
    }

    const holdings =
      wallet.provider === "binance"
        ? generateBinancePortfolio()
        : generateGrowwPortfolio();

    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalInvested = holdings.reduce((sum, h) => sum + h.quantity * (h.currentPrice - h.gainLoss / h.quantity), 0);
    const totalGainLoss = totalValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    res.json({
      provider: wallet.provider,
      totalValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercent,
      holdings,
      lastUpdated: new Date().toISOString(),
      isSimulated: true,
    });
  } catch (err) {
    console.error("Error fetching portfolio:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

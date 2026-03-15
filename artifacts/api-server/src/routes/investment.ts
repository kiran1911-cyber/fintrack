import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { investmentProfilesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function getInvestmentRecommendations(
  monthlyIncome: number,
  monthlySavings: number,
  riskTolerance: string = "moderate",
  investmentGoal: string = "wealth",
  age: number = 30,
) {
  const savingsRate = (monthlySavings / monthlyIncome) * 100;
  const investable = monthlySavings * 0.8;
  const emergencyFundMonths = 6;
  const emergencyFundNeeded = monthlyIncome * emergencyFundMonths;

  let allocations: Array<{
    category: string;
    percentage: number;
    description: string;
    riskLevel: string;
  }> = [];

  const isYoung = age < 35;
  const isRetirement = investmentGoal === "retirement";
  const isConservative = riskTolerance === "conservative";
  const isAggressive = riskTolerance === "aggressive";

  if (isConservative) {
    allocations = [
      {
        category: "Fixed Deposits / PPF",
        percentage: 40,
        description: "Safe government-backed savings with 7-8% annual returns",
        riskLevel: "Low",
      },
      {
        category: "Debt Mutual Funds",
        percentage: 25,
        description: "Short-term debt funds for stable 6-7% returns",
        riskLevel: "Low",
      },
      {
        category: "Large Cap Mutual Funds",
        percentage: 20,
        description: "Blue-chip equity funds for moderate 10-12% long-term returns",
        riskLevel: "Medium",
      },
      {
        category: "Gold ETF",
        percentage: 10,
        description: "Hedge against inflation with digital gold investment",
        riskLevel: "Low",
      },
      {
        category: "Emergency Fund",
        percentage: 5,
        description: "Keep liquid for unexpected expenses",
        riskLevel: "None",
      },
    ];
  } else if (isAggressive) {
    allocations = [
      {
        category: "Small Cap Mutual Funds",
        percentage: 30,
        description: "High-growth small cap funds targeting 15-20% returns",
        riskLevel: "High",
      },
      {
        category: "Mid Cap Mutual Funds",
        percentage: 25,
        description: "Mid-cap growth funds with 13-18% potential returns",
        riskLevel: "High",
      },
      {
        category: "Large Cap / Index Funds",
        percentage: 20,
        description: "Nifty/Sensex index funds for broad market exposure",
        riskLevel: "Medium",
      },
      {
        category: "International Funds",
        percentage: 15,
        description: "Global diversification via US/International equity funds",
        riskLevel: "High",
      },
      {
        category: "Direct Equity / Stocks",
        percentage: 10,
        description: "Selected stocks for potential high returns",
        riskLevel: "Very High",
      },
    ];
  } else {
    if (isYoung) {
      allocations = [
        {
          category: "Large Cap / Index Funds",
          percentage: 30,
          description: "Nifty 50 / Sensex index funds — low cost, 12% avg returns",
          riskLevel: "Medium",
        },
        {
          category: "Mid Cap Mutual Funds",
          percentage: 25,
          description: "Growth-oriented mid-cap funds for 13-16% potential",
          riskLevel: "Medium-High",
        },
        {
          category: "PPF / NPS",
          percentage: 20,
          description: "Tax-saving retirement corpus — lock-in with 7.1% returns",
          riskLevel: "Low",
        },
        {
          category: "ELSS Tax-Saving Funds",
          percentage: 15,
          description: "Equity-linked savings with 80C tax benefits",
          riskLevel: "Medium",
        },
        {
          category: "Gold ETF",
          percentage: 10,
          description: "Inflation hedge — target 5-8% of portfolio in gold",
          riskLevel: "Low",
        },
      ];
    } else {
      allocations = [
        {
          category: "Large Cap / Index Funds",
          percentage: 35,
          description: "Stable blue-chip equity for long-term wealth creation",
          riskLevel: "Medium",
        },
        {
          category: "Debt Funds / FD",
          percentage: 25,
          description: "Capital preservation with 6-8% steady returns",
          riskLevel: "Low",
        },
        {
          category: "PPF / NPS",
          percentage: 20,
          description: "Retirement planning with tax advantages",
          riskLevel: "Low",
        },
        {
          category: "Mid Cap Mutual Funds",
          percentage: 15,
          description: "Growth allocation for higher returns",
          riskLevel: "Medium-High",
        },
        {
          category: "Gold / REITs",
          percentage: 5,
          description: "Diversification through gold and real estate",
          riskLevel: "Low-Medium",
        },
      ];
    }
  }

  const recommendations = allocations.map((a) => ({
    ...a,
    amount: (investable * a.percentage) / 100,
  }));

  let summary = "";
  if (savingsRate < 10) {
    summary = `Your savings rate is ${savingsRate.toFixed(1)}% — try to reach at least 20%. Focus on reducing discretionary spending first.`;
  } else if (savingsRate < 20) {
    summary = `Good start with ${savingsRate.toFixed(1)}% savings rate. Aim for 20-30% to build meaningful wealth over time.`;
  } else if (savingsRate < 30) {
    summary = `Excellent ${savingsRate.toFixed(1)}% savings rate! You're on track. Diversify investments for better risk-adjusted returns.`;
  } else {
    summary = `Outstanding ${savingsRate.toFixed(1)}% savings rate! You're in the top tier. Consider tax optimization and estate planning.`;
  }

  const emergencyAdvice = `Maintain an emergency fund of ₹${new Intl.NumberFormat("en-IN").format(emergencyFundNeeded)} (6 months of income: ₹${new Intl.NumberFormat("en-IN").format(monthlyIncome)}/month) in a liquid savings account or liquid mutual fund before investing aggressively.`;

  return {
    totalInvestable: investable,
    recommendations,
    summary,
    emergencyFundAdvice: emergencyAdvice,
    savingsRate,
  };
}

router.post("/investment/advice", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const {
    monthlyIncome,
    monthlySavings,
    riskTolerance = "moderate",
    investmentGoal = "wealth",
    age = 30,
  } = req.body;

  if (!monthlyIncome || !monthlySavings) {
    res.status(400).json({ error: "monthlyIncome and monthlySavings are required" });
    return;
  }

  try {
    await db
      .insert(investmentProfilesTable)
      .values({
        userId: req.user.id,
        monthlyIncome: String(monthlyIncome),
        monthlySavings: String(monthlySavings),
        riskTolerance,
        investmentGoal,
        age,
      })
      .onConflictDoUpdate({
        target: investmentProfilesTable.userId,
        set: {
          monthlyIncome: String(monthlyIncome),
          monthlySavings: String(monthlySavings),
          riskTolerance,
          investmentGoal,
          age,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("Could not save investment profile:", err);
  }

  const advice = getInvestmentRecommendations(
    Number(monthlyIncome),
    Number(monthlySavings),
    riskTolerance,
    investmentGoal,
    Number(age),
  );

  res.json(advice);
});

export default router;

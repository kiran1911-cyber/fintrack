import { Router, type IRouter } from "express";

const router: IRouter = Router();

const FINANCIAL_SYSTEM_PROMPT = `You are FinTrack AI, a friendly and knowledgeable personal finance assistant focused on Indian personal finance. 
You help users track expenses, save money, and make smart investment decisions.
You give practical, actionable advice tailored to Indian financial context (rupees, Indian tax system, mutual funds, SIP, PPF, NPS, ELSS, etc.).
Keep responses concise (2-4 paragraphs max), friendly, and actionable.
Always encourage healthy financial habits while being realistic about challenges.`;

async function callAI(messages: Array<{ role: string; content: string }>) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  if (!apiKey) {
    return getFallbackResponse(messages[messages.length - 1]?.content || "");
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: FINANCIAL_SYSTEM_PROMPT }, ...messages],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content || getFallbackResponse(messages[messages.length - 1]?.content || "");
  } catch (err) {
    console.error("AI API error:", err);
    return getFallbackResponse(messages[messages.length - 1]?.content || "");
  }
}

function getFallbackResponse(userMessage: string): string {
  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes("save") || lowerMsg.includes("saving")) {
    return `Great question about saving! Here are some proven strategies:\n\n**50/30/20 Rule**: Allocate 50% of income to needs, 30% to wants, and 20% to savings and investments.\n\n**Automate your savings**: Set up an automatic SIP (Systematic Investment Plan) that transfers money to your investment account on salary day — before you can spend it.\n\n**Track every rupee**: Use FinTrack AI to categorize your expenses. Most people are surprised to find they spend 20-30% more on dining and entertainment than they think.`;
  }

  if (lowerMsg.includes("invest") || lowerMsg.includes("mutual fund")) {
    return `Smart thinking on investments! Here's a beginner-friendly approach for Indians:\n\n**Start with Index Funds**: Nifty 50 or Sensex index funds are low-cost and give you broad market exposure. Expected returns: 10-12% annually over 10+ years.\n\n**Tax-saving ELSS**: Invest up to ₹1.5 lakh in ELSS funds to save tax under Section 80C while building wealth.\n\n**SIP over lump sum**: Start a monthly SIP — even ₹500/month compounds beautifully over time. Use the Investment Advisor section to get personalized recommendations.`;
  }

  if (lowerMsg.includes("food") || lowerMsg.includes("eat")) {
    return `Food expenses are often the biggest controllable spending category! Here are ways to reduce them:\n\n**Meal prep on weekends**: Preparing meals in bulk can cut food costs by 40-50% vs. ordering out.\n\n**Set a weekly food budget**: Track your restaurant vs. home cooking spending in FinTrack. Aim for 80% home-cooked meals.\n\n**Smart grocery shopping**: Buy in bulk for non-perishables, use local markets for fresh produce, and avoid grocery shopping when hungry.`;
  }

  if (lowerMsg.includes("budget")) {
    return `Budgeting is the foundation of financial health! Here's a simple system:\n\n**Zero-based budgeting**: At the start of each month, allocate every rupee of your income to a specific category — expenses, savings, investments, and fun money.\n\n**Review weekly**: Spend 10 minutes every Sunday reviewing your FinTrack spending. Early awareness prevents month-end surprises.\n\n**Build buffer**: Always budget 5-10% as a "miscellaneous" buffer. Life is unpredictable.`;
  }

  if (lowerMsg.includes("debt") || lowerMsg.includes("loan") || lowerMsg.includes("emi")) {
    return `Managing debt wisely is crucial for financial freedom!\n\n**Avalanche method**: Pay minimums on all debts, then throw extra money at the highest interest rate debt first — this saves the most money.\n\n**Avoid lifestyle debt**: EMIs on phones, gadgets, or vacations can trap you in a debt cycle. Save up and pay cash instead.\n\n**Home loan is different**: Home loans at 8-9% with tax benefits are 'good debt' — investing in equity funds (12%+ returns) while paying home loan EMI can actually build wealth faster.`;
  }

  return `Thanks for your question! As your FinTrack AI assistant, I'm here to help with personal finance in the Indian context.\n\nSome quick tips:\n• **Track first**: You can't improve what you don't measure. Use FinTrack to categorize all expenses.\n• **Emergency fund**: Keep 6 months of expenses in a liquid fund before investing.\n• **Start investing early**: Even ₹1,000/month invested at 12% for 30 years grows to ₹35 lakhs!\n\nAsk me about saving strategies, investment options, budgeting, or reducing specific expense categories.`;
}

function getSuggestions(reply: string): string[] {
  const suggestions = [
    "How to save more on food?",
    "Best SIP investment options?",
    "How to build an emergency fund?",
    "Tips to reduce monthly expenses",
    "Should I invest in mutual funds?",
    "How to plan for retirement?",
    "Tax saving investment options?",
  ];

  return suggestions.slice(0, 3);
}

router.post("/chat/message", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { message, history = [] } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  try {
    const messages = [
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];

    const reply = await callAI(messages);
    const suggestions = getSuggestions(reply);

    res.json({ reply, suggestions });
  } catch (err) {
    console.error("Error in chat:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

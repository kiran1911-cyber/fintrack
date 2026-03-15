import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetInvestmentAdvice } from "@workspace/api-client-react";
import { formatCurrency, CATEGORY_COLORS } from "@/lib/constants";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { TrendingUp, Sparkles, Loader2, ShieldAlert, Target } from "lucide-react";

const schema = z.object({
  monthlyIncome: z.coerce.number().positive("Income is required"),
  monthlySavings: z.coerce.number().min(0, "Savings cannot be negative"),
  riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
  investmentGoal: z.enum(["retirement", "house", "education", "wealth"]),
  age: z.coerce.number().min(18).max(100),
});

type FormValues = z.infer<typeof schema>;

export default function Investments() {
  const [showResults, setShowResults] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      riskTolerance: "moderate",
      investmentGoal: "wealth",
      age: 30
    }
  });

  const adviceMutation = useGetInvestmentAdvice({
    mutation: {
      onSuccess: () => setShowResults(true)
    }
  });

  const onSubmit = (data: FormValues) => {
    adviceMutation.mutate({ data });
  };

  const advice = adviceMutation.data;

  // Colors for investment charts
  const INVEST_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <TrendingUp className="text-primary w-8 h-8" />
          AI Investment Advisor
        </h1>
        <p className="text-muted-foreground mt-2">Get personalized portfolio recommendations based on your financial profile.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className={`lg:col-span-${showResults ? '4' : '8 lg:col-start-3'} transition-all duration-500`}>
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>
            
            <h2 className="text-xl font-bold mb-6 text-foreground">Your Profile</h2>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Monthly Income (₹)</label>
                <input 
                  type="number"
                  {...form.register("monthlyIncome")}
                  className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                  placeholder="e.g. 100000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Monthly Savings (₹)</label>
                <input 
                  type="number"
                  {...form.register("monthlySavings")}
                  className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                  placeholder="e.g. 25000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Age</label>
                  <input 
                    type="number"
                    {...form.register("age")}
                    className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                    placeholder="e.g. 30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Risk Tolerance</label>
                  <select 
                    {...form.register("riskTolerance")}
                    className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Primary Goal</label>
                <select 
                  {...form.register("investmentGoal")}
                  className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                >
                  <option value="wealth">Wealth Generation</option>
                  <option value="retirement">Retirement</option>
                  <option value="house">Buying a House</option>
                  <option value="education">Education</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={adviceMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 mt-4"
              >
                {adviceMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generate Strategy
              </button>
            </form>
          </div>
        </div>

        {/* Results Panel */}
        {showResults && advice && (
          <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
            {/* Summary Banner */}
            <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 rounded-2xl p-6 relative overflow-hidden">
              <h3 className="text-2xl font-display font-bold text-foreground mb-2">Your Strategy</h3>
              <p className="text-muted-foreground leading-relaxed relative z-10">{advice.summary}</p>
              
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total to Invest</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(advice.totalInvestable)} / mo</p>
                </div>
                <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Savings Rate</p>
                  <p className="text-xl font-bold text-foreground">{advice.savingsRate}%</p>
                </div>
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Chart */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg flex flex-col">
                <h4 className="font-semibold mb-4">Target Allocation</h4>
                <div className="flex-1 min-h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={advice.recommendations}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="percentage"
                        stroke="none"
                      >
                        {advice.recommendations.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={INVEST_COLORS[index % INVEST_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'Allocation']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Items */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4">
                <h4 className="font-semibold mb-2">Portfolio Breakdown</h4>
                <div className="space-y-4 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                  {advice.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-border">
                      <div className="w-2 h-full rounded-full" style={{ backgroundColor: INVEST_COLORS[i % INVEST_COLORS.length] }} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-bold text-foreground">{rec.category}</h5>
                          <span className="font-bold text-primary">{rec.percentage}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-foreground">{formatCurrency(rec.amount)}</span>
                          <span className="px-2 py-0.5 rounded-md bg-white/10">{rec.riskLevel} risk</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Emergency Fund Alert */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex gap-4 items-start">
              <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-500 mb-1">Emergency Fund Notice</h4>
                <p className="text-sm text-muted-foreground">{advice.emergencyFundAdvice}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useGetMonthlySummary, useListExpenses } from "@workspace/api-client-react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, CATEGORY_COLORS } from "@/lib/constants";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { ArrowUpRight, TrendingDown, IndianRupee, Activity, Calendar as CalIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Dashboard() {
  const { selectedMonth, selectedYear, setDateFilter } = useAppStore();
  
  const { data: summary, isLoading: isLoadingSummary } = useGetMonthlySummary({ 
    month: selectedMonth, 
    year: selectedYear 
  });
  
  const { data: expensesData, isLoading: isLoadingExpenses } = useListExpenses({ 
    month: selectedMonth, 
    year: selectedYear 
  });

  const isLoading = isLoadingSummary || isLoadingExpenses;

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-sm">
          <p className="font-semibold mb-1 text-foreground">{label}</p>
          <p className="text-primary font-bold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const topCategory = summary?.categoryBreakdown?.length 
    ? summary.categoryBreakdown.reduce((prev, current) => (prev.total > current.total) ? prev : current)
    : null;

  const percentChange = summary 
    ? summary.previousMonthTotal === 0 ? 0 : ((summary.totalSpent - summary.previousMonthTotal) / summary.previousMonthTotal) * 100
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here's your financial overview for the month.</p>
        </div>
        
        <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm w-fit">
          <button 
            onClick={() => {
              const m = selectedMonth === 1 ? 12 : selectedMonth - 1;
              const y = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
              setDateFilter(m, y);
            }}
            className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors"
          >
            Prev
          </button>
          <div className="px-4 py-2 font-medium flex items-center gap-2 border-x border-border/50 text-sm">
            <CalIcon className="w-4 h-4 text-primary" />
            {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}
          </div>
          <button 
            onClick={() => {
              const m = selectedMonth === 12 ? 1 : selectedMonth + 1;
              const y = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
              setDateFilter(m, y);
            }}
            className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <IndianRupee className="w-16 h-16" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Spent</p>
              <h3 className="text-3xl font-display font-bold text-foreground mb-4">
                {formatCurrency(summary?.totalSpent || 0)}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className={`flex items-center px-2 py-0.5 rounded-full ${percentChange > 0 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                  {percentChange > 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />}
                  {Math.abs(percentChange).toFixed(1)}%
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-16 h-16" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Top Category</p>
              <h3 className="text-3xl font-display font-bold text-foreground mb-1">
                {topCategory?.category || "None"}
              </h3>
              <p className="text-sm text-primary font-medium mt-3">
                {topCategory ? formatCurrency(topCategory.total) : "₹0"}
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                <ReceiptIcon className="w-16 h-16" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Transactions</p>
              <h3 className="text-3xl font-display font-bold text-foreground mb-1">
                {summary?.expenseCount || 0}
              </h3>
              <p className="text-sm text-muted-foreground mt-3">
                Avg. {summary?.expenseCount ? formatCurrency((summary?.totalSpent || 0) / summary.expenseCount) : "₹0"} / txn
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg lg:col-span-2">
              <h3 className="font-semibold text-lg mb-6">Daily Spending</h3>
              <div className="h-[300px] w-full">
                {summary?.dailyTotals?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.dailyTotals}>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                        tickFormatter={(val) => format(parseISO(val), 'd MMM')}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted)/0.5)'}} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No data for this month</div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-lg mb-6">By Category</h3>
              <div className="h-[300px] w-full flex flex-col">
                {summary?.categoryBreakdown?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.categoryBreakdown}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="total"
                        stroke="none"
                      >
                        {summary.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.Other} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Expenses List */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <h3 className="font-semibold text-lg mb-6">Recent Expenses</h3>
            {expensesData?.expenses?.length ? (
              <div className="space-y-4">
                {expensesData.expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-border/50">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other }}
                      >
                        {expense.category.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{expense.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(expense.date), 'MMM d, yyyy')} • {expense.category}
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-foreground">
                      {formatCurrency(expense.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent expenses found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Inline fallback for the icon
function ReceiptIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
      <path d="M12 17.5v-11"/>
    </svg>
  );
}

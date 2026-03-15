import { useState } from "react";
import { Link } from "wouter";
import { useListExpenses, useDeleteExpense } from "@workspace/api-client-react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, CATEGORY_COLORS, CATEGORIES } from "@/lib/constants";
import { format, parseISO } from "date-fns";
import { Plus, Search, Filter, Edit2, Trash2, Loader2, Variable } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListExpensesQueryKey, getGetMonthlySummaryQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Expenses() {
  const { selectedMonth, selectedYear, setDateFilter } = useAppStore();
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListExpenses({ 
    month: selectedMonth, 
    year: selectedYear,
    category: filterCategory === "All" ? undefined : filterCategory
  });

  const deleteMutation = useDeleteExpense({
    mutation: {
      onSuccess: () => {
        toast({ title: "Expense deleted", description: "The expense has been removed successfully." });
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMonthlySummaryQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to delete", description: err.error?.error || "Unknown error", variant: "destructive" });
      }
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground mt-1">Manage and track your transactions.</p>
        </div>
        <Link 
          href="/expenses/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </Link>
      </div>

      <div className="bg-card border border-border p-4 rounded-2xl flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search expenses... (coming soon)" 
              disabled
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all opacity-50 cursor-not-allowed"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-sm focus:outline-none text-foreground py-1 pr-2 appearance-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5">
            <select
              value={selectedMonth}
              onChange={(e) => setDateFilter(parseInt(e.target.value), selectedYear)}
              className="bg-transparent text-sm focus:outline-none text-foreground py-1 pr-2 cursor-pointer"
            >
              {Array.from({length: 12}).map((_, i) => (
                <option key={i} value={i+1}>{format(new Date(2000, i, 1), 'MMMM')}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setDateFilter(selectedMonth, parseInt(e.target.value))}
              className="bg-transparent text-sm focus:outline-none text-foreground py-1 pr-2 cursor-pointer border-l border-border pl-2"
            >
              {[2023, 2024, 2025].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-sm text-muted-foreground bg-white/5">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : data?.expenses?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No expenses found for this period.
                  </td>
                </tr>
              ) : (
                data?.expenses?.map((expense) => (
                  <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {format(parseISO(expense.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{expense.title}</p>
                      {expense.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{expense.notes}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                        style={{ 
                          backgroundColor: `${CATEGORY_COLORS[expense.category]}15`,
                          color: CATEGORY_COLORS[expense.category],
                          borderColor: `${CATEGORY_COLORS[expense.category]}30`
                        }}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-right text-foreground">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/expenses/${expense.id}/edit`}
                          className="p-2 text-muted-foreground hover:text-primary bg-background border border-border rounded-lg transition-colors hover:border-primary/30 hover:bg-primary/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-muted-foreground hover:text-destructive bg-background border border-border rounded-lg transition-colors hover:border-destructive/30 hover:bg-destructive/10 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.total !== undefined && (
          <div className="bg-white/5 border-t border-border p-4 px-6 flex justify-between items-center font-bold">
            <span>Total</span>
            <span className="text-primary text-xl">{formatCurrency(data.total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

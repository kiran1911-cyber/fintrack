import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateExpense, useGetExpense, useUpdateExpense, getListExpensesQueryKey, getGetMonthlySummaryQueryKey } from "@workspace/api-client-react";
import { CATEGORIES } from "@/lib/constants";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { format } from "date-fns";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ExpenseForm() {
  const [, setLocation] = useLocation();
  const [isEdit, params] = useRoute("/expenses/:id/edit");
  const id = isEdit ? Number(params?.id) : undefined;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingData, isLoading: isLoadingExisting } = useGetExpense(id as number, {
    query: { enabled: !!id }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      amount: undefined,
      category: CATEGORIES[0],
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: ""
    }
  });

  useEffect(() => {
    if (existingData?.expense) {
      form.reset({
        title: existingData.expense.title,
        amount: existingData.expense.amount,
        category: existingData.expense.category,
        date: existingData.expense.date.split('T')[0], // Simple date extraction
        notes: existingData.expense.notes || "",
      });
    }
  }, [existingData, form]);

  const createMutation = useCreateExpense({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Expense created successfully" });
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMonthlySummaryQueryKey() });
        setLocation("/expenses");
      },
      onError: (err) => toast({ title: "Error", description: err.error?.error || "Failed to create", variant: "destructive" })
    }
  });

  const updateMutation = useUpdateExpense({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Expense updated successfully" });
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMonthlySummaryQueryKey() });
        setLocation("/expenses");
      },
      onError: (err) => toast({ title: "Error", description: err.error?.error || "Failed to update", variant: "destructive" })
    }
  });

  const onSubmit = (data: FormValues) => {
    if (id) {
      updateMutation.mutate({ id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingExisting) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button 
        onClick={() => setLocation("/expenses")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Expenses
      </button>

      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-8 border-b border-border bg-white/5">
          <h1 className="text-2xl font-display font-bold text-foreground">
            {isEdit ? "Edit Expense" : "Add New Expense"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isEdit ? "Update the details of your transaction below." : "Enter the details of your new transaction below."}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Title</label>
              <input 
                {...form.register("title")}
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm transition-all outline-none text-foreground placeholder:text-muted-foreground"
                placeholder="e.g. Groceries at Whole Foods"
              />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Amount (₹)</label>
              <input 
                type="number"
                step="0.01"
                {...form.register("amount")}
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm transition-all outline-none text-foreground placeholder:text-muted-foreground"
                placeholder="0.00"
              />
              {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Category</label>
              <select 
                {...form.register("category")}
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm transition-all outline-none text-foreground"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {form.formState.errors.category && <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Date</label>
              <input 
                type="date"
                {...form.register("date")}
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm transition-all outline-none text-foreground style-color-scheme-dark"
              />
              {form.formState.errors.date && <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Notes (Optional)</label>
            <textarea 
              {...form.register("notes")}
              rows={3}
              className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm transition-all outline-none text-foreground placeholder:text-muted-foreground resize-none"
              placeholder="Add any extra details here..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <button 
              type="button"
              onClick={() => setLocation("/expenses")}
              className="px-6 py-3 rounded-xl font-semibold text-foreground hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isEdit ? "Save Changes" : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

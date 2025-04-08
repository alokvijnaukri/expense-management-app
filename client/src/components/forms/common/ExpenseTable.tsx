import React from "react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ExpenseItem {
  date: string;
  category: string;
  description: string;
  amount: number;
  receipt?: string;
}

interface ExpenseTableProps {
  expenses: ExpenseItem[];
  onChange: (expenses: ExpenseItem[]) => void;
  categories: { value: string; label: string }[];
  advanceAmount?: number;
}

export default function ExpenseTable({
  expenses,
  onChange,
  categories,
  advanceAmount = 0,
}: ExpenseTableProps) {
  const { toast } = useToast();

  const addExpense = () => {
    const newExpense: ExpenseItem = {
      date: new Date().toISOString().split("T")[0],
      category: "",
      description: "",
      amount: 0,
      receipt: "",
    };
    onChange([...expenses, newExpense]);
    toast({
      description: "New expense item added",
    });
  };

  const removeExpense = (index: number) => {
    const newExpenses = [...expenses];
    newExpenses.splice(index, 1);
    onChange(newExpenses);
    toast({
      description: "Expense item removed",
    });
  };

  const updateExpense = (index: number, field: keyof ExpenseItem, value: any) => {
    const newExpenses = [...expenses];
    newExpenses[index] = {
      ...newExpenses[index],
      [field]: field === "amount" ? parseFloat(value) || 0 : value,
    };
    onChange(newExpenses);
  };

  const calculateTotal = () => {
    return expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const handleFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateExpense(index, "receipt", file.name);
      toast({
        description: `File "${file.name}" attached`,
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-neutral-700">Expense Details</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary/90 text-sm font-medium"
          onClick={addExpense}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Expense
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Receipt
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {expenses.map((expense, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="date"
                    value={expense.date}
                    onChange={(e) => updateExpense(index, "date", e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={expense.category}
                    onChange={(e) => updateExpense(index, "category", e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={expense.description}
                    onChange={(e) => updateExpense(index, "description", e.target.value)}
                    placeholder="Brief description"
                    className="w-full rounded-md border border-neutral-300 px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 text-xs">₹</span>
                    </div>
                    <input
                      type="number"
                      value={expense.amount || ""}
                      onChange={(e) => {
                        // Explicitly convert string to number
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        updateExpense(index, "amount", value);
                      }}
                      placeholder="0.00"
                      className="w-full rounded-md border border-neutral-300 pl-7 px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="flex items-center justify-center cursor-pointer">
                    <span className="text-primary text-sm">
                      {expense.receipt ? expense.receipt : "Upload"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange(index, e)}
                    />
                  </label>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => removeExpense(index)}
                    className="text-danger hover:text-danger/80"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-neutral-500">
                  No expense items added. Click "Add Expense" to add an item.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-50">
              <td
                colSpan={3}
                className="px-6 py-4 text-right font-medium"
              >
                Total Amount:
              </td>
              <td className="px-6 py-4 font-medium">
                {formatCurrency(calculateTotal())}
              </td>
              <td colSpan={2}></td>
            </tr>
            {advanceAmount > 0 && (
              <tr className="bg-neutral-50">
                <td
                  colSpan={3}
                  className="px-6 py-4 text-right font-medium"
                >
                  Less: Advance:
                </td>
                <td className="px-6 py-4 font-medium">
                  {formatCurrency(advanceAmount)}
                </td>
                <td colSpan={2}></td>
              </tr>
            )}
            <tr className="bg-neutral-50">
              <td
                colSpan={3}
                className="px-6 py-4 text-right font-medium"
              >
                Net Claim Amount:
              </td>
              <td className="px-6 py-4 font-semibold text-primary">
                {formatCurrency(Math.max(0, calculateTotal() - advanceAmount))}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

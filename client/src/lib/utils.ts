import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Expense Types
export const ClaimTypes = {
  TRAVEL: "travel",
  BUSINESS_PROMOTION: "business_promotion",
  CONVEYANCE: "conveyance",
  MOBILE_BILL: "mobile_bill",
  RELOCATION: "relocation",
  OTHER: "other",
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined, currencySymbol = "₹") {
  if (amount === undefined || amount === null) {
    return `${currencySymbol}0`;
  }
  try {
    return `${currencySymbol}${amount.toLocaleString('en-IN')}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currencySymbol}0`;
  }
}

export function formatDate(dateString: string | Date | undefined) {
  if (dateString === undefined || dateString === null) {
    return 'N/A';
  }
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

export function getClaimTypeIcon(type: string) {
  switch (type) {
    case 'travel':
      return 'plane';
    case 'business_promotion':
      return 'gift';
    case 'conveyance':
      return 'taxi';
    case 'mobile_bill':
      return 'smartphone';
    case 'relocation':
      return 'home';
    case 'other':
      return 'file-list-3';
    default:
      return 'file';
  }
}

export function getClaimTypeName(type: string | undefined) {
  if (type === undefined || type === null) {
    return 'Unknown';
  }
  try {
    switch (type) {
      case 'travel':
        return 'Travel Expense';
      case 'business_promotion':
        return 'Business Promotion';
      case 'conveyance':
        return 'Conveyance';
      case 'mobile_bill':
        return 'Mobile Bill';
      case 'relocation':
        return 'Relocation Expense';
      case 'other':
        return 'Other Claim';
      default:
        return 'Unknown';
    }
  } catch (error) {
    console.error('Error getting claim type name:', error);
    return 'Unknown';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'draft':
      return {
        bgColor: 'bg-neutral-100',
        textColor: 'text-neutral-600'
      };
    case 'submitted':
      return {
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700'
      };
    case 'approved':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-700'
      };
    case 'rejected':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-700'
      };
    case 'processing':
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700'
      };
    case 'paid':
      return {
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-700'
      };
    default:
      return {
        bgColor: 'bg-neutral-100',
        textColor: 'text-neutral-600'
      };
  }
}

export function calculateTotalAmount(expenses: any[]) {
  return expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
}

export function generateClaimId() {
  return `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

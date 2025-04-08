import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
      return 'neutral';
    case 'submitted':
      return 'warning';
    case 'approved':
      return 'secondary';
    case 'rejected':
      return 'danger';
    case 'processing':
      return 'primary';
    case 'paid':
      return 'secondary';
    default:
      return 'neutral';
  }
}

export function calculateTotalAmount(expenses: any[]) {
  return expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
}

export function generateClaimId() {
  return `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

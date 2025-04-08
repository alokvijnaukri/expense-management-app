import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "draft":
        return "bg-neutral-100 text-neutral-700";
      case "submitted":
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "approved":
      case "paid":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  const statusMap: Record<string, string> = {
    draft: "Draft",
    submitted: "Pending",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    processing: "Processing",
    paid: "Paid",
  };

  const displayText = statusMap[status.toLowerCase()] || status;

  return (
    <span
      className={cn(
        "px-2 py-1 text-xs font-medium rounded-full",
        getStatusStyles(),
        className
      )}
    >
      {displayText}
    </span>
  );
}

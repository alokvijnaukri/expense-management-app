import React from "react";
import { cn, formatCurrency } from "@/lib/utils";

interface StatCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  iconBgColor: string;
  footer: React.ReactNode;
}

export default function StatCard({
  title,
  amount,
  icon,
  iconBgColor,
  footer,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between mb-4">
        <div>
          <p className="text-neutral-500 text-sm">{title}</p>
          <h3 className="text-2xl font-semibold">{formatCurrency(amount)}</h3>
        </div>
        <div
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center",
            iconBgColor
          )}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-center text-sm">{footer}</div>
    </div>
  );
}

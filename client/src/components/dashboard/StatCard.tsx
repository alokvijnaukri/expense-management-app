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
    <div className="gradient-card p-6 transition-all hover:translate-y-[-2px]">
      <div className="flex justify-between mb-4">
        <div>
          <p className="text-neutral-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-gradient">{formatCurrency(amount)}</h3>
        </div>
        <div
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center shadow-sm",
            iconBgColor
          )}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-center text-sm text-muted-foreground/90 font-medium">{footer}</div>
    </div>
  );
}

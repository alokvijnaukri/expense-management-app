import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getClaimTypeName } from "@/lib/utils";

export default function ExpenseBreakdown() {
  const { user } = useAuth();

  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/claims", "expense-breakdown"],
    queryFn: async () => {
      const res = await fetch("/api/claims");
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data = await res.json();
      console.log("ExpenseBreakdown data:", data);
      return data;
    },
    enabled: true,
  });

  // Prepare data for the chart
  const prepareChartData = () => {
    if (!claims || claims.length === 0) return [];

    // Group claims by type
    const groupedByType: Record<string, { claimed: number; approved: number }> = {};

    claims.forEach((claim: any) => {
      const type = claim.type;
      if (!groupedByType[type]) {
        groupedByType[type] = { claimed: 0, approved: 0 };
      }

      groupedByType[type].claimed += claim.totalAmount || 0;
      
      // Only count approved amount for approved claims
      if (claim.status === "approved" || claim.status === "paid") {
        groupedByType[type].approved += claim.approvedAmount || claim.totalAmount || 0;
      }
    });

    return Object.keys(groupedByType).map((type) => ({
      name: getClaimTypeName(type),
      claimed: groupedByType[type].claimed,
      approved: groupedByType[type].approved,
    }));
  };

  const chartData = prepareChartData();

  return (
    <div className="gradient-card lg:col-span-2">
      <div className="p-6 border-b border-border/50">
        <h3 className="text-lg font-bold text-gradient">
          Expense Breakdown
        </h3>
      </div>
      <div className="p-6">
        <div className="h-80">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground animate-pulse">Loading chart data...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/30)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground)/80)' }} />
                <YAxis tick={{ fill: 'hsl(var(--foreground)/80)' }} />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, undefined]}
                  labelFormatter={(name) => `Category: ${name}`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border)/50)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 20 }}
                  formatter={(value) => <span className="text-foreground/90">{value}</span>}
                />
                <Bar 
                  dataKey="claimed" 
                  name="Claimed Amount" 
                  fill="hsl(var(--chart-1))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="approved" 
                  name="Approved Amount" 
                  fill="hsl(var(--chart-2))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <span className="ri-bar-chart-2-line text-4xl mb-4 opacity-50"></span>
              <p className="font-medium">No expense data available</p>
              <p className="text-sm">Submit claims to see your expense breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

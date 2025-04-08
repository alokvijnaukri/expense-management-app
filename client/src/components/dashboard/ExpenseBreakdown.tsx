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
import { useUser } from "@/components/auth/UserProvider";
import { getClaimTypeName } from "@/lib/utils";

export default function ExpenseBreakdown() {
  const { user } = useUser();

  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/claims", user?.id],
    enabled: !!user?.id,
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
    <div className="bg-white rounded-lg shadow-sm lg:col-span-2">
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-700">
          Expense Breakdown
        </h3>
      </div>
      <div className="p-6">
        <div className="h-80">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-neutral-400">Loading chart data...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, undefined]}
                  labelFormatter={(name) => `Category: ${name}`}
                />
                <Legend />
                <Bar dataKey="claimed" name="Claimed Amount" fill="hsl(var(--chart-1))" />
                <Bar dataKey="approved" name="Approved Amount" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400">
              <span className="ri-bar-chart-2-line text-4xl mb-4"></span>
              <p>No expense data available</p>
              <p className="text-sm">Submit claims to see your expense breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

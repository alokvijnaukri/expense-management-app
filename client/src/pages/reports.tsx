import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, getClaimTypeName } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClaimTypes } from "@shared/schema";

const COLORS = ["#1A73E8", "#34A853", "#EA4335", "#FBBC04", "#5F6368", "#3C4043"];

export default function Reports() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState("month");
  const [reportType, setReportType] = useState("expense");

  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/claims"],
    enabled: !!user?.id && (user?.role === "finance" || user?.role === "admin"),
  });

  // Filter claims based on the selected time period
  const filterClaimsByDate = (claims: any[]) => {
    if (!claims) return [];

    const now = new Date();
    let cutoffDate = new Date();

    switch (timePeriod) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate.setMonth(now.getMonth() - 1); // Default to last month
    }

    return claims.filter((claim: any) => new Date(claim.createdAt) >= cutoffDate);
  };

  const filteredClaims = filterClaimsByDate(claims || []);

  const prepareExpenseByTypeData = () => {
    if (!filteredClaims.length) return [];

    const expenseByType: Record<string, { claimed: number; approved: number }> = {};

    // Initialize all claim types with zero values
    Object.values(ClaimTypes).forEach(type => {
      expenseByType[type] = { claimed: 0, approved: 0 };
    });

    // Sum up the amounts for each claim type
    filteredClaims.forEach((claim: any) => {
      if (!expenseByType[claim.type]) {
        expenseByType[claim.type] = { claimed: 0, approved: 0 };
      }

      expenseByType[claim.type].claimed += claim.totalAmount;

      if (claim.status === "approved" || claim.status === "paid") {
        expenseByType[claim.type].approved += claim.approvedAmount || claim.totalAmount;
      }
    });

    // Convert to array format for charts
    return Object.entries(expenseByType).map(([type, amounts]) => ({
      name: getClaimTypeName(type),
      claimed: amounts.claimed,
      approved: amounts.approved,
    }));
  };

  const prepareStatusDistributionData = () => {
    if (!filteredClaims.length) return [];

    const statusCount: Record<string, number> = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
    };

    filteredClaims.forEach((claim: any) => {
      if (statusCount[claim.status] !== undefined) {
        statusCount[claim.status]++;
      }
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  };

  const calculateTotalStats = () => {
    if (!filteredClaims.length) return { total: 0, approved: 0, rejected: 0, pending: 0 };

    let total = 0;
    let approved = 0;
    let rejected = 0;
    let pending = 0;

    filteredClaims.forEach((claim: any) => {
      total += claim.totalAmount;

      if (claim.status === "approved" || claim.status === "paid") {
        approved += claim.approvedAmount || claim.totalAmount;
      } else if (claim.status === "rejected") {
        rejected += claim.totalAmount;
      } else if (claim.status === "submitted") {
        pending += claim.totalAmount;
      }
    });

    return { total, approved, rejected, pending };
  };

  const expenseByTypeData = prepareExpenseByTypeData();
  const statusDistributionData = prepareStatusDistributionData();
  const totalStats = calculateTotalStats();

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={expenseByTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
        <YAxis />
        <Tooltip formatter={(value) => [`₹${value}`, undefined]} />
        <Legend />
        <Bar dataKey="claimed" name="Claimed Amount" fill="#1A73E8" />
        <Bar dataKey="approved" name="Approved Amount" fill="#34A853" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={statusDistributionData}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {statusDistributionData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} claims`, undefined]} />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderTopClaimsTable = () => {
    // Sort claims by amount in descending order and take top 5
    const topClaims = [...filteredClaims]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Claim ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topClaims.map((claim) => (
            <TableRow key={claim.id}>
              <TableCell className="font-medium">{claim.claimId}</TableCell>
              <TableCell>{getClaimTypeName(claim.type)}</TableCell>
              <TableCell>ID: {claim.userId}</TableCell>
              <TableCell className="text-right">{formatCurrency(claim.totalAmount)}</TableCell>
              <TableCell className="capitalize">{claim.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Expense Reports</h2>
          <p className="text-neutral-500">
            View and analyze expense claims across the organization
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
          <Select
            defaultValue="month"
            onValueChange={setTimePeriod}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Select
            defaultValue="expense"
            onValueChange={setReportType}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense by Type</SelectItem>
              <SelectItem value="status">Status Distribution</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-neutral-500">Loading report data...</p>
        </div>
      ) : filteredClaims.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-500">Total Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalStats.total)}
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {filteredClaims.length} claims submitted
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-500">Approved Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {formatCurrency(totalStats.approved)}
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {Math.round((totalStats.approved / totalStats.total) * 100)}% of total claimed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-500">Rejected Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalStats.rejected)}
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {Math.round((totalStats.rejected / totalStats.total) * 100)}% of total claimed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-500">Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {formatCurrency(totalStats.pending)}
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {Math.round((totalStats.pending / totalStats.total) * 100)}% of total claimed
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {reportType === "expense" ? "Expense by Category" : "Claim Status Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportType === "expense" ? renderBarChart() : renderPieChart()}
            </CardContent>
          </Card>
          
          {/* Top Claims Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Claims by Amount</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTopClaimsTable()}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <span className="ri-bar-chart-2-line text-3xl"></span>
          </div>
          <h3 className="text-lg font-medium text-neutral-700 mb-2">No Data Available</h3>
          <p className="text-neutral-500 mb-6">
            There are no claims data available for the selected time period.
          </p>
        </div>
      )}
    </div>
  );
}

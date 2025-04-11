import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, getClaimTypeIcon, getClaimTypeName } from "@/lib/utils";

export default function ApprovalTimeline() {
  const { user } = useAuth();

  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/claims", "approval-timeline"],
    queryFn: async () => {
      const res = await fetch("/api/claims");
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data = await res.json();
      console.log("ApprovalTimeline data:", data);
      return data;
    },
    enabled: true,
  });

  // Sort and filter claims for the timeline
  const timelineItems = claims
    ? claims
        .sort(
          (a: any, b: any) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .filter((claim: any, index: number) => index < 3)
    : [];

  const getIconClass = (type: string) => {
    const iconMap: Record<string, string> = {
      travel: "ri-plane-line",
      business_promotion: "ri-gift-line",
      conveyance: "ri-taxi-line",
      mobile_bill: "ri-smartphone-line",
      relocation: "ri-home-move-line",
      other: "ri-file-list-3-line",
    };
    return iconMap[type] || "ri-file-line";
  };

  const getStatusText = (claim: any) => {
    switch (claim.status) {
      case "draft":
        return "Draft saved";
      case "submitted":
      case "pending":
        return "Awaiting manager approval";
      case "approved":
        return claim.approvedAmount !== undefined
          ? "Approved for ₹" + claim.approvedAmount.toLocaleString('en-IN')
          : "Approved";
      case "rejected":
        return "Rejected";
      case "processing":
        return "Processing payment";
      case "paid":
        return "Payment completed";
      default:
        return claim.status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "text-muted-foreground";
      case "submitted":
      case "pending":
        return "text-amber-500 dark:text-amber-400";
      case "approved":
      case "paid":
        return "text-emerald-500 dark:text-emerald-400";
      case "rejected":
        return "text-destructive";
      case "processing":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="gradient-card">
      <div className="p-6 border-b border-border/50">
        <h3 className="text-lg font-bold text-gradient">
          Approval Timeline
        </h3>
      </div>
      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground animate-pulse">Loading timeline...</p>
          </div>
        ) : timelineItems.length > 0 ? (
          <div className="relative">
            <div className="absolute top-0 left-5 h-full w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-primary/10"></div>

            {timelineItems.map((claim: any, index: number) => (
              <div
                key={claim.id}
                className={`relative flex items-start space-x-4 group ${
                  index < timelineItems.length - 1 ? "pb-8" : ""
                }`}
              >
                <div className="relative z-10">
                  <div
                    className={`h-10 w-10 rounded-full shadow-md transition-transform duration-300 group-hover:scale-110 ${
                      claim.status === "rejected"
                        ? "bg-gradient-to-br from-red-400 to-red-500"
                        : claim.status === "approved" || claim.status === "paid"
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-500"
                        : "bg-gradient-to-br from-primary to-primary/80"
                    } flex items-center justify-center text-white`}
                  >
                    <i className={getIconClass(claim.type)}></i>
                  </div>
                </div>
                <div className="transform transition-all duration-300 group-hover:translate-x-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    {getClaimTypeName(claim.type)}{" "}
                    {claim.status === "submitted" || claim.status === "pending"
                      ? "Submitted"
                      : claim.status.charAt(0).toUpperCase() +
                        claim.status.slice(1)}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(claim.updatedAt)} at{" "}
                    {new Date(claim.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm text-foreground/80 mt-2 font-medium">
                    {claim.details?.purpose ||
                      claim.details?.description ||
                      `${getClaimTypeName(claim.type)} claim`}
                  </p>
                  <span
                    className={`text-xs font-medium mt-1 inline-block ${getStatusColor(
                      claim.status
                    )}`}
                  >
                    {getStatusText(claim)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <i className="ri-calendar-line text-4xl mb-2 opacity-50"></i>
            <p className="font-medium">No recent activity</p>
            <p className="text-sm">Submit claims to see your timeline</p>
          </div>
        )}
      </div>
    </div>
  );
}

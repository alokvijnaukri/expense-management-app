import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/components/auth/UserProvider";
import { formatDate, getClaimTypeIcon, getClaimTypeName } from "@/lib/utils";

export default function ApprovalTimeline() {
  const { user } = useUser();

  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/claims", user?.id],
    enabled: !!user?.id,
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
        return "text-neutral-500";
      case "submitted":
        return "text-warning";
      case "approved":
      case "paid":
        return "text-secondary";
      case "rejected":
        return "text-danger";
      case "processing":
        return "text-primary";
      default:
        return "text-neutral-500";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-700">
          Approval Timeline
        </h3>
      </div>
      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-neutral-400">Loading timeline...</p>
          </div>
        ) : timelineItems.length > 0 ? (
          <div className="relative">
            <div className="absolute top-0 left-5 h-full w-0.5 bg-neutral-200"></div>

            {timelineItems.map((claim: any, index: number) => (
              <div
                key={claim.id}
                className={`relative flex items-start space-x-4 ${
                  index < timelineItems.length - 1 ? "pb-8" : ""
                }`}
              >
                <div className="relative">
                  <div
                    className={`h-10 w-10 rounded-full ${
                      claim.status === "rejected"
                        ? "bg-danger"
                        : claim.status === "approved" || claim.status === "paid"
                        ? "bg-secondary"
                        : "bg-primary"
                    } flex items-center justify-center text-white`}
                  >
                    <i className={getIconClass(claim.type)}></i>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-700">
                    {getClaimTypeName(claim.type)}{" "}
                    {claim.status === "submitted"
                      ? "Submitted"
                      : claim.status.charAt(0).toUpperCase() +
                        claim.status.slice(1)}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formatDate(claim.updatedAt)} at{" "}
                    {new Date(claim.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm text-neutral-600 mt-2">
                    {claim.details?.purpose ||
                      claim.details?.description ||
                      `${getClaimTypeName(claim.type)} claim`}
                  </p>
                  <span
                    className={`text-xs font-medium ${getStatusColor(
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
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <i className="ri-calendar-line text-4xl mb-2"></i>
            <p>No recent activity</p>
            <p className="text-sm">Submit claims to see your timeline</p>
          </div>
        )}
      </div>
    </div>
  );
}

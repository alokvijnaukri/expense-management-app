import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, getClaimTypeName } from "@/lib/utils";
import { ClaimTimeline } from "./ClaimTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface ClaimDetailsModalProps {
  claim: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ClaimDetailsModal({
  claim,
  open,
  onOpenChange,
}: ClaimDetailsModalProps) {
  if (!claim) return null;
  
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  
  // Fetch approvals data for the timeline view
  const { data: approvals, isLoading: isLoadingApprovals } = useQuery({
    queryKey: ['/api/approvals', claim.id],
    queryFn: async () => {
      const res = await fetch(`/api/approvals?claimId=${claim.id}`);
      if (!res.ok) throw new Error("Failed to fetch approval history");
      return res.json();
    },
    enabled: !!claim.id,
  });
  
  // Transform approvals into timeline events
  const timelineEvents = approvals?.map((approval: any) => ({
    id: approval.id,
    status: approval.status,
    approverName: approval.approverName || "Unknown",
    approverTitle: approval.approverTitle || "Approver",
    approvalLevel: approval.approvalLevel,
    date: approval.updatedAt || approval.createdAt,
    notes: approval.notes,
  })) || [];
  
  // Get the current approval level from last pending approval
  const currentLevel = approvals?.find((a: any) => a.status === "pending")?.approvalLevel;
  
  // Helper to render specific details based on claim type
  const renderTypeSpecificDetails = () => {
    switch (claim.type) {
      case "travel":
        return (
          <>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-700">From</h4>
                <p className="text-sm text-neutral-500">{claim.details.fromLocation}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-700">To</h4>
                <p className="text-sm text-neutral-500">{claim.details.toLocation}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Travel Dates</h4>
                <p className="text-sm text-neutral-500">
                  {formatDate(claim.details.departureDate)} - {formatDate(claim.details.returnDate)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Mode of Travel</h4>
                <p className="text-sm text-neutral-500">{claim.details.travelMode}</p>
              </div>
            </div>
          </>
        );
      case "mobile_bill":
        return (
          <>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Bill Period</h4>
                <p className="text-sm text-neutral-500">
                  {formatDate(claim.details.billStartDate)} - {formatDate(claim.details.billEndDate)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Phone Number</h4>
                <p className="text-sm text-neutral-500">{claim.details.phoneNumber}</p>
              </div>
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-neutral-700">Service Provider</h4>
                <p className="text-sm text-neutral-500">{claim.details.serviceProvider}</p>
              </div>
            </div>
          </>
        );
      // Add more cases for other claim types as needed
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">Claim Details</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription>
            Complete information about claim {claim.claimId}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            {/* Header with claim ID and status */}
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-lg font-medium text-neutral-700">{claim.claimId}</h3>
                <p className="text-sm text-neutral-500">{getClaimTypeName(claim.type)}</p>
              </div>
              <StatusBadge status={claim.status} />
            </div>

            {/* Basic claim info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Submitted On</h4>
                <p className="text-sm text-neutral-500">
                  {formatDate(claim.submittedAt || claim.createdAt)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Total Amount</h4>
                <p className="text-base font-semibold text-neutral-700">
                  {formatCurrency(claim.totalAmount)}
                </p>
              </div>
            </div>

            {/* Purpose/Description */}
            {claim.details.purpose && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Purpose</h4>
                <p className="text-sm text-neutral-500 mt-1">{claim.details.purpose}</p>
              </div>
            )}

            {/* Additional notes */}
            {claim.notes && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Notes</h4>
                <p className="text-sm text-neutral-500 mt-1">{claim.notes}</p>
              </div>
            )}

            {/* Type-specific details */}
            {renderTypeSpecificDetails()}

            {/* Expense breakdown if available */}
            {claim.details.expenses && claim.details.expenses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Expense Breakdown</h4>
                <div className="bg-neutral-50 rounded-md p-3">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-neutral-500 uppercase">
                          Description
                        </th>
                        <th className="text-left text-xs font-medium text-neutral-500 uppercase">
                          Date
                        </th>
                        <th className="text-right text-xs font-medium text-neutral-500 uppercase">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {claim.details.expenses.map((expense: any, index: number) => (
                        <tr key={index} className="border-t border-neutral-200">
                          <td className="py-2 text-sm text-neutral-700">
                            {expense.description}
                          </td>
                          <td className="py-2 text-sm text-neutral-500">
                            {formatDate(expense.date)}
                          </td>
                          <td className="py-2 text-sm text-neutral-700 text-right">
                            {formatCurrency(expense.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-neutral-200">
                        <td className="py-2 text-sm font-medium text-neutral-700" colSpan={2}>
                          Total
                        </td>
                        <td className="py-2 text-sm font-semibold text-neutral-700 text-right">
                          {formatCurrency(claim.totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="timeline">
            <div className="py-4">
              {/* Display timeline information */}
              {claim.id ? (
                <div className="space-y-4">
                  {isLoadingApprovals ? (
                    <div className="space-y-4 py-4">
                      <Skeleton className="h-4 w-[250px]" />
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  ) : timelineEvents.length > 0 ? (
                    <ClaimTimeline
                      events={timelineEvents}
                      currentLevel={currentLevel}
                    />
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No approval history found for this claim.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Timeline information not available.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
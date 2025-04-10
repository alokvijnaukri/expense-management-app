import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ClaimTimeline } from "./ClaimTimeline";
import { useToast } from "@/hooks/use-toast";

interface ClaimTimelineModalProps {
  claimId: number;
  claimNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ClaimTimelineModal({
  claimId,
  claimNumber,
  isOpen,
  onClose,
}: ClaimTimelineModalProps) {
  const { toast } = useToast();
  
  // Fetch claim approvals
  const { data: approvals, isLoading: isLoadingApprovals, error: approvalsError } = useQuery({
    queryKey: ["/api/approvals/claim", claimId],
    queryFn: async () => {
      const res = await fetch(`/api/approvals?claimId=${claimId}`);
      if (!res.ok) throw new Error("Failed to fetch approval history");
      return res.json();
    },
    enabled: isOpen && !!claimId,
  });

  // Show error toast if fetching fails
  useEffect(() => {
    if (approvalsError) {
      toast({
        title: "Error fetching approval timeline",
        description: "Failed to load the approval timeline data. Please try again.",
        variant: "destructive",
      });
    }
  }, [approvalsError, toast]);

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Approval Journey</span>
            <span className="text-sm font-normal text-muted-foreground">
              {claimNumber}
            </span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

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
          <div className="py-6 text-center text-muted-foreground">
            <p>No approval history found for this claim.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
import { CheckCircle2, Clock, XCircle, CircleDashed, CornerDownRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: number;
  status: string;
  approverName: string;
  approverTitle: string;
  approvalLevel: number;
  date: string;
  notes?: string;
}

interface ClaimTimelineProps {
  events: TimelineEvent[];
  currentLevel?: number;
}

export function ClaimTimeline({ events, currentLevel }: ClaimTimelineProps) {
  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "rejected":
        return <XCircle className="h-6 w-6 text-red-500" />;
      case "pending":
        return <Clock className="h-6 w-6 text-amber-500" />;
      default:
        return <CircleDashed className="h-6 w-6 text-gray-400" />;
    }
  };

  const getApprovalLevelName = (level: number) => {
    switch (level) {
      case 1:
        return "Manager Approval";
      case 2:
        return "Finance Approval";
      case 3:
        return "Director Approval";
      case 4:
        return "CXO Approval";
      default:
        return "Approval";
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="space-y-6 py-2">
      <h3 className="text-lg font-medium">Approval Timeline</h3>
      
      {/* Initial status - Submitted */}
      <div className="relative flex items-start gap-4 pb-2">
        <div className="absolute left-[11px] top-10 h-full w-px bg-gray-200" />
        <div className="mt-1 h-6 w-6 flex-none rounded-full bg-blue-500 flex items-center justify-center">
          <CircleDashed className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <p className="font-medium text-sm text-slate-900">Claim Submitted</p>
            <span className="text-xs text-slate-500">
              {sortedEvents.length > 0 
                ? formatEventDate(events[0].date)
                : 'N/A'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-700">Waiting for approval</p>
        </div>
      </div>

      {/* Timeline events */}
      {sortedEvents.map((event, index) => (
        <div key={event.id} className="relative flex items-start gap-4 pb-2">
          {index < sortedEvents.length - 1 && (
            <div className="absolute left-[11px] top-10 h-full w-px bg-gray-200" />
          )}
          <div className="mt-1 h-6 w-6 flex-none rounded-full bg-white border border-gray-200 flex items-center justify-center">
            {getStatusIcon(event.status)}
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <p className="font-medium text-sm text-slate-900">
                {getApprovalLevelName(event.approvalLevel)}
              </p>
              <span className="text-xs text-slate-500">
                {formatEventDate(event.date)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-700 flex items-center gap-1">
              <span className="font-medium">{event.approverName}</span> 
              <span className="text-slate-500">({event.approverTitle})</span>
            </p>
            {event.notes && (
              <div className="mt-2 flex">
                <CornerDownRight className="h-3 w-3 text-slate-400 mr-1 flex-shrink-0 mt-1" />
                <p className="text-sm text-slate-600">{event.notes}</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Future approvals */}
      {currentLevel && currentLevel > 0 && (
        <div className="relative flex items-start gap-4 pb-2 opacity-50">
          <div className="mt-1 h-6 w-6 flex-none rounded-full bg-white border border-dashed border-gray-300 flex items-center justify-center">
            <CircleDashed className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-slate-700">Next: {getApprovalLevelName(currentLevel + 1)}</p>
            <p className="mt-1 text-xs text-slate-500">Pending previous approval</p>
          </div>
        </div>
      )}
    </div>
  );
}
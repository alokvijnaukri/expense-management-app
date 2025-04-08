import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/lib/utils";
import { ClaimStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { textColor, bgColor } = getStatusColor(status);
  
  // Map the status to a more readable form
  let displayStatus = "";
  switch (status) {
    case ClaimStatus.DRAFT:
      displayStatus = "Draft";
      break;
    case ClaimStatus.SUBMITTED:
      displayStatus = "Pending";
      break;
    case ClaimStatus.APPROVED:
      displayStatus = "Approved";
      break;
    case ClaimStatus.REJECTED:
      displayStatus = "Rejected";
      break;
    case ClaimStatus.PROCESSING:
      displayStatus = "Processing";
      break;
    case ClaimStatus.PAID:
      displayStatus = "Paid";
      break;
    default:
      displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <Badge className={`${bgColor} ${textColor} font-medium`}>
      {displayStatus}
    </Badge>
  );
}
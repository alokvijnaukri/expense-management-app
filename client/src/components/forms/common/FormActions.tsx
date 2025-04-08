import React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FormActionsProps {
  onCancel: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  draftDisabled?: boolean;
  submitDisabled?: boolean;
  showConfirmDialog?: boolean;
}

export default function FormActions({
  onCancel,
  onSaveDraft,
  onSubmit,
  draftDisabled = false,
  submitDisabled = false,
  showConfirmDialog = true,
}: FormActionsProps) {
  const [showDialog, setShowDialog] = React.useState(false);

  const handleSubmitClick = () => {
    if (showConfirmDialog) {
      setShowDialog(true);
    } else {
      onSubmit();
    }
  };

  return (
    <>
      <div className="pt-6 border-t border-neutral-200 flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onSaveDraft}
          disabled={draftDisabled}
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={handleSubmitClick}
          disabled={submitDisabled}
        >
          Submit Claim
        </Button>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Once submitted, this claim will be sent for approval and cannot be edited.
              Are you sure you want to submit this claim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onSubmit}>
              Submit Claim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

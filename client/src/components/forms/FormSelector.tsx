import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { X } from "lucide-react";

interface FormSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormSelector({ open, onOpenChange }: FormSelectorProps) {
  const [_, navigate] = useLocation();

  const formTypes = [
    {
      id: "travel",
      icon: "ri-plane-line",
      title: "Travel Expense",
      description: "For business travel related expenses",
    },
    {
      id: "business_promotion",
      icon: "ri-gift-line",
      title: "Business Promotion",
      description: "For client meetings and events",
    },
    {
      id: "conveyance",
      icon: "ri-taxi-line",
      title: "Conveyance Claim",
      description: "For local travel and transport",
    },
    {
      id: "mobile_bill",
      icon: "ri-smartphone-line",
      title: "Mobile Bill Reimbursement",
      description: "For official mobile expenses",
    },
    {
      id: "relocation",
      icon: "ri-home-move-line",
      title: "Relocation Expense",
      description: "For relocation related costs",
    },
    {
      id: "other",
      icon: "ri-file-list-3-line",
      title: "Other Claims",
      description: "For miscellaneous expenses",
    },
  ];

  const handleSelectForm = (formType: string) => {
    navigate(`/new-claim/${formType}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Claim Type</DialogTitle>
          <DialogDescription>
            Choose the type of expense claim you want to create
          </DialogDescription>
        </DialogHeader>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <div className="grid grid-cols-1 gap-4 py-4">
          {formTypes.map((form) => (
            <button
              key={form.id}
              onClick={() => handleSelectForm(form.id)}
              className="text-left bg-white border border-neutral-200 p-4 rounded-lg hover:border-primary hover:shadow-md transition duration-150"
            >
              <div className="flex items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-lg mr-4">
                  <i className={`${form.icon} text-xl text-primary`}></i>
                </div>
                <div>
                  <h4 className="font-medium text-neutral-700">{form.title}</h4>
                  <p className="text-sm text-neutral-500">{form.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

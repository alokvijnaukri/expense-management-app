import React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ClaimTypes, getClaimTypeName } from "@/lib/utils";

interface ExpenseTypeFilterProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
}

export default function ExpenseTypeFilter({ selectedType, onTypeChange }: ExpenseTypeFilterProps) {
  const [open, setOpen] = React.useState(false);

  const expenseTypes = [
    { value: ClaimTypes.TRAVEL, label: getClaimTypeName(ClaimTypes.TRAVEL) },
    { value: ClaimTypes.BUSINESS_PROMOTION, label: getClaimTypeName(ClaimTypes.BUSINESS_PROMOTION) },
    { value: ClaimTypes.CONVEYANCE, label: getClaimTypeName(ClaimTypes.CONVEYANCE) },
    { value: ClaimTypes.MOBILE_BILL, label: getClaimTypeName(ClaimTypes.MOBILE_BILL) },
    { value: ClaimTypes.RELOCATION, label: getClaimTypeName(ClaimTypes.RELOCATION) },
    { value: ClaimTypes.OTHER, label: getClaimTypeName(ClaimTypes.OTHER) },
  ];

  // Get the display name for the selected type
  const selectedTypeDisplay = selectedType 
    ? expenseTypes.find(type => type.value === selectedType)?.label 
    : "All Expense Types";

  return (
    <div className="w-[240px]">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between border-border/50 bg-card/50 hover:bg-card/80"
          >
            {selectedTypeDisplay}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandInput placeholder="Search expense type..." />
            <CommandEmpty>No expense type found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onTypeChange(null);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !selectedType ? "opacity-100" : "opacity-0"
                  )}
                />
                All Expense Types
              </CommandItem>
              {expenseTypes.map((type) => (
                <CommandItem
                  key={type.value}
                  onSelect={() => {
                    onTypeChange(type.value);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedType === type.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {type.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
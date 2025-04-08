import React, { useState } from "react";
import { useRoute } from "wouter";
import { FormSelector } from "@/components/forms/FormSelector";
import TravelExpenseForm from "@/components/forms/TravelExpenseForm";
import BusinessPromotionForm from "@/components/forms/BusinessPromotionForm";
import ConveyanceClaimForm from "@/components/forms/ConveyanceClaimForm";
import MobileBillForm from "@/components/forms/MobileBillForm";
import RelocationExpenseForm from "@/components/forms/RelocationExpenseForm";
import OtherClaimsForm from "@/components/forms/OtherClaimsForm";

export default function NewClaim() {
  const [showFormSelector, setShowFormSelector] = useState(false);
  const [match, params] = useRoute("/new-claim/:type");
  
  // Show form selector if no form type is selected
  React.useEffect(() => {
    if (!match) {
      setShowFormSelector(true);
    }
  }, [match]);

  // Determine which form to render based on the route parameter
  const renderForm = () => {
    if (!match || !params?.type) {
      return null;
    }

    switch (params.type) {
      case "travel":
        return <TravelExpenseForm />;
      case "business_promotion":
        return <BusinessPromotionForm />;
      case "conveyance":
        return <ConveyanceClaimForm />;
      case "mobile_bill":
        return <MobileBillForm />;
      case "relocation":
        return <RelocationExpenseForm />;
      case "other":
        return <OtherClaimsForm />;
      default:
        // Show form selector if invalid type
        setShowFormSelector(true);
        return null;
    }
  };

  return (
    <>
      <FormSelector 
        open={showFormSelector} 
        onOpenChange={setShowFormSelector} 
      />
      {renderForm()}
    </>
  );
}

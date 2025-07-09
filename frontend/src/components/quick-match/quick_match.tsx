import React from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { toast } from "sonner";

const QuickMatch = () => {
  const handleClick = () => {
    toast.error("Quick Match unavailable", {
      description: "This feature is not yet implemented. Stay tuned!",
    });
  };
  return (
    <>
      <Button
        variant="default"
        size="lg"
        onClick={handleClick}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-secondary shadow-lg transition-all border border-emerald-400/20"
      >
        <Zap className="mr-2 h-4 w-4" />
        Quick Match
      </Button>
    </>
  );
};

export default QuickMatch;

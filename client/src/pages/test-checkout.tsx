import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TestCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-checkout-session", { plan: "pro" });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Checkout session created:", data);
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Success",
          description: "Checkout session created successfully!",
        });
      }
    },
    onError: (error: any) => {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleTestCheckout = () => {
    setIsLoading(true);
    createCheckoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Stripe Checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Test your Stripe integration by creating a checkout session
          </p>
          <Button 
            onClick={handleTestCheckout}
            disabled={isLoading || createCheckoutMutation.isPending}
            className="w-full"
          >
            {isLoading || createCheckoutMutation.isPending ? "Creating..." : "Test Checkout"}
          </Button>
          
          {createCheckoutMutation.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              Error: {(createCheckoutMutation.error as any)?.message || "Unknown error"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
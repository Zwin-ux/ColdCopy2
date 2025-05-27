import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Success() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  // Fetch updated subscription status
  const { data: subscription, refetch } = useQuery({
    queryKey: ['/api/user/subscription'],
  });

  useEffect(() => {
    // Refetch subscription data when the component mounts
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-primary">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Thank you for upgrading to {subscription?.plan || 'Pro'}! Your subscription is now active and you have access to all the features.
          </p>
          
          {subscription && (
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <div className="flex justify-between items-center mb-2">
                <span>Plan:</span>
                <span className="font-semibold capitalize">{subscription.plan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Monthly Messages:</span>
                <span className="font-semibold">{subscription.messagesLimit}</span>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/'}
            >
              Start Creating Messages
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/pricing'}
            >
              View Subscription Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Cancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl text-primary">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            No worries! Your payment was cancelled and no charges were made. You can always upgrade later when you're ready.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="text-foreground">
              Your free plan is still active with 10 messages per month. 
              Upgrade anytime to unlock more features and higher limits.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/'}
            >
              Continue with Free Plan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/pricing'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pricing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
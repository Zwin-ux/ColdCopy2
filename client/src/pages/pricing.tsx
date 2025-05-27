import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Crown, Zap, Users, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SUBSCRIPTION_PLANS } from "@shared/schema";

interface SubscriptionStatus {
  plan: string;
  subscriptionStatus: string;
  messagesUsed: number;
  messagesLimit: number;
  messagesRemaining: number;
  currentPeriodEnd: string | null;
}

export default function Pricing() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch current subscription status
  const { data: subscription, refetch } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription'],
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", "/api/create-checkout-session", { plan });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(null);
    }
  });

  const handleUpgrade = (plan: string) => {
    setIsLoading(plan);
    createCheckoutMutation.mutate(plan);
  };

  const getUsagePercentage = () => {
    if (!subscription) return 0;
    return (subscription.messagesUsed / subscription.messagesLimit) * 100;
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const currentPlan = subscription?.plan || 'free';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-primary">ColdCopy</h1>
            </a>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Back to App
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Current Usage Display */}
        {subscription && (
          <div className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Your Current Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">Current Plan</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getUsageColor()}`}>
                      {subscription.messagesUsed} / {subscription.messagesLimit}
                    </div>
                    <div className="text-sm text-muted-foreground">Messages Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {subscription.messagesRemaining}
                    </div>
                    <div className="text-sm text-muted-foreground">Messages Remaining</div>
                  </div>
                </div>
                {/* Usage Bar */}
                <div className="mt-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getUsagePercentage() >= 90 ? 'bg-red-500' :
                        getUsagePercentage() >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getUsagePercentage().toFixed(1)}% of monthly limit used
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Choose Your Perfect Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Scale your outreach with AI-powered personalization. Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Free Plan */}
          <Card className={`relative ${currentPlan === 'free' ? 'ring-2 ring-primary' : ''}`}>
            {currentPlan === 'free' && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Current Plan
              </Badge>
            )}
            <CardHeader className="text-center pb-8">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">{SUBSCRIPTION_PLANS.trial.name}</CardTitle>
              <div className="text-4xl font-bold text-primary">
                ${SUBSCRIPTION_PLANS.trial.price}
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {SUBSCRIPTION_PLANS.trial.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                variant={currentPlan === 'free' ? 'secondary' : 'outline'}
                disabled={currentPlan === 'free'}
              >
                {currentPlan === 'free' ? 'Current Plan' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={`relative ${currentPlan === 'pro' ? 'ring-2 ring-primary' : ''}`}>
            {currentPlan === 'pro' && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Current Plan
              </Badge>
            )}
            {currentPlan !== 'pro' && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-secondary">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center pb-8">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="text-2xl">{SUBSCRIPTION_PLANS.pro.name}</CardTitle>
              <div className="text-4xl font-bold text-primary">
                ${SUBSCRIPTION_PLANS.pro.price}
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {SUBSCRIPTION_PLANS.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                variant={currentPlan === 'pro' ? 'secondary' : 'default'}
                disabled={currentPlan === 'pro' || isLoading === 'pro'}
                onClick={() => handleUpgrade('pro')}
              >
                {isLoading === 'pro' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : currentPlan === 'pro' ? (
                  'Current Plan'
                ) : (
                  <>
                    Upgrade to Pro
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Agency Plan */}
          <Card className={`relative ${currentPlan === 'agency' ? 'ring-2 ring-primary' : ''}`}>
            {currentPlan === 'agency' && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Current Plan
              </Badge>
            )}
            <CardHeader className="text-center pb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">{SUBSCRIPTION_PLANS.agency.name}</CardTitle>
              <div className="text-4xl font-bold text-primary">
                ${SUBSCRIPTION_PLANS.agency.price}
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {SUBSCRIPTION_PLANS.agency.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                variant={currentPlan === 'agency' ? 'secondary' : 'default'}
                disabled={currentPlan === 'agency' || isLoading === 'agency'}
                onClick={() => handleUpgrade('agency')}
              >
                {isLoading === 'agency' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : currentPlan === 'agency' ? (
                  'Current Plan'
                ) : (
                  <>
                    Upgrade to Agency
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-primary mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-2">Can I change my plan anytime?</h4>
                <p className="text-muted-foreground text-sm">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, 
                  or at the end of your current billing period for downgrades.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-2">What happens if I exceed my message limit?</h4>
                <p className="text-muted-foreground text-sm">
                  You'll be prompted to upgrade to a higher plan to continue generating messages. 
                  Your account won't be charged automatically - you have full control.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-2">Do unused messages roll over?</h4>
                <p className="text-muted-foreground text-sm">
                  Messages reset at the beginning of each billing cycle and don't roll over. 
                  This ensures you always have fresh usage limits each month.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
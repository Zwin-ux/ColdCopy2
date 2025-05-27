import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  MessageSquare, 
  Crown, 
  ArrowRight,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/app-layout";

interface SubscriptionStatus {
  plan: string;
  subscriptionStatus: string;
  messagesUsed: number;
  messagesLimit: number;
  messagesRemaining: number;
  currentPeriodEnd: string | null;
}

interface User {
  id: number;
  username: string;
  email: string;
}

export default function Dashboard() {
  // Fetch current user
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch current subscription status
  const { data: subscription } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription'],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {user?.username}!
          </h1>
          <p className="text-muted-foreground">
            Ready to create personalized outreach messages that get responses?
          </p>
        </div>

        {/* Quick Actions - Only Working Routes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Generate Message</h3>
                    <p className="text-sm text-muted-foreground">
                      Create personalized outreach
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pricing">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Crown className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">View Plans</h3>
                    <p className="text-sm text-muted-foreground">
                      $5/mo for 500 messages
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Overview - Only Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Used</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscription?.messagesUsed || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                of {subscription?.messagesLimit || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {subscription?.plan || "Trial"}
              </div>
              <p className="text-xs text-muted-foreground">
                {subscription?.messagesRemaining || 0} messages remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Progress */}
        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Monthly Usage</span>
                <Badge variant={subscription.plan === "pro" ? "default" : "secondary"}>
                  {subscription.plan === "trial" ? "Free Trial" : "Pro Plan"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Messages Generated</span>
                  <span>{subscription.messagesUsed} / {subscription.messagesLimit}</span>
                </div>
                <Progress 
                  value={(subscription.messagesUsed / subscription.messagesLimit) * 100} 
                  className="w-full"
                />
              </div>
              
              {subscription.plan === "trial" && subscription.messagesRemaining <= 0 && (
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium text-yellow-800">Trial limit reached</p>
                    <p className="text-sm text-yellow-600">
                      Upgrade to Pro for unlimited AI-powered messages
                    </p>
                  </div>
                  <Link href="/pricing">
                    <Button>
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              )}

              {subscription.plan === "trial" && subscription.messagesRemaining > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-blue-800">
                      {subscription.messagesRemaining} messages remaining
                    </p>
                    <p className="text-sm text-blue-600">
                      Try our AI before upgrading to unlimited access
                    </p>
                  </div>
                  <Link href="/generate">
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Message
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Simple CTA */}
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Ready to create your message?</h3>
            <p className="text-muted-foreground mb-6">
              Add a LinkedIn profile or bio text to get started
            </p>
            <Link href="/">
              <Button size="lg">
                <MessageSquare className="w-4 h-4 mr-2" />
                Create Message
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
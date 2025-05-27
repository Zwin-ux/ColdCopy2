import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Crown, 
  Zap, 
  ArrowRight,
  BarChart3,
  Calendar,
  Target,
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/generate">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Generate Message</h3>
                    <p className="text-sm text-muted-foreground">
                      Create AI-powered outreach
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
                    <h3 className="font-semibold">Upgrade Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      Unlock unlimited messages
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/help">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Learn Tips</h3>
                    <p className="text-sm text-muted-foreground">
                      Improve response rates
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                {subscription?.plan === "pro" ? "Unlimited messages" : "Limited access"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">
                avg personalization score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">60%</div>
              <p className="text-xs text-muted-foreground">
                estimated response rate
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

        {/* Getting Started Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started with ColdCopy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h4 className="font-medium">Add LinkedIn Profile</h4>
                <p className="text-sm text-muted-foreground">
                  Paste a LinkedIn URL or bio text to analyze
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h4 className="font-medium">AI Personalization</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI creates personalized outreach messages
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h4 className="font-medium">Get Responses</h4>
                <p className="text-sm text-muted-foreground">
                  Send and watch your response rates soar
                </p>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Link href="/generate">
                <Button size="lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Create Your First Message
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
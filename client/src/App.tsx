import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home-clean";
import Dashboard from "@/pages/dashboard";
import Auth from "@/pages/auth";
import Pricing from "@/pages/pricing";
import Checkout from "@/pages/checkout";
import Success from "@/pages/success";
import Cancel from "@/pages/cancel";
import NotFound from "@/pages/not-found";

function Router() {
  // Check if user is authenticated
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  const isAuthenticated = !!user;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Dashboard : Home} />
      <Route path="/dashboard" component={isAuthenticated ? Dashboard : Auth} />
      <Route path="/auth" component={Auth} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/success" component={Success} />
      <Route path="/cancel" component={Cancel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

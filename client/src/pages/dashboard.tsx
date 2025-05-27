import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Link2, Brain, Copy, Users, Zap, Crown, Star, Menu, User, LogOut, CreditCard, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/file-upload";
import { OrigamiError } from "@/components/origami-error";
import { generateMessage, copyToClipboard, type GenerateMessageResponse } from "@/lib/api";
import { apiRequest, queryClient } from "@/lib/queryClient";
import mascotImage from "@assets/ChatGPT Image May 26, 2025, 07_58_42 PM.png";

const formSchema = z.object({
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  bioText: z.string().max(500, "Bio text must be 500 characters or less").optional(),
});

type FormData = z.infer<typeof formSchema>;

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<GenerateMessageResponse | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch current user
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch current subscription status
  const { data: subscription, refetch: refetchSubscription } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription'],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      linkedinUrl: "",
      bioText: "",
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/logout"),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateMessage,
    onSuccess: (data) => {
      setGeneratedMessage(data);
      setLastError(null);
      refetchSubscription();
      toast({
        title: "Message Generated Successfully!",
        description: `Personalization score: ${data.personalizationScore}% | Estimated response rate: ${data.estimatedResponseRate}%`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to generate message";
      setLastError(errorMessage);
      setGeneratedMessage(null);
      
      if (error?.requiresUpgrade) {
        toast({
          title: "Upgrade Required",
          description: "You've reached your message limit. Upgrade to Pro for unlimited messages!",
          variant: "destructive",
        });
      } else if (error?.requiresLogin) {
        toast({
          title: "Account Required",
          description: "Please create an account to generate more messages.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Generation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: FormData) => {
    if (!data.linkedinUrl && !data.bioText) {
      toast({
        title: "Input Required",
        description: "Please provide either a LinkedIn URL or bio text.",
        variant: "destructive",
      });
      return;
    }

    const requestData = {
      linkedinUrl: data.linkedinUrl,
      bioText: data.bioText,
      resume: selectedFile || undefined,
    };

    generateMutation.mutate(requestData);
  };

  const handleCopy = async () => {
    if (generatedMessage) {
      await copyToClipboard(generatedMessage.message);
      toast({
        title: "Copied to Clipboard",
        description: "Message copied successfully!",
      });
    }
  };

  const handleUpgrade = () => {
    window.location.href = "/checkout";
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={mascotImage} alt="ColdCopy" className="w-8 h-8 rounded-lg" />
              <h1 className="text-xl font-bold text-primary">ColdCopy</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {subscription && (
                <div className="flex items-center space-x-2">
                  <Badge variant={subscription.plan === "pro" ? "default" : "secondary"}>
                    {subscription.plan === "trial" ? "Free Trial" : "Pro"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {subscription.messagesRemaining} messages left
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{user?.username}</span>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <span>Generate Personalized Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="linkedinUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Link2 className="w-4 h-4" />
                              <span>LinkedIn Profile URL</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://www.linkedin.com/in/..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bioText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>Bio/Company Description</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about the person or company..."
                                className="min-h-[100px]"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setCharCount(e.target.value.length);
                                }}
                              />
                            </FormControl>
                            <div className="flex justify-between items-center">
                              <FormMessage />
                              <span className="text-xs text-muted-foreground">
                                {charCount}/500
                              </span>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Your Resume (Optional)
                      </label>
                      <FileUpload
                        onFileSelect={setSelectedFile}
                        selectedFile={selectedFile}
                        className="w-full"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full"
                      disabled={generateMutation.isPending}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {generateMutation.isPending ? "Generating..." : "Generate Message"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Error Display */}
            {lastError && (
              <OrigamiError 
                error={lastError}
                onRetry={() => form.handleSubmit(onSubmit)()}
                onUpgrade={subscription?.plan === "trial" ? handleUpgrade : undefined}
                type={lastError.includes("limit") ? "quota" : "generation"}
              />
            )}

            {/* Generated Message */}
            {generatedMessage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                      <span>Generated Message</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {generatedMessage.personalizationScore}% personalized
                      </Badge>
                      <Badge variant="secondary">
                        {generatedMessage.estimatedResponseRate}% response rate
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {generatedMessage.message}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {generatedMessage.wordCount} words
                    </div>
                    <Button onClick={handleCopy} variant="outline">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Status */}
            {subscription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="w-5 h-5" />
                    <span>Your Plan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Plan</span>
                    <Badge variant={subscription.plan === "pro" ? "default" : "secondary"}>
                      {subscription.plan === "trial" ? "Free Trial" : "Pro"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Messages Used</span>
                      <span>{subscription.messagesUsed} / {subscription.messagesLimit}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((subscription.messagesUsed / subscription.messagesLimit) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {subscription.messagesRemaining} messages remaining
                    </p>
                  </div>

                  {subscription.plan === "trial" && subscription.messagesRemaining <= 0 && (
                    <Button onClick={handleUpgrade} className="w-full">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro - $5/month
                    </Button>
                  )}

                  {subscription.plan === "trial" && subscription.messagesRemaining > 0 && (
                    <Button onClick={handleUpgrade} variant="outline" className="w-full">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro for Unlimited
                    </Button>
                  )}

                  {subscription.plan === "pro" && (
                    <div className="text-center">
                      <Badge variant="default" className="mb-2">Pro Member</Badge>
                      <p className="text-xs text-muted-foreground">
                        Unlimited messages included
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5" />
                  <span>Pro Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <p className="font-medium">📈 Higher Response Rates:</p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>• Include specific details from their profile</li>
                    <li>• Upload your resume for better personalization</li>
                    <li>• Mention mutual connections when possible</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="font-medium">🎯 Best Practices:</p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>• Keep messages under 150 words</li>
                    <li>• Always include a clear call-to-action</li>
                    <li>• Follow up professionally if no response</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
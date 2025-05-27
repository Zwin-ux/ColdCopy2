import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link2, Brain, Copy, Users, Zap, Crown, Star, MessageSquare } from "lucide-react";
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
import { queryClient } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-layout";

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

// Helper functions for message analysis
const getComplexityScore = (text: string): { score: number; label: string; color: string } => {
  if (!text.trim()) return { score: 0, label: "Empty", color: "text-gray-400" };
  
  const words = text.trim().split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = sentences > 0 ? words / sentences : words;
  const hasPersonalization = /\[|\{|specific|company|role|experience/i.test(text);
  
  let score = 0;
  
  // Length scoring
  if (words >= 30 && words <= 100) score += 3;
  else if (words >= 15 && words <= 150) score += 2;
  else if (words >= 5) score += 1;
  
  // Sentence structure
  if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 20) score += 2;
  else if (avgWordsPerSentence >= 5) score += 1;
  
  // Personalization indicators
  if (hasPersonalization) score += 2;
  
  // Professional tone indicators
  if (/collaborate|discuss|connect|opportunity|experience|background/i.test(text)) score += 1;
  
  const maxScore = 8;
  const percentage = (score / maxScore) * 100;
  
  if (percentage >= 75) return { score: percentage, label: "Excellent", color: "text-green-600" };
  if (percentage >= 50) return { score: percentage, label: "Good", color: "text-blue-600" };
  if (percentage >= 25) return { score: percentage, label: "Fair", color: "text-yellow-600" };
  return { score: percentage, label: "Needs Work", color: "text-red-600" };
};

const getCharCountColor = (count: number, max: number): string => {
  const percentage = (count / max) * 100;
  if (percentage >= 90) return "text-red-600";
  if (percentage >= 75) return "text-yellow-600";
  return "text-gray-600";
};

export default function Generate() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<GenerateMessageResponse | null>(null);
  const [detectedInfo, setDetectedInfo] = useState<string | null>(null);
  const [bioCharCount, setBioCharCount] = useState(0);
  const [messageCharCount, setMessageCharCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const { toast } = useToast();

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

    // Show detection indicator if LinkedIn URL is provided
    if (data.linkedinUrl) {
      setDetectedInfo("🔍 Analyzing LinkedIn profile...");
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
    window.location.href = "/pricing";
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Generate Message</h1>
          <p className="text-muted-foreground">
            Create AI-powered personalized outreach messages that get responses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <span>Message Generation</span>
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
                                  setBioCharCount(e.target.value.length);
                                }}
                              />
                            </FormControl>
                            <div className="flex justify-between items-center">
                              <FormMessage />
                              <div className="flex items-center space-x-4 text-xs">
                                <span className={getCharCountColor(bioCharCount, 500)}>
                                  {bioCharCount}/500 chars
                                </span>
                                {bioCharCount > 0 && (
                                  <span className={getComplexityScore(field.value || "").color}>
                                    Quality: {getComplexityScore(field.value || "").label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Smart LinkedIn Detection Panel */}
                    {detectedInfo && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-blue-700">
                          <div className="animate-pulse">🔍</div>
                          <span className="text-sm font-medium">Smart Detection Active</span>
                        </div>
                        <p className="text-blue-600 text-sm mt-1">{detectedInfo}</p>
                      </div>
                    )}

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
                  
                  {/* Message Analysis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700">
                        {generatedMessage.message.length}
                      </div>
                      <div className="text-xs text-gray-500">Characters</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700">
                        {generatedMessage.wordCount}
                      </div>
                      <div className="text-xs text-gray-500">Words</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${getComplexityScore(generatedMessage.message).color}`}>
                        {Math.round(getComplexityScore(generatedMessage.message).score)}%
                      </div>
                      <div className="text-xs text-gray-500">Quality Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {generatedMessage.estimatedResponseRate}%
                      </div>
                      <div className="text-xs text-gray-500">Est. Response</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className={`text-sm ${getComplexityScore(generatedMessage.message).color}`}>
                      Message Quality: {getComplexityScore(generatedMessage.message).label}
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
            {/* Usage Status */}
            {subscription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="w-5 h-5" />
                    <span>Usage</span>
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
    </AppLayout>
  );
}
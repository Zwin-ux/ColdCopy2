import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Link2, Brain, Copy, Users, Zap, Crown, Star, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/file-upload";
import { OrigamiError } from "@/components/origami-error";
import { generateMessage, copyToClipboard, type GenerateMessageResponse } from "@/lib/api";
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

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<GenerateMessageResponse | null>(null);
  const [charCount, setCharCount] = useState(0);
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
      setLastError(null); // Clear any previous errors
      refetchSubscription(); // Refresh usage data
      toast({
        title: "Message Generated!",
        description: "Your personalized outreach message has been created.",
      });
    },
    onError: (error) => {
      setLastError(error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    if (!data.linkedinUrl && !data.bioText && !selectedFile) {
      toast({
        title: "Input Required",
        description: "Please provide at least a LinkedIn URL, bio text, or resume.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      linkedinUrl: data.linkedinUrl || undefined,
      bioText: data.bioText || undefined,
      resume: selectedFile || undefined,
    });
  };

  const handleCopy = async () => {
    if (generatedMessage) {
      try {
        await copyToClipboard(generatedMessage.message);
        toast({
          title: "Copied!",
          description: "Message copied to clipboard.",
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy message to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRegenerate = () => {
    const formData = form.getValues();
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-primary">ColdCopy</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-foreground hover:text-secondary transition-colors">Features</a>
              <a href="/pricing" className="text-sm font-medium text-foreground hover:text-secondary transition-colors">Pricing</a>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>Sign In</Button>
              <Button size="sm" onClick={() => window.location.href = '/pricing'}>Get Started</Button>
            </nav>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-card py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-primary leading-tight">
                AI-Powered Outreach Messages
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Transform LinkedIn profiles and bios into personalized outreach messages that get responses. Simple, fast, effective.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => window.location.href = '/pricing'}>Start Free</Button>
                <Button variant="outline" size="lg" onClick={() => window.location.href = '/pricing'}>View Pricing</Button>
              </div>
            </div>
            <div className="relative flex justify-center">
              <img 
                src={mascotImage} 
                alt="ColdCopy Mascot" 
                className="w-80 h-80 object-contain" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          {/* Subscription Status Widget */}
          {subscription && (
            <div className="mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {subscription.plan === 'free' && <Star className="w-5 h-5 text-muted-foreground" />}
                        {subscription.plan === 'pro' && <Zap className="w-5 h-5 text-secondary" />}
                        {subscription.plan === 'agency' && <Crown className="w-5 h-5 text-primary" />}
                        <span className="font-semibold capitalize">{subscription.plan} Plan</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.messagesUsed} / {subscription.messagesLimit} messages used
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {subscription.messagesRemaining} remaining
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {((subscription.messagesUsed / subscription.messagesLimit) * 100).toFixed(0)}% used
                        </div>
                      </div>
                      {subscription.plan === 'free' && subscription.messagesRemaining < 5 && (
                        <Button size="sm" onClick={() => window.location.href = '/pricing'}>
                          Upgrade Plan
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Usage Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          (subscription.messagesUsed / subscription.messagesLimit) >= 0.9 ? 'bg-red-500' :
                          (subscription.messagesUsed / subscription.messagesLimit) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((subscription.messagesUsed / subscription.messagesLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Generate Your Message</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Add a LinkedIn URL, bio text, or upload your resume to create personalized outreach messages
            </p>
          </div>

          {/* Input Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Input Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* LinkedIn URL Input */}
                    <FormField
                      control={form.control}
                      name="linkedinUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn Profile URL</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="https://linkedin.com/in/username" 
                                {...field}
                              />
                              <Link2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Paste the LinkedIn profile you want to reach out to
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Bio Text Input */}
                    <FormField
                      control={form.control}
                      name="bioText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio/Company Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Paste recruiter bio or company description here..."
                              rows={3}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setCharCount(e.target.value.length);
                              }}
                            />
                          </FormControl>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">
                              Additional context for better personalization
                            </p>
                            <span className={`text-xs ${charCount > 450 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                              {charCount}/500
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Resume Upload */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">Your Resume (Optional)</label>
                      <FileUpload 
                        onFileSelect={setSelectedFile}
                        selectedFile={selectedFile}
                      />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex justify-center">
                    <Button 
                      type="submit" 
                      size="lg" 
                      disabled={generateMutation.isPending}
                      className="px-8"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Generate Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Animated Error Section with Origami Bird */}
          {lastError && (
            <div className="mb-8">
              <OrigamiError
                error={lastError}
                onRetry={handleRegenerate}
                onUpgrade={() => window.location.href = '/pricing'}
                type={
                  lastError.includes('limit') || lastError.includes('quota') ? 'quota' :
                  lastError.includes('OpenAI') || lastError.includes('generate') ? 'generation' :
                  'general'
                }
              />
            </div>
          )}

          {/* Output Section */}
          {generatedMessage && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Message</CardTitle>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={generateMutation.isPending}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleCopy}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Message
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Message Output */}
                <div className="bg-muted/50 border border-border rounded-lg p-6 mb-6">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {generatedMessage.message}
                  </div>
                </div>

                {/* Message Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-secondary">{generatedMessage.wordCount}</div>
                    <div className="text-sm text-muted-foreground">Words</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{generatedMessage.personalizationScore}%</div>
                    <div className="text-sm text-muted-foreground">Personalization</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{generatedMessage.estimatedResponseRate}%</div>
                    <div className="text-sm text-muted-foreground">Est. Response Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Simple Features */}
      <section className="py-16 bg-card" id="features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Simple. Fast. Effective.</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">LinkedIn Analysis</h4>
              <p className="text-muted-foreground">Extract key insights from profiles</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-secondary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">AI Personalization</h4>
              <p className="text-muted-foreground">Generate tailored messages</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Copy className="w-6 h-6 text-secondary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">One-Click Copy</h4>
              <p className="text-muted-foreground">Ready to paste anywhere</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
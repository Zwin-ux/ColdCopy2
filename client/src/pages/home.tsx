import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Link2, Brain, Copy, FileText, Users, Zap, Check, Star, ArrowRight, Menu, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/file-upload";
import { generateMessage, copyToClipboard, type GenerateMessageResponse } from "@/lib/api";

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
      refetchSubscription(); // Refresh usage data
      toast({
        title: "Message Generated!",
        description: "Your personalized outreach message has been created.",
      });
    },
    onError: (error) => {
      if (error.message.includes('reached your') && error.message.includes('message limit')) {
        toast({
          title: "Usage Limit Reached",
          description: error.message,
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/pricing'}>
              Upgrade Plan
            </Button>
          ),
        });
      } else {
        toast({
          title: "Generation Failed",
          description: error.message,
          variant: "destructive",
        });
      }
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
              <Button variant="outline" size="sm">Sign In</Button>
              <Button size="sm" onClick={() => window.location.href = '/pricing'}>Get Started</Button>
            </nav>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-card py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl font-bold text-primary leading-tight">
                  Create Perfect Outreach Messages with AI
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Analyze LinkedIn profiles, recruiter bios, and resumes to generate personalized, high-converting outreach messages in seconds.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg">Start Free Trial</Button>
                <Button variant="outline" size="lg">Watch Demo</Button>
              </div>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Setup in 2 minutes</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Professional team collaborating on networking strategy" 
                className="rounded-xl shadow-2xl w-full h-auto" 
              />
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-lg shadow-lg border border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-foreground">AI generating message...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-6">
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
            <h3 className="text-3xl font-bold text-primary mb-4">Transform Your Outreach Process</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI analyzes profiles and generates personalized messages that get responses
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
                          Generate Personalized Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

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
                      <ArrowRight className="w-4 h-4 mr-2" />
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

      {/* Features Section */}
      <section className="py-16 bg-card" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Powerful Features for Better Outreach</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create compelling, personalized messages that get responses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-3">LinkedIn Profile Analysis</h4>
                <p className="text-muted-foreground leading-relaxed">
                  AI analyzes LinkedIn profiles to extract key insights, experience, and interests for highly targeted messaging.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-3">AI-Powered Personalization</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Advanced AI creates unique, personalized messages based on recipient's background and your objectives.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Copy className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-3">One-Click Copy</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Generated messages are instantly ready to copy and paste into your preferred outreach platform.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-3">Resume Integration</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Upload your resume to help AI understand your background and create more relevant messaging.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-3">Company Context</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Include company descriptions and recruiter bios for enhanced context and better personalization.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <ArrowRight className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-3">Response Rate Optimization</h4>
                <p className="text-muted-foreground leading-relaxed">
                  AI optimizes message structure and tone to maximize response rates based on proven patterns.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-background" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Simple, Transparent Pricing</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your outreach needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-semibold text-foreground mb-2">Free</h4>
                  <div className="text-3xl font-bold text-foreground mb-1">$0</div>
                  <p className="text-muted-foreground">per month</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">5 messages per month</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">LinkedIn profile analysis</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Basic personalization</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Copy to clipboard</span>
                  </li>
                  <li className="flex items-center space-x-3 opacity-50">
                    <X className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Resume integration</span>
                  </li>
                  <li className="flex items-center space-x-3 opacity-50">
                    <X className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Advanced AI features</span>
                  </li>
                </ul>
                
                <Button variant="outline" className="w-full">Get Started Free</Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-secondary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-secondary text-white">Most Popular</Badge>
              </div>
              
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-semibold text-foreground mb-2">Pro</h4>
                  <div className="text-3xl font-bold text-foreground mb-1">$29</div>
                  <p className="text-muted-foreground">per month</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Unlimited messages</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Advanced LinkedIn analysis</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Resume integration</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Company context analysis</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Advanced AI personalization</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Priority support</span>
                  </li>
                </ul>
                
                <Button className="w-full">Start Pro Trial</Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              All plans include a 7-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-primary mb-4">Trusted by Professionals Worldwide</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "ColdCopy has transformed my networking approach. The AI-generated messages feel authentic and personal, resulting in a 3x higher response rate."
                </p>
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
                    alt="Michael Chen" 
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                  <div>
                    <div className="font-medium text-foreground">Michael Chen</div>
                    <div className="text-sm text-muted-foreground">Product Manager, TechStartup</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "As a recruiter, ColdCopy helps me craft compelling messages that candidates actually want to respond to. It's become an essential part of my workflow."
                </p>
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b577?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
                    alt="Sarah Williams" 
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                  <div>
                    <div className="font-medium text-foreground">Sarah Williams</div>
                    <div className="text-sm text-muted-foreground">Senior Recruiter, GlobalTech</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "The time I save with ColdCopy is incredible. What used to take me 30 minutes per message now takes 2 minutes, and the quality is consistently better."
                </p>
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
                    alt="David Rodriguez" 
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                  <div>
                    <div className="font-medium text-foreground">David Rodriguez</div>
                    <div className="text-sm text-muted-foreground">Sales Director, Enterprise Corp</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Outreach?
          </h3>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of professionals using ColdCopy to create better connections and get more responses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">Start Free Trial</Button>
            <Button size="lg" variant="outline" className="border-blue-200 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-blue-200 mt-4">
            No credit card required • Setup in 2 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-primary">ColdCopy</h3>
              </div>
              <p className="text-muted-foreground">
                AI-powered outreach messages that get responses.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Features</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">API</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Chrome Extension</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 ColdCopy. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

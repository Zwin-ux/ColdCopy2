import { 
  HelpCircle, 
  MessageSquare, 
  Target, 
  Zap, 
  Crown, 
  Mail, 
  ExternalLink,
  BookOpen,
  Video,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/app-layout";

const faqs = [
  {
    question: "How does ColdCopy generate personalized messages?",
    answer: "ColdCopy uses advanced AI to analyze LinkedIn profiles, company information, and your background to create highly personalized outreach messages that resonate with your target audience."
  },
  {
    question: "What's the difference between Free Trial and Pro?",
    answer: "Free Trial gives you 2 messages to test our AI. Pro plan ($5/month) provides unlimited message generation, priority support, and access to advanced features."
  },
  {
    question: "How can I improve my response rates?",
    answer: "Include specific details from their profile, upload your resume for better personalization, mention mutual connections, keep messages under 150 words, and always include a clear call-to-action."
  },
  {
    question: "Can I upload my resume for better personalization?",
    answer: "Yes! Uploading your resume helps our AI understand your background and create more relevant, personalized messages that highlight your relevant experience."
  },
  {
    question: "What file formats do you support for resumes?",
    answer: "We support PDF, DOC, and DOCX formats. Make sure your resume is well-formatted and contains relevant information about your experience and skills."
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel your subscription anytime from your billing settings. Your access will continue until the end of your current billing period."
  }
];

const tips = [
  {
    icon: Target,
    title: "Be Specific",
    description: "Reference specific details from their LinkedIn profile or recent company news",
    color: "bg-blue-100 text-blue-600"
  },
  {
    icon: MessageSquare,
    title: "Keep It Concise",
    description: "Aim for 100-150 words to maintain reader engagement",
    color: "bg-green-100 text-green-600"
  },
  {
    icon: Zap,
    title: "Strong Call-to-Action",
    description: "End with a clear, specific request for next steps",
    color: "bg-purple-100 text-purple-600"
  },
  {
    icon: Crown,
    title: "Add Value",
    description: "Mention how you can help solve their specific challenges",
    color: "bg-yellow-100 text-yellow-600"
  }
];

export default function Help() {
  return (
    <AppLayout>
      <div className="p-6 space-y-8 max-w-4xl">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground">
            Everything you need to know about ColdCopy and creating effective outreach messages
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Video Tutorials</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Watch step-by-step guides
              </p>
              <Button variant="outline" size="sm">
                Watch Now <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get instant help from our team
              </p>
              <Button variant="outline" size="sm">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Detailed help via email
              </p>
              <Button variant="outline" size="sm">
                Contact Us
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pro Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Pro Tips for Better Response Rates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tips.map((tip, index) => {
                const Icon = tip.icon;
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${tip.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground">{tip.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5" />
              <span>Frequently Asked Questions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h4 className="font-semibold mb-2">{faq.question}</h4>
                <p className="text-sm text-muted-foreground mb-4">{faq.answer}</p>
                {index < faqs.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Getting Started Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Getting Started Guide</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Add Target Information</h4>
                <p className="text-sm text-muted-foreground">
                  Paste a LinkedIn profile URL or enter bio/company information about your target
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Upload Your Resume</h4>
                <p className="text-sm text-muted-foreground">
                  Optionally upload your resume for better personalization and relevant highlights
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Generate & Send</h4>
                <p className="text-sm text-muted-foreground">
                  Generate your personalized message, review it, and send to get responses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Success Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">85%</div>
                <p className="text-sm text-muted-foreground">Average Personalization Score</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">60%</div>
                <p className="text-sm text-muted-foreground">Estimated Response Rate</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">3x</div>
                <p className="text-sm text-muted-foreground">Better Than Generic Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? Our support team is here to help you succeed with personalized outreach.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button>
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Live Chat
              </Button>
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
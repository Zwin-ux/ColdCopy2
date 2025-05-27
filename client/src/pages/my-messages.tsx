import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  MessageSquare, 
  Copy, 
  ExternalLink, 
  Calendar,
  TrendingUp,
  BarChart3,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/app-layout";
import { copyToClipboard } from "@/lib/api";

interface Message {
  id: number;
  generatedMessage: string;
  linkedinUrl?: string;
  bioText?: string;
  personalizationScore?: number;
  wordCount?: number;
  estimatedResponseRate?: number;
  createdAt: string;
}

export default function MyMessages() {
  const { toast } = useToast();

  // Fetch user's messages
  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });

  const handleCopy = async (message: string) => {
    await copyToClipboard(message);
    toast({
      title: "Copied to Clipboard",
      description: "Message copied successfully!",
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Messages</h1>
            <p className="text-muted-foreground">
              View and manage your generated outreach messages
            </p>
          </div>
          <Link href="/generate">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Message
            </Button>
          </Link>
        </div>

        {/* Stats */}
        {messages && messages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{messages.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Personalization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    messages.reduce((acc, msg) => acc + (msg.personalizationScore || 0), 0) / messages.length
                  )}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    messages.reduce((acc, msg) => acc + (msg.estimatedResponseRate || 0), 0) / messages.length
                  )}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Messages List */}
        {!messages || messages.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground mb-4">
                Start creating personalized outreach messages to see them here
              </p>
              <Link href="/generate">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Message
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card key={message.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">
                        {message.linkedinUrl ? "LinkedIn Profile" : "Bio Text"}
                      </CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {message.personalizationScore && (
                        <Badge variant="secondary">
                          {message.personalizationScore}% personalized
                        </Badge>
                      )}
                      {message.estimatedResponseRate && (
                        <Badge variant="outline">
                          {message.estimatedResponseRate}% response rate
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Target Info */}
                  {message.linkedinUrl && (
                    <div className="text-sm text-muted-foreground">
                      <strong>LinkedIn:</strong> {message.linkedinUrl}
                    </div>
                  )}
                  {message.bioText && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Bio:</strong> {message.bioText.substring(0, 100)}...
                    </div>
                  )}

                  {/* Generated Message */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {message.generatedMessage}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                      </span>
                      {message.wordCount && (
                        <span>{message.wordCount} words</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopy(message.generatedMessage)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      {message.linkedinUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={message.linkedinUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Profile
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
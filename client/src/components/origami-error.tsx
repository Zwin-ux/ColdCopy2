import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import mascotImage from "@assets/ChatGPT Image May 26, 2025, 07_58_42 PM.png";

interface OrigamiErrorProps {
  error: string;
  onRetry?: () => void;
  onUpgrade?: () => void;
  type?: 'generation' | 'quota' | 'connection' | 'general';
}

const errorMessages = {
  generation: {
    title: "Oops! Message Generation Failed",
    description: "I tried my best to analyze the information, but something went wrong.",
    suggestion: "Let's try that again! Sometimes I just need a moment to gather my thoughts."
  },
  quota: {
    title: "You've Reached Your Message Limit!",
    description: "You've used all your messages for this month. I'm excited to help you create more!",
    suggestion: "Upgrade your plan to unlock unlimited personalized messages."
  },
  connection: {
    title: "Connection Issues",
    description: "I'm having trouble connecting to my AI brain right now.",
    suggestion: "Check your internet connection and let's try again."
  },
  general: {
    title: "Something Went Wrong",
    description: "I encountered an unexpected issue while trying to help you.",
    suggestion: "Don't worry, let's give it another try!"
  }
};

export function OrigamiError({ error, onRetry, onUpgrade, type = 'general' }: OrigamiErrorProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Determine error type based on error message content
  const errorType = 
    error.includes('limit') || error.includes('quota') ? 'quota' :
    error.includes('generate') || error.includes('OpenAI') ? 'generation' :
    error.includes('connection') || error.includes('network') ? 'connection' :
    type;

  const messageData = errorMessages[errorType];

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [error]);

  return (
    <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Animated Origami Bird */}
          <div className="relative">
            <div className={`transition-all duration-500 ${isAnimating ? 'animate-bounce' : ''}`}>
              <img 
                src={mascotImage} 
                alt="Origami Bird Helper" 
                className={`w-24 h-24 object-contain transition-all duration-300 ${
                  isAnimating ? 'scale-110' : 'scale-100'
                }`} 
              />
            </div>
            {/* Floating error icon */}
            <div className={`absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center transition-all duration-500 ${
              isAnimating ? 'animate-pulse scale-110' : ''
            }`}>
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Error Content */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              {messageData.title}
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-3">
              {messageData.description}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              {messageData.suggestion}
            </p>

            {/* Technical error details (collapsible) */}
            <details className="text-xs text-red-500 dark:text-red-400 mb-4">
              <summary className="cursor-pointer hover:text-red-600 dark:hover:text-red-300">
                Technical details
              </summary>
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-left font-mono">
                {error}
              </div>
            </details>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              {onRetry && (
                <Button 
                  onClick={onRetry}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              {errorType === 'quota' && onUpgrade && (
                <Button 
                  onClick={onUpgrade}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
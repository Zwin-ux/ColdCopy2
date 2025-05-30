import { apiRequest } from "@/lib/queryClient";

export interface GenerateMessageResponse {
  id: number;
  message: string;
  personalizationScore: number;
  wordCount: number;
  estimatedResponseRate: number;
  detectedInfo?: {
    name?: string;
    company?: string;
    role?: string;
    location?: string;
  };
}

export async function generateMessage(data: {
  linkedinUrl?: string;
  bioText?: string;
  resume?: File;
}): Promise<GenerateMessageResponse> {
  const formData = new FormData();
  
  if (data.linkedinUrl) {
    formData.append('linkedinUrl', data.linkedinUrl);
  }
  
  if (data.bioText) {
    formData.append('bioText', data.bioText);
  }
  
  if (data.resume) {
    formData.append('resume', data.resume);
  }
  
  // Add default style if not provided
  formData.append('style', 'professional');

  const response = await fetch('/api/generate-message', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate message');
  }

  return response.json();
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for browsers that don't support clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

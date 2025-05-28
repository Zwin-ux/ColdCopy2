import Groq from 'groq-sdk';
import { z } from 'zod';

// Validation schema for input
const InputSchema = z.object({
  linkedinUrl: z.string().url().optional(),
  bioText: z.string().max(5000).optional(),
  recipientName: z.string().optional(),
  recipientCompany: z.string().optional(),
  recipientRole: z.string().optional(),
  resume: z.string().optional(),
  senderName: z.string().optional(),
  senderCompany: z.string().optional(),
  senderRole: z.string().optional(),
  purpose: z.string().optional(),
  templateType: z.enum(['professional_intro', 'networking_followup', 'career_opportunity', 'industry_insight', 'collaboration_pitch']).optional(),
});

// Type for the validated input
type InputType = z.infer<typeof InputSchema>;

// Output type
interface EmailGenerationResult {
  message: string;
  personalizationScore: number;
  estimatedResponseRate: number;
  templateName: string;
  wordCount: number;
  error?: string;
}

export class GroqClient {
  private client: Groq;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;
  
  constructor(apiKey: string) {
    if (!apiKey) throw new Error('API key is required');
    this.client = new Groq({ apiKey });
  }
  
  async generateEmail(input: InputType): Promise<EmailGenerationResult> {
    // Validate input
    try {
      InputSchema.parse(input);
    } catch (e: any) {
      return this.createFallbackResponse(input, `Invalid input: ${e.message}`);
    }
    
    // Build prompt
    const prompt = this.buildPrompt(input);
    
    // Call API with retries
    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        const result = await this.callGroqAPI(prompt);
        return this.processResponse(result, input);
      } catch (error: any) {
        attempts++;
        console.error(`API attempt ${attempts} failed:`, error);
        
        if (attempts >= this.maxRetries) {
          return this.createFallbackResponse(input, `API failed after ${attempts} attempts: ${error.message}`);
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempts - 1)));
      }
    }
    
    // Should never reach here due to return in catch block
    return this.createFallbackResponse(input, "Unknown error occurred");
  }
  
  private async callGroqAPI(prompt: string): Promise<any> {
    const response = await this.client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert at writing professional outreach messages. Never invent details. If no recipient name is provided, use 'Hi there' or 'Hello'. Only use explicitly stated information. Always respond in JSON format with message, personalizationScore, and estimatedResponseRate fields."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    // Validate we have a response
    if (!response?.choices?.[0]?.message?.content) {
      throw new Error("Empty response from API");
    }
    
    // Parse JSON response
    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (e: any) {
      throw new Error(`Failed to parse JSON response: ${e.message}`);
    }
  }
  
  private buildPrompt(input: InputType): string {
    const {
      linkedinUrl,
      bioText,
      recipientName,
      recipientCompany,
      recipientRole,
      resume,
      senderName,
      senderCompany,
      senderRole,
      purpose,
      templateType = 'professional_intro'
    } = input;
    
    let prompt = `Create a personalized professional outreach message based on the following information:\n\n`;
    
    // Sender info
    if (senderName) prompt += `Your Name: ${senderName}\n`;
    if (senderCompany) prompt += `Your Company: ${senderCompany}\n`;
    if (senderRole) prompt += `Your Role: ${senderRole}\n`;
    if (purpose) prompt += `Message Purpose: ${purpose}\n`;
    
    // Recipient info
    prompt += `\n--- RECIPIENT INFORMATION ---\n`;
    if (recipientName) prompt += `Recipient Name: ${recipientName}\n`;
    if (recipientCompany) prompt += `Company: ${recipientCompany}\n`;
    if (recipientRole) prompt += `Role: ${recipientRole}\n`;
    if (linkedinUrl) prompt += `LinkedIn: ${linkedinUrl}\n`;
    if (bioText) prompt += `Bio/Description: ${bioText}\n`;
    if (resume) prompt += `Sender's Background: ${resume.substring(0, 800)}\n`;
    
    // Template guidance
    const templateGuidance = this.getTemplateGuidance(templateType);
    prompt += `\nMessage Style: ${templateGuidance}\n`;
    
    // Requirements
    prompt += `\nREQUIREMENTS:
1. GREETING: Use "Hi ${recipientName || 'there'}," - never invent names
2. SENDER INFO: ${senderName || "[Your Name]"}, ${senderCompany || "[Your Company]"}, ${senderRole || "[Your Role]"}
3. DATA INTEGRITY: Use ONLY real information provided - no fabricated details
4. TONE: Professional yet conversational (100-150 words)
5. CALL TO ACTION: Include clear invitation to connect
6. FORMAT: Return JSON with message, personalizationScore (70-95), and estimatedResponseRate (30-85)`;
    
    return prompt;
  }
  
  private processResponse(apiResponse: any, input: InputType): EmailGenerationResult {
    // Extract message or use fallback
    let message = apiResponse.message || this.createFallbackMessage(input);
    
    // Clean up message - remove any fake names
    const commonFakeNames = ['Alex', 'Sarah', 'John', 'Michael', 'Rachel', 'David', 'Lisa', 'Jennifer', 'Emily', 'James', 'Maria', 'Chris', 'Jessica', 'Mark', 'Amanda'];
    for (const name of commonFakeNames) {
      const fakeGreeting = new RegExp(`Hi ${name},`, 'i');
      if (fakeGreeting.test(message)) {
        message = message.replace(fakeGreeting, 'Hi there,');
        console.log(`Replaced fabricated name "${name}" with generic greeting`);
      }
    }
    
    // Calculate metrics
    const wordCount = message.split(/\s+/).length;
    const personalizationScore = Math.min(100, Math.max(60, apiResponse.personalizationScore || 75));
    const estimatedResponseRate = Math.min(95, Math.max(25, apiResponse.estimatedResponseRate || 35));
    
    return {
      message,
      personalizationScore,
      estimatedResponseRate,
      wordCount,
      templateName: this.getTemplateName(input.templateType || 'professional_intro')
    };
  }
  
  private createFallbackMessage(input: InputType): string {
    const { recipientName, recipientCompany, recipientRole, senderName } = input;
    
    const name = recipientName || 'there';
    let message = `Hi ${name},\n\n`;
    
    if (recipientCompany && recipientRole) {
      message += `I came across your profile and was impressed by your work as ${recipientRole} at ${recipientCompany}.\n\n`;
    } else if (recipientCompany) {
      message += `I noticed your experience at ${recipientCompany} and found your background interesting.\n\n`;
    } else if (recipientRole) {
      message += `Your background in ${recipientRole} caught my attention.\n\n`;
    } else {
      message += `I came across your profile and found your professional background compelling.\n\n`;
    }
    
    message += `I'd love to connect and learn more about your experience in the industry.\n\n`;
    message += `Would you be open to a brief conversation?\n\n`;
    message += `Best regards,\n${senderName || "[Your Name]"}`;
    
    return message;
  }
  
  private createFallbackResponse(input: InputType, errorMessage: string): EmailGenerationResult {
    console.error(`Fallback triggered: ${errorMessage}`);
    
    return {
      message: this.createFallbackMessage(input),
      personalizationScore: 65,
      estimatedResponseRate: 30,
      wordCount: this.createFallbackMessage(input).split(/\s+/).length,
      templateName: this.getTemplateName(input.templateType || 'professional_intro'),
      error: errorMessage
    };
  }
  
  private getTemplateGuidance(templateId: string): string {
    const styles = {
      'professional_intro': 'Professional introduction seeking to connect and learn',
      'networking_followup': 'Following up on a previous connection or mutual interest',
      'career_opportunity': 'Presenting a relevant career or business opportunity',
      'industry_insight': 'Sharing industry insights and seeking perspectives',
      'collaboration_pitch': 'Proposing potential collaboration or partnership'
    };
    
    return styles[templateId as keyof typeof styles] || styles.professional_intro;
  }
  
  private getTemplateName(templateId: string): string {
    const names = {
      'professional_intro': 'Professional Introduction',
      'networking_followup': 'Networking Follow-up',
      'career_opportunity': 'Career Opportunity',
      'industry_insight': 'Industry Insight',
      'collaboration_pitch': 'Collaboration Pitch'
    };
    
    return names[templateId as keyof typeof names] || 'Professional Introduction';
  }
}
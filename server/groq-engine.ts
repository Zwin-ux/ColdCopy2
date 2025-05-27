// Groq AI Integration for ColdCopy
// High-quality message generation using Groq's fast inference

import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('Missing required GROQ_API_KEY environment variable');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface MessageGenerationResult {
  message: string;
  personalizationScore: number;
  wordCount: number;
  estimatedResponseRate: number;
  templateName: string;
}

export async function generatePersonalizedMessage(params: {
  linkedinUrl?: string;
  bioText?: string;
  templateId?: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientRole?: string;
  resume?: string;
  useAdvancedPersonalization?: boolean;
  includeABTestingSuggestions?: boolean;
  useCustomTraining?: boolean;
  senderName?: string;
  senderCompany?: string;
  senderRole?: string;
  purpose?: string;
}): Promise<MessageGenerationResult> {
  const {
    linkedinUrl,
    bioText,
    templateId = 'professional_intro',
    recipientName,
    recipientCompany,
    recipientRole,
    resume
  } = params;

  // Create a comprehensive prompt for Groq
  const prompt = createPersonalizationPrompt({
    linkedinUrl,
    bioText,
    templateId,
    recipientName,
    recipientCompany,
    recipientRole,
    resume,
    senderName: params.senderName,
    senderCompany: params.senderCompany,
    senderRole: params.senderRole,
    purpose: params.purpose
  });

  try {
    console.log('Attempting Groq API call with prompt:', prompt.substring(0, 200) + '...');
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert at writing professional outreach messages. ABSOLUTE RULE: NEVER invent names like 'Rachel', 'Alex', 'Sarah' or companies like 'FinTech Solutions'. If no recipient name provided, MUST use 'Hi there' or 'Hello'. If no company name in bio, do NOT mention any company name. Only use explicitly stated information. Inventing details = COMPLETE FAILURE. Always respond in JSON format."
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

    console.log('Groq API response:', chatCompletion.choices[0]?.message?.content);
    const response = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
    
    // Validate and format the response
    let message = response.message || "Hi there,\n\nI'd love to connect and learn more about your experience.\n\nBest regards,\n[Your Name]";
    
    // Post-process to remove fake names and ensure data integrity
    const commonFakeNames = ['Alex', 'Sarah', 'John', 'Michael', 'Rachel', 'David', 'Lisa', 'Jennifer', 'Elon', 'Guillermo', 'Maria', 'Carlos', 'Ana', 'James', 'Emily', 'Robert', 'Jessica', 'Chris', 'Amanda', 'Matthew', 'Ashley', 'Daniel', 'Nicole', 'Andrew', 'Elizabeth', 'Ryan', 'Samantha', 'Kevin', 'Lauren', 'Brian', 'Stephanie', 'Amith', 'Kumar', 'Priya', 'Raj', 'Anita', 'Vikram', 'Sanya', 'Arjun', 'Neha', 'Rohan'];
    
    for (const fakeName of commonFakeNames) {
      const fakeGreeting = `Hi ${fakeName},`;
      if (message.startsWith(fakeGreeting)) {
        message = message.replace(fakeGreeting, 'Hi there,');
        console.log(`🛡️ Anti-hallucination filter activated: Removed fake name "${fakeName}"`);
        break;
      }
    }
    
    const personalizationScore = Math.min(100, Math.max(60, response.personalizationScore || 75));
    const wordCount = message.split(/\s+/).length;
    const estimatedResponseRate = Math.min(95, Math.max(25, response.estimatedResponseRate || 35));

    return {
      message,
      personalizationScore,
      wordCount,
      estimatedResponseRate,
      templateName: getTemplateName(templateId)
    };

  } catch (error) {
    console.error('Groq API error:', error);
    
    // Return error instead of fake fallback data
    throw new Error(`AI generation failed: ${error.message}. Please check your API configuration.`);
  }
}

function createPersonalizationPrompt(params: {
  linkedinUrl?: string;
  bioText?: string;
  templateId?: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientRole?: string;
  resume?: string;
  senderName?: string;
  senderCompany?: string;
  senderRole?: string;
  purpose?: string;
}): string {
  const {
    linkedinUrl,
    bioText,
    templateId,
    recipientName,
    recipientCompany,
    recipientRole,
    resume
  } = params;

  let prompt = `Create a highly personalized professional outreach message based on the following information:\n\n`;

  // Add SENDER information (prevents AI hallucination)
  if (params.senderName) prompt += `Your Name: ${params.senderName}\n`;
  if (params.senderCompany) prompt += `Your Company: ${params.senderCompany}\n`;
  if (params.senderRole) prompt += `Your Role: ${params.senderRole}\n`;
  if (params.purpose) prompt += `Message Purpose: ${params.purpose}\n`;
  
  prompt += `\n--- RECIPIENT INFORMATION ---\n`;
  // Add recipient information
  if (recipientName) prompt += `Recipient Name: ${recipientName}\n`;
  if (recipientCompany) prompt += `Company: ${recipientCompany}\n`;
  if (recipientRole) prompt += `Role: ${recipientRole}\n`;
  if (linkedinUrl) prompt += `LinkedIn: ${linkedinUrl}\n`;
  if (bioText) prompt += `Bio/Description: ${bioText}\n`;
  if (resume) prompt += `Sender's Background: ${resume.substring(0, 800)}\n`;

  // Add template style guidance
  const templateGuidance = getTemplateGuidance(templateId || 'professional_intro');
  prompt += `\nMessage Style: ${templateGuidance}\n`;

  prompt += `\nABSOLUTE CRITICAL REQUIREMENTS - NO EXCEPTIONS:
1. NEVER EVER invent recipient names like "Alex", "Sarah", "John", "Guillermo", "Rachel" - STRICTLY FORBIDDEN
2. MUST start with "Hi there" or "Hello" - NEVER use made-up names
3. From sender info - Your name: ${params.senderName || "[Your Name]"}
4. From sender info - Your company: ${params.senderCompany || "[Your Company]"}  
5. From sender info - Your role: ${params.senderRole || "[Your Role]"}
6. Reference ONLY actual information from bio text - no fabricated details
7. Professional but conversational (100-150 words)
8. Include clear but soft call to action
9. ANY NAME INVENTION = COMPLETE SYSTEM FAILURE

Return JSON with:
{
  "message": "the complete message text",
  "personalizationScore": number between 70-95,
  "estimatedResponseRate": number between 30-85
}`;

  return prompt;
}

function getTemplateGuidance(templateId: string): string {
  const styles = {
    'professional_intro': 'Professional introduction seeking to connect and learn',
    'networking_followup': 'Following up on a previous connection or mutual interest',
    'career_opportunity': 'Presenting a relevant career or business opportunity',
    'industry_insight': 'Sharing industry insights and seeking perspectives',
    'collaboration_pitch': 'Proposing potential collaboration or partnership'
  };

  return styles[templateId as keyof typeof styles] || styles.professional_intro;
}

function getTemplateName(templateId: string): string {
  const names = {
    'professional_intro': 'Professional Introduction',
    'networking_followup': 'Networking Follow-up',
    'career_opportunity': 'Career Opportunity',
    'industry_insight': 'Industry Insight',
    'collaboration_pitch': 'Collaboration Pitch'
  };

  return names[templateId as keyof typeof names] || 'Professional Introduction';
}

function generateFallbackMessage(params: {
  linkedinUrl?: string;
  bioText?: string;
  templateId?: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientRole?: string;
  resume?: string;
}): MessageGenerationResult {
  const { recipientName, recipientCompany, recipientRole, templateId } = params;

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
  message += `Best regards,\n[Your Name]`;

  return {
    message,
    personalizationScore: 75,
    wordCount: message.split(/\s+/).length,
    estimatedResponseRate: 35,
    templateName: getTemplateName(templateId || 'professional_intro')
  };
}
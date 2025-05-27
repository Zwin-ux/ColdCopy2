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
    
    // AGGRESSIVE ANTI-HALLUCINATION: Remove ALL fabricated content
    
    // 1. Remove any sentence that introduces fake names or companies
    const sentences = message.split('.');
    const cleanSentences = sentences.filter(sentence => {
      const cleaned = sentence.trim().toLowerCase();
      return !cleaned.includes('my name is') && 
             !cleaned.includes("i'm ") && 
             !cleaned.includes('techcraft') &&
             !cleaned.includes('publishing') &&
             !cleaned.includes('labs') &&
             !cleaned.includes('freelance') &&
             !cleaned.includes('consultant');
    });
    
    // 2. Rebuild message from clean sentences
    message = cleanSentences.join('. ').trim();
    
    // 3. Replace placeholders with actual sender information
    message = message.replace(/\[Platform\]/g, '');
    message = message.replace(/\[specific project or technology\]/g, 'your work');
    message = message.replace(/\[Your Name\]/g, params.senderName || 'a professional');
    message = message.replace(/\[Your Company\]/g, params.senderCompany || 'my company');
    message = message.replace(/\[Your Role\]/g, params.senderRole || 'my role');
    
    // 4. Clean up formatting and line breaks
    message = message.replace(/\\r\\n/g, ' ').replace(/\s+/g, ' ').replace(/\s+\./g, '.').trim();
    
    // 5. Ensure it starts with proper greeting
    if (!message.startsWith('Hi there')) {
      message = 'Hi there, ' + message.replace(/^Hi there,?\s*/, '');
    }
    
    console.log('🛡️ Aggressive anti-hallucination filter applied');
    
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

  // Extract specific details from bio text for true personalization
  const extractedDetails = extractPersonalizationPoints(bioText || '');
  
  let prompt = `Create a highly personalized professional outreach message. Use ONLY the specific details provided below.\n\n`;

  // Add SENDER information 
  prompt += `SENDER DETAILS:\n`;
  prompt += `- Name: ${params.senderName || "[Your Name]"}\n`;
  prompt += `- Company: ${params.senderCompany || "[Your Company]"}\n`;
  prompt += `- Role: ${params.senderRole || "[Your Role]"}\n`;
  if (params.purpose) prompt += `- Purpose: ${params.purpose}\n`;
  
  prompt += `\nRECIPIENT DETAILS:\n`;
  if (recipientName) prompt += `- Name: ${recipientName}\n`;
  if (recipientCompany) prompt += `- Company: ${recipientCompany}\n`;
  if (recipientRole) prompt += `- Role: ${recipientRole}\n`;
  if (bioText) prompt += `- Bio: ${bioText}\n`;
  
  // Add extracted personalization points
  if (extractedDetails.length > 0) {
    prompt += `\nKEY PERSONALIZATION POINTS:\n`;
    extractedDetails.forEach((detail, index) => {
      prompt += `${index + 1}. ${detail}\n`;
    });
  }

  prompt += `\nREQUIREMENTS:
1. Start with "Hi there," (never invent recipient names)
2. Reference specific details from the bio/role/company provided
3. Show genuine interest in their actual work or achievements
4. Include your authentic sender information naturally
5. Professional but conversational tone (120-180 words)
6. Clear call to action for connection
7. NEVER make up companies, names, or details not provided

Return JSON format:
{
  "message": "complete personalized message",
  "personalizationScore": 85-95,
  "estimatedResponseRate": 50-75
}`;

  return prompt;
}

// Helper function to extract specific personalization points
function extractPersonalizationPoints(bioText: string): string[] {
  const points: string[] = [];
  
  if (!bioText) return points;
  
  const text = bioText.toLowerCase();
  
  // Extract companies
  const companies = ['google', 'microsoft', 'apple', 'amazon', 'meta', 'netflix', 'tesla', 'spotify', 'adobe', 'salesforce', 'uber', 'airbnb', 'stripe', 'figma', 'linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'github', 'slack', 'zoom', 'dropbox', 'atlassian', 'shopify'];
  companies.forEach(company => {
    if (text.includes(company)) {
      points.push(`Works at ${company.charAt(0).toUpperCase() + company.slice(1)}`);
    }
  });
  
  // Extract roles/titles
  const roles = ['engineer', 'manager', 'director', 'ceo', 'cto', 'designer', 'developer', 'analyst', 'consultant', 'founder', 'vp', 'head of', 'lead', 'senior', 'principal', 'architect', 'specialist'];
  roles.forEach(role => {
    if (text.includes(role)) {
      points.push(`Role involves ${role}`);
    }
  });
  
  // Extract technologies/skills
  const techs = ['ai', 'machine learning', 'python', 'javascript', 'react', 'aws', 'cloud', 'data', 'analytics', 'mobile', 'web', 'backend', 'frontend', 'devops', 'security', 'blockchain', 'startup'];
  techs.forEach(tech => {
    if (text.includes(tech)) {
      points.push(`Experience with ${tech}`);
    }
  });
  
  return [...new Set(points)].slice(0, 3); // Return unique points, max 3
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
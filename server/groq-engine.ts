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
  senderName?: string;
  senderCompany?: string;
  senderRole?: string;
  purpose?: string;
}): Promise<MessageGenerationResult> {

  // Simple prompt construction
  const prompt = buildSimplePrompt(params);

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert cold email writer. Create professional outreach messages using only the information provided. Always start with 'Hi there,' and never invent names or details. Respond in JSON format with message, personalizationScore (70-95), and estimatedResponseRate (30-80)."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
    
    let message = response.message || "Hi there, I'd love to connect and learn more about your experience.";
    
    // Simple cleanup - ensure proper greeting
    if (!message.startsWith('Hi there')) {
      message = 'Hi there, ' + message.replace(/^Hi[^,]*,?\s*/, '');
    }

    return {
      message,
      personalizationScore: response.personalizationScore || 75,
      wordCount: message.split(/\s+/).length,
      estimatedResponseRate: response.estimatedResponseRate || 40,
      templateName: 'Professional Introduction'
    };

  } catch (error: any) {
    throw new Error(`Message generation failed: ${error.message}`);
  }
}

function buildSimplePrompt(params: {
  linkedinUrl?: string;
  bioText?: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientRole?: string;
  resume?: string;
  senderName?: string;
  senderCompany?: string;
  senderRole?: string;
  purpose?: string;
}): string {
  
  let prompt = "Write a professional cold email with these details:\n\n";
  
  // Enhanced sender info with resume parsing
  prompt += "SENDER DETAILS:\n";
  if (params.senderName) prompt += `Name: ${params.senderName}\n`;
  if (params.senderCompany) prompt += `Company: ${params.senderCompany}\n`;
  if (params.senderRole) prompt += `Role: ${params.senderRole}\n`;
  
  // Parse resume for additional sender context
  if (params.resume) {
    const resumeInfo = extractResumeInfo(params.resume);
    if (resumeInfo.skills.length > 0) {
      prompt += `Skills: ${resumeInfo.skills.join(', ')}\n`;
    }
    if (resumeInfo.experience.length > 0) {
      prompt += `Experience: ${resumeInfo.experience.join(', ')}\n`;
    }
    if (resumeInfo.education.length > 0) {
      prompt += `Education: ${resumeInfo.education.join(', ')}\n`;
    }
  }
  
  // Enhanced recipient info
  prompt += "\nRECIPIENT DETAILS:\n";
  if (params.bioText) prompt += `About them: ${params.bioText}\n`;
  if (params.recipientCompany) prompt += `Their company: ${params.recipientCompany}\n`;
  if (params.recipientRole) prompt += `Their role: ${params.recipientRole}\n`;
  if (params.linkedinUrl) prompt += `LinkedIn: ${params.linkedinUrl}\n`;
  
  // Extract specific details from bio for personalization
  if (params.bioText) {
    const bioDetails = extractBioDetails(params.bioText);
    if (bioDetails.length > 0) {
      prompt += `Key interests: ${bioDetails.join(', ')}\n`;
    }
  }
  
  // Purpose and context
  if (params.purpose) {
    prompt += `\nOUTREACH PURPOSE: ${params.purpose}\n`;
  }
  
  prompt += `
EMAIL REQUIREMENTS:
- Start with "Hi there,"
- 120-180 words for depth
- Reference specific details from their bio/company
- Connect sender's background to recipient's work
- Show genuine interest in their specific projects/expertise
- Include clear value proposition or learning opportunity
- End with specific call to action
- Sign with sender's full name and title

Create a compelling, personalized message that shows you've researched them.

Return JSON: {"message": "complete email text", "personalizationScore": 80-95, "estimatedResponseRate": 45-75}`;

  return prompt;
}

// Extract key information from resume text
function extractResumeInfo(resume: string) {
  const skills: string[] = [];
  const experience: string[] = [];
  const education: string[] = [];
  
  const text = resume.toLowerCase();
  
  // Common skills
  const skillKeywords = ['javascript', 'python', 'react', 'node', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'api', 'frontend', 'backend', 'fullstack', 'devops', 'machine learning', 'ai', 'data science', 'product management', 'design', 'marketing', 'sales'];
  skillKeywords.forEach(skill => {
    if (text.includes(skill)) skills.push(skill);
  });
  
  // Experience indicators
  const experienceKeywords = ['years', 'led', 'managed', 'developed', 'built', 'created', 'launched', 'scaled', 'startup', 'enterprise'];
  experienceKeywords.forEach(exp => {
    if (text.includes(exp)) experience.push(exp);
  });
  
  // Education indicators
  const educationKeywords = ['university', 'college', 'degree', 'mba', 'phd', 'bachelor', 'master', 'stanford', 'mit', 'harvard', 'berkeley'];
  educationKeywords.forEach(edu => {
    if (text.includes(edu)) education.push(edu);
  });
  
  return {
    skills: Array.from(new Set(skills)).slice(0, 5),
    experience: Array.from(new Set(experience)).slice(0, 3),
    education: Array.from(new Set(education)).slice(0, 2)
  };
}

// Extract personalization details from bio
function extractBioDetails(bioText: string) {
  const details: string[] = [];
  const text = bioText.toLowerCase();
  
  // Technology focus areas
  const techAreas = ['ai', 'machine learning', 'cloud', 'mobile', 'web', 'data', 'analytics', 'security', 'blockchain', 'api', 'infrastructure', 'devops', 'frontend', 'backend'];
  techAreas.forEach(tech => {
    if (text.includes(tech)) details.push(tech);
  });
  
  // Business areas
  const businessAreas = ['growth', 'marketing', 'sales', 'product', 'design', 'ux', 'strategy', 'operations', 'finance'];
  businessAreas.forEach(area => {
    if (text.includes(area)) details.push(area);
  });
  
  return Array.from(new Set(details)).slice(0, 4);
}
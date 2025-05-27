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
  
  // Sender info
  prompt += "FROM:\n";
  if (params.senderName) prompt += `Name: ${params.senderName}\n`;
  if (params.senderCompany) prompt += `Company: ${params.senderCompany}\n`;
  if (params.senderRole) prompt += `Role: ${params.senderRole}\n`;
  
  // Recipient info
  prompt += "\nTO:\n";
  if (params.bioText) prompt += `About them: ${params.bioText}\n`;
  if (params.recipientCompany) prompt += `Their company: ${params.recipientCompany}\n`;
  if (params.recipientRole) prompt += `Their role: ${params.recipientRole}\n`;
  
  // Purpose
  if (params.purpose) {
    prompt += `\nPURPOSE: ${params.purpose}\n`;
  }
  
  prompt += `
REQUIREMENTS:
- Start with "Hi there,"
- 100-150 words
- Professional but friendly tone
- Reference their actual work/company from the bio
- Include a clear call to action
- Use sender's real name and company in signature

Return JSON: {"message": "...", "personalizationScore": 85, "estimatedResponseRate": 55}`;

  return prompt;
}
// Smart Template Engine - No AI Required, Maximum Value
export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  template: string;
  variables: string[];
  estimatedResponseRate: number;
  useCases: string[];
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'professional_intro',
    name: 'Professional Introduction',
    category: 'Networking',
    description: 'Perfect for connecting with professionals in your industry',
    template: `Hi {{recipientName}},

I came across your profile and was impressed by your work at {{recipientCompany}}. {{personalConnection}}

{{valueProposition}}

Would you be open to a brief conversation about {{conversationTopic}}? I'd love to learn more about your experience and share some insights from my work in {{senderExpertise}}.

Best regards,
{{senderName}}`,
    variables: ['recipientName', 'recipientCompany', 'personalConnection', 'valueProposition', 'conversationTopic', 'senderExpertise', 'senderName'],
    estimatedResponseRate: 25,
    useCases: ['Cold outreach', 'Industry networking', 'Career exploration']
  },
  {
    id: 'job_inquiry',
    name: 'Job Opportunity Inquiry',
    category: 'Career',
    description: 'Reaching out about potential job opportunities',
    template: `Hello {{recipientName}},

I hope this message finds you well. I'm reaching out because I'm very interested in opportunities at {{recipientCompany}}, particularly in {{targetRole}}.

{{backgroundHighlight}}

I've been following {{recipientCompany}}'s work in {{companyFocus}} and would love the chance to contribute to your team's success.

Would you have 15 minutes for a quick call to discuss potential opportunities?

Thank you for your time,
{{senderName}}`,
    variables: ['recipientName', 'recipientCompany', 'targetRole', 'backgroundHighlight', 'companyFocus', 'senderName'],
    estimatedResponseRate: 18,
    useCases: ['Job searching', 'Career transition', 'Internal referrals']
  },
  {
    id: 'collaboration_proposal',
    name: 'Collaboration Proposal',
    category: 'Business',
    description: 'Proposing partnerships or collaborative projects',
    template: `Hi {{recipientName}},

I've been following your work at {{recipientCompany}} and am particularly impressed by {{specificWork}}.

I believe there's a strong synergy between what you're doing and our work at {{senderCompany}}. {{collaborationIdea}}

{{mutualBenefit}}

Would you be interested in exploring this further? I'd be happy to share more details and hear your thoughts.

Looking forward to your response,
{{senderName}}`,
    variables: ['recipientName', 'recipientCompany', 'specificWork', 'senderCompany', 'collaborationIdea', 'mutualBenefit', 'senderName'],
    estimatedResponseRate: 22,
    useCases: ['Business development', 'Partnerships', 'Project collaboration']
  },
  {
    id: 'expert_advice',
    name: 'Seeking Expert Advice',
    category: 'Learning',
    description: 'Asking for insights from industry experts',
    template: `Dear {{recipientName}},

I hope you're doing well. I'm {{senderRole}} at {{senderCompany}} and have been following your expertise in {{expertiseArea}}.

{{currentChallenge}}

Given your experience with {{specificExperience}}, I would greatly value your insights on {{specificQuestion}}.

I understand your time is valuable, so I'd be happy to keep any call to 20 minutes or less.

Thank you for considering,
{{senderName}}`,
    variables: ['recipientName', 'senderRole', 'senderCompany', 'expertiseArea', 'currentChallenge', 'specificExperience', 'specificQuestion', 'senderName'],
    estimatedResponseRate: 30,
    useCases: ['Mentorship', 'Industry insights', 'Problem solving']
  },
  {
    id: 'sales_outreach',
    name: 'Sales Outreach',
    category: 'Sales',
    description: 'Professional sales approach without being pushy',
    template: `Hi {{recipientName}},

I noticed you're leading {{specificArea}} at {{recipientCompany}}. {{relevantObservation}}

Many {{recipientRole}}s like yourself are currently dealing with {{commonChallenge}}. At {{senderCompany}}, we've helped companies like {{similarCompany}} {{specificResult}}.

{{softCTA}}

Would a brief 15-minute conversation be valuable to explore how this might apply to {{recipientCompany}}?

Best,
{{senderName}}`,
    variables: ['recipientName', 'specificArea', 'recipientCompany', 'relevantObservation', 'recipientRole', 'commonChallenge', 'senderCompany', 'similarCompany', 'specificResult', 'softCTA'],
    estimatedResponseRate: 15,
    useCases: ['B2B sales', 'Product demos', 'Service offerings']
  }
];

// Smart data extraction functions
export function extractNameFromLinkedIn(linkedinUrl?: string): string {
  if (!linkedinUrl) return '[Name]';
  
  const match = linkedinUrl.match(/\/in\/([^\/\?]+)/);
  if (match) {
    return match[1].split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  return '[Name]';
}

export function extractCompanyFromBio(bioText?: string): string {
  if (!bioText) return '[Company]';
  
  // Look for common company indicators
  const companyPatterns = [
    /at\s+([A-Z][a-zA-Z\s&.]+?)(?:\s|,|\.|\n|$)/,
    /with\s+([A-Z][a-zA-Z\s&.]+?)(?:\s|,|\.|\n|$)/,
    /(?:CEO|CTO|VP|Director|Manager|Lead|Senior)\s+at\s+([A-Z][a-zA-Z\s&.]+?)(?:\s|,|\.|\n|$)/
  ];
  
  for (const pattern of companyPatterns) {
    const match = bioText.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return '[Company]';
}

export function extractRoleFromBio(bioText?: string): string {
  if (!bioText) return '[Role]';
  
  const rolePatterns = [
    /(CEO|CTO|VP|Director|Manager|Lead|Senior|Engineer|Developer|Designer|Analyst|Consultant)/i,
    /works?\s+as\s+([a-zA-Z\s]+)/i,
    /position\s+as\s+([a-zA-Z\s]+)/i
  ];
  
  for (const pattern of rolePatterns) {
    const match = bioText.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return '[Role]';
}

// Smart template generation with personalization
export function generateTemplateMessage(params: {
  linkedinUrl?: string;
  bioText?: string;
  templateId: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientRole?: string;
  resume?: string;
}): {
  message: string;
  personalizationScore: number;
  wordCount: number;
  estimatedResponseRate: number;
  templateName: string;
} {
  const template = MESSAGE_TEMPLATES.find(t => t.id === params.templateId) || MESSAGE_TEMPLATES[0];
  
  // Extract smart defaults
  const recipientName = params.recipientName || extractNameFromLinkedIn(params.linkedinUrl);
  const recipientCompany = params.recipientCompany || extractCompanyFromBio(params.bioText);
  const recipientRole = params.recipientRole || extractRoleFromBio(params.bioText);
  
  // Smart variable filling based on template and context
  const variables: Record<string, string> = {
    recipientName,
    recipientCompany,
    recipientRole,
    senderName: '[Your Name]',
    senderCompany: '[Your Company]',
    senderRole: '[Your Role]',
    senderExpertise: '[Your Expertise Area]',
    personalConnection: generatePersonalConnection(params.bioText, params.linkedinUrl),
    valueProposition: generateValueProposition(template.category),
    conversationTopic: generateConversationTopic(recipientRole, recipientCompany),
    backgroundHighlight: generateBackgroundHighlight(params.resume),
    targetRole: recipientRole,
    companyFocus: generateCompanyFocus(recipientCompany),
    specificWork: generateSpecificWork(params.bioText),
    collaborationIdea: generateCollaborationIdea(),
    mutualBenefit: generateMutualBenefit(),
    expertiseArea: generateExpertiseArea(params.bioText),
    currentChallenge: generateCurrentChallenge(),
    specificExperience: generateSpecificExperience(params.bioText),
    specificQuestion: generateSpecificQuestion(),
    specificArea: generateSpecificArea(recipientRole),
    relevantObservation: generateRelevantObservation(recipientCompany),
    commonChallenge: generateCommonChallenge(recipientRole),
    similarCompany: generateSimilarCompany(),
    specificResult: generateSpecificResult(),
    softCTA: generateSoftCTA()
  };
  
  // Replace template variables
  let message = template.template;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  // Calculate personalization score based on how many defaults were replaced
  const filledVariables = Object.values(variables).filter(v => !v.includes('[')).length;
  const personalizationScore = Math.round((filledVariables / Object.keys(variables).length) * 100);
  
  // Count words
  const wordCount = message.split(/\s+/).length;
  
  return {
    message,
    personalizationScore,
    wordCount,
    estimatedResponseRate: template.estimatedResponseRate,
    templateName: template.name
  };
}

// Helper functions for smart content generation
function generatePersonalConnection(bioText?: string, linkedinUrl?: string): string {
  if (bioText && bioText.length > 50) {
    return `Your background in ${extractRoleFromBio(bioText).toLowerCase()} particularly caught my attention.`;
  }
  return `I noticed we share some common professional interests.`;
}

function generateValueProposition(category: string): string {
  const props: Record<string, string> = {
    'Networking': 'I believe we could share valuable insights about our respective experiences in the industry.',
    'Career': 'I bring a unique combination of technical skills and business acumen to any team.',
    'Business': 'I think there could be interesting opportunities for our organizations to collaborate.',
    'Learning': 'I\'m always eager to learn from experienced professionals like yourself.',
    'Sales': 'I help companies streamline their operations and increase efficiency.'
  };
  return props[category] || props['Networking'];
}

function generateConversationTopic(role?: string, company?: string): string {
  if (role && role !== '[Role]') {
    return `trends in ${role.toLowerCase()} and industry best practices`;
  }
  return 'industry trends and professional development';
}

function generateBackgroundHighlight(resume?: string): string {
  if (resume && resume.length > 100) {
    return 'With my background in software development and proven track record of delivering results, I believe I could contribute significantly to your team.';
  }
  return 'My diverse experience and passion for innovation make me excited about the possibility of joining your team.';
}

function generateCompanyFocus(company?: string): string {
  if (company && company !== '[Company]') {
    return `${company}'s industry sector`;
  }
  return 'your industry';
}

function generateSpecificWork(bioText?: string): string {
  if (bioText && bioText.length > 30) {
    return 'your recent projects and achievements';
  }
  return 'your professional accomplishments';
}

function generateCollaborationIdea(): string {
  return 'I have an idea for a project that could benefit both our organizations.';
}

function generateMutualBenefit(): string {
  return 'This collaboration could help both of us reach new markets and share valuable expertise.';
}

function generateExpertiseArea(bioText?: string): string {
  const role = extractRoleFromBio(bioText);
  if (role !== '[Role]') {
    return role.toLowerCase();
  }
  return 'your field';
}

function generateCurrentChallenge(): string {
  return 'I\'m currently working on a challenging project and would appreciate your perspective.';
}

function generateSpecificExperience(bioText?: string): string {
  if (bioText && bioText.length > 50) {
    return 'your extensive experience in the industry';
  }
  return 'your professional background';
}

function generateSpecificQuestion(): string {
  return 'best practices and potential pitfalls to avoid';
}

function generateSpecificArea(role?: string): string {
  if (role && role !== '[Role]') {
    return role.toLowerCase();
  }
  return 'operations';
}

function generateRelevantObservation(company?: string): string {
  if (company && company !== '[Company]') {
    return `${company} has been making impressive strides in the market.`;
  }
  return 'Your company has been making impressive progress.';
}

function generateCommonChallenge(role?: string): string {
  const challenges = {
    'CEO': 'scaling operations efficiently',
    'CTO': 'managing technical debt while innovating',
    'Manager': 'balancing team productivity with quality',
    'Director': 'aligning strategic goals with execution'
  };
  
  for (const [key, challenge] of Object.entries(challenges)) {
    if (role?.toLowerCase().includes(key.toLowerCase())) {
      return challenge;
    }
  }
  
  return 'optimizing processes and driving growth';
}

function generateSimilarCompany(): string {
  return '[Similar Company]';
}

function generateSpecificResult(): string {
  return 'achieve significant improvements in efficiency and ROI';
}

function generateSoftCTA(): string {
  return 'I\'d be happy to share a brief case study that might be relevant to your current initiatives.';
}
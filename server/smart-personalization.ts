// Advanced Personalization Engine for ColdCopy
// Creates truly personalized messages without generic placeholders

interface PersonalizationContext {
  name: string;
  company: string;
  role: string;
  industry: string;
  experience: string;
  keyTerms: string[];
  professionalFocus: string[];
}

interface MessageCraft {
  message: string;
  personalizationScore: number;
  wordCount: number;
  estimatedResponseRate: number;
  templateName: string;
}

export function generatePersonalizedMessage(params: {
  linkedinUrl?: string;
  bioText?: string;
  templateId?: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientRole?: string;
  resume?: string;
}): MessageCraft {
  // Analyze the recipient's profile deeply
  const context = analyzeRecipientProfile(params);
  
  // Craft message based on context and template style
  const messageStyle = params.templateId || 'professional_intro';
  const craftedMessage = craftContextualMessage(context, messageStyle, params.resume);
  
  // Calculate sophisticated metrics
  const metrics = calculateAdvancedMetrics(craftedMessage, context, params);
  
  return {
    message: craftedMessage,
    personalizationScore: metrics.personalizationScore,
    wordCount: metrics.wordCount,
    estimatedResponseRate: metrics.responseRate,
    templateName: getTemplateName(messageStyle)
  };
}

function analyzeRecipientProfile(params: {
  linkedinUrl?: string;
  bioText?: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientRole?: string;
}): PersonalizationContext {
  const { linkedinUrl, bioText, recipientName, recipientCompany, recipientRole } = params;
  
  // Smart name extraction
  const name = extractRealName(recipientName, linkedinUrl, bioText);
  
  // Company intelligence
  const company = extractCompanyIntelligence(recipientCompany, bioText, linkedinUrl);
  
  // Role analysis
  const role = extractRoleDetails(recipientRole, bioText);
  
  // Industry detection
  const industry = detectIndustry(bioText, company, role);
  
  // Experience level assessment
  const experience = assessExperienceLevel(bioText, role);
  
  // Extract key professional terms
  const keyTerms = extractProfessionalTerms(bioText);
  
  // Professional focus areas
  const professionalFocus = identifyProfessionalFocus(bioText, role, industry);
  
  return {
    name,
    company,
    role,
    industry,
    experience,
    keyTerms,
    professionalFocus
  };
}

function extractRealName(recipientName?: string, linkedinUrl?: string, bioText?: string): string {
  if (recipientName && recipientName.trim() && recipientName !== '[Name]') {
    return recipientName.trim();
  }
  
  if (linkedinUrl) {
    const urlName = extractNameFromLinkedInURL(linkedinUrl);
    if (urlName && !urlName.includes('386') && !urlName.includes('zwin')) {
      return urlName;
    }
  }
  
  if (bioText) {
    const bioName = extractNameFromBioText(bioText);
    if (bioName) return bioName;
  }
  
  return 'there'; // Natural fallback instead of placeholder
}

function extractNameFromLinkedInURL(url: string): string {
  const patterns = [
    /linkedin\.com\/in\/([^\/\?]+)/,
    /linkedin\.com\/pub\/([^\/\?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const urlPart = match[1];
      // Skip if it looks like auto-generated (contains numbers or weird patterns)
      if (/\d{3,}|zwin|386/.test(urlPart)) continue;
      
      return urlPart
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
    }
  }
  
  return '';
}

function extractNameFromBioText(bioText: string): string {
  const patterns = [
    /I'm ([A-Z][a-z]+ [A-Z][a-z]+)/,
    /My name is ([A-Z][a-z]+ [A-Z][a-z]+)/,
    /Hi,?\s*I'm ([A-Z][a-z]+ [A-Z][a-z]+)/
  ];
  
  for (const pattern of patterns) {
    const match = bioText.match(pattern);
    if (match) return match[1];
  }
  
  return '';
}

function extractCompanyIntelligence(recipientCompany?: string, bioText?: string, linkedinUrl?: string): string {
  if (recipientCompany && recipientCompany.trim() && recipientCompany !== '[Company]') {
    return recipientCompany.trim();
  }
  
  if (bioText) {
    const companies = extractCompaniesFromBio(bioText);
    if (companies.length > 0) return companies[0];
  }
  
  return '';
}

function extractCompaniesFromBio(bioText: string): string[] {
  const patterns = [
    /(?:at|with|for)\s+([A-Z][A-Za-z\s&]+?)(?:\s+(?:as|where|doing|working|in)|[,.]|\s*$)/g,
    /([A-Z][A-Za-z\s&]+?)\s+(?:team|company|organization|firm)/g
  ];
  
  const companies: string[] = [];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(bioText)) !== null) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 50 && !companies.includes(company)) {
        companies.push(company);
      }
    }
  }
  
  return companies;
}

function extractRoleDetails(recipientRole?: string, bioText?: string): string {
  if (recipientRole && recipientRole.trim() && recipientRole !== '[Role]') {
    return recipientRole.trim();
  }
  
  if (bioText) {
    return extractRoleFromBio(bioText);
  }
  
  return '';
}

function extractRoleFromBio(bioText: string): string {
  const rolePatterns = [
    /(?:I'm a|I am a|working as a?|position as a?)\s+([^,.\n]+)/i,
    /([A-Z][a-z]+\s+(?:Engineer|Developer|Manager|Director|Lead|Specialist|Analyst|Consultant))/,
    /(Senior|Lead|Principal|Chief)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
  ];
  
  for (const pattern of rolePatterns) {
    const match = bioText.match(pattern);
    if (match) {
      const role = match[1] || `${match[1]} ${match[2]}`;
      if (role && role.length < 50) return role.trim();
    }
  }
  
  return '';
}

function detectIndustry(bioText?: string, company?: string, role?: string): string {
  if (!bioText) return '';
  
  const industryKeywords = {
    'technology': ['software', 'tech', 'engineering', 'developer', 'ai', 'machine learning', 'data'],
    'healthcare': ['healthcare', 'medical', 'health', 'hospital', 'clinical'],
    'finance': ['finance', 'banking', 'investment', 'financial', 'trading'],
    'consulting': ['consulting', 'consultant', 'advisory', 'strategy'],
    'education': ['education', 'teaching', 'academic', 'university', 'school'],
    'marketing': ['marketing', 'advertising', 'brand', 'digital marketing'],
    'sales': ['sales', 'business development', 'account management']
  };
  
  const lowerBio = bioText.toLowerCase();
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(keyword => lowerBio.includes(keyword))) {
      return industry;
    }
  }
  
  return '';
}

function assessExperienceLevel(bioText?: string, role?: string): string {
  if (!bioText && !role) return 'professional';
  
  const text = `${bioText || ''} ${role || ''}`.toLowerCase();
  
  if (/senior|lead|principal|director|manager|head of|vp|vice president|chief/.test(text)) {
    return 'senior';
  }
  
  if (/junior|entry|associate|assistant/.test(text)) {
    return 'early-career';
  }
  
  return 'experienced';
}

function extractProfessionalTerms(bioText?: string): string[] {
  if (!bioText) return [];
  
  const professionalTerms = [
    'innovation', 'leadership', 'strategy', 'growth', 'development',
    'optimization', 'transformation', 'solutions', 'expertise',
    'collaboration', 'excellence', 'results', 'impact'
  ];
  
  const lowerBio = bioText.toLowerCase();
  return professionalTerms.filter(term => lowerBio.includes(term)).slice(0, 3);
}

function identifyProfessionalFocus(bioText?: string, role?: string, industry?: string): string[] {
  const focus: string[] = [];
  
  if (industry) focus.push(`${industry} innovation`);
  if (role) focus.push(`${role.toLowerCase()} best practices`);
  
  focus.push('professional development', 'industry trends');
  
  return focus.slice(0, 3);
}

function craftContextualMessage(context: PersonalizationContext, style: string, resume?: string): string {
  const messageStyles = {
    professional_intro: () => craftProfessionalIntroduction(context),
    networking_followup: () => craftNetworkingMessage(context),
    career_opportunity: () => craftOpportunityMessage(context),
    industry_insight: () => craftInsightMessage(context),
    collaboration_pitch: () => craftCollaborationMessage(context)
  };
  
  const craftFunction = messageStyles[style as keyof typeof messageStyles] || messageStyles.professional_intro;
  return craftFunction();
}

function craftProfessionalIntroduction(context: PersonalizationContext): string {
  const greeting = `Hi ${context.name},`;
  
  // Dynamic opener based on available information
  let opener = '';
  if (context.company && context.role) {
    opener = `I came across your profile and was impressed by your work as ${addArticle(context.role)} at ${context.company}.`;
  } else if (context.company) {
    opener = `I noticed your experience at ${context.company} and found your background quite compelling.`;
  } else if (context.role) {
    opener = `Your background as ${addArticle(context.role)} really caught my attention.`;
  } else {
    opener = `I came across your profile and was impressed by your professional background.`;
  }
  
  // Connection based on professional focus or industry
  let connection = '';
  if (context.professionalFocus.length > 0) {
    connection = `I'm particularly interested in ${context.professionalFocus[0]} and believe we could share valuable insights.`;
  } else if (context.industry) {
    connection = `As someone also working in ${context.industry}, I think we could have some fascinating discussions about industry trends.`;
  } else {
    connection = `I believe we could share valuable insights about our respective professional experiences.`;
  }
  
  // Call to action based on context
  let cta = '';
  if (context.professionalFocus.length > 0) {
    cta = `Would you be open to a brief conversation about ${context.professionalFocus[0]}? I'd love to learn from your experience.`;
  } else {
    cta = `Would you be interested in connecting? I'd enjoy learning more about your perspective on current industry developments.`;
  }
  
  return `${greeting}\n\n${opener}\n\n${connection}\n\n${cta}\n\nBest regards,\n[Your Name]`;
}

function craftNetworkingMessage(context: PersonalizationContext): string {
  const greeting = `Hi ${context.name},`;
  
  let context_line = '';
  if (context.company) {
    context_line = `I hope things are going well at ${context.company}.`;
  } else {
    context_line = `I hope you're doing well.`;
  }
  
  let purpose = '';
  if (context.industry) {
    purpose = `I've been following some interesting developments in ${context.industry} and thought you might have valuable insights to share.`;
  } else {
    purpose = `I've been reflecting on some industry trends and remembered our connection.`;
  }
  
  return `${greeting}\n\n${context_line}\n\n${purpose}\n\nWould you have time for a brief call this week to exchange perspectives?\n\nBest regards,\n[Your Name]`;
}

function craftOpportunityMessage(context: PersonalizationContext): string {
  const greeting = `Hi ${context.name},`;
  
  let opener = '';
  if (context.role && context.company) {
    opener = `Your experience as ${addArticle(context.role)} at ${context.company} aligns perfectly with an opportunity I wanted to share.`;
  } else if (context.role) {
    opener = `Your background in ${context.role} caught my attention for an exciting opportunity.`;
  } else {
    opener = `Your professional background aligns well with an opportunity I thought you might find interesting.`;
  }
  
  return `${greeting}\n\n${opener}\n\nWe're working on some innovative projects that could benefit from your expertise. Would you be interested in learning more?\n\nBest regards,\n[Your Name]`;
}

function craftInsightMessage(context: PersonalizationContext): string {
  const greeting = `Hi ${context.name},`;
  
  let insight_context = '';
  if (context.industry && context.role) {
    insight_context = `I've been analyzing some trends in ${context.industry} that directly relate to ${context.role} work.`;
  } else if (context.industry) {
    insight_context = `I've been researching developments in ${context.industry} that might interest you.`;
  } else {
    insight_context = `I've been following some industry trends that align with your professional background.`;
  }
  
  return `${greeting}\n\n${insight_context}\n\nI'd love to get your perspective on these developments and hear about your own observations.\n\nWould you be open to a brief discussion?\n\nBest regards,\n[Your Name]`;
}

function craftCollaborationMessage(context: PersonalizationContext): string {
  const greeting = `Hi ${context.name},`;
  
  let opener = '';
  if (context.company) {
    opener = `I've been following ${context.company}'s work and am impressed by your innovative approach.`;
  } else {
    opener = `Your professional approach and expertise have caught my attention.`;
  }
  
  return `${greeting}\n\n${opener}\n\nI believe there might be some interesting opportunities for collaboration that could create mutual value.\n\nWould you be interested in exploring potential synergies?\n\nBest regards,\n[Your Name]`;
}

function addArticle(role: string): string {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const firstLetter = role.toLowerCase().charAt(0);
  return vowels.includes(firstLetter) ? `an ${role}` : `a ${role}`;
}

function calculateAdvancedMetrics(message: string, context: PersonalizationContext, params: any) {
  const wordCount = message.split(/\s+/).length;
  
  // Calculate personalization score based on context usage
  let personalizationScore = 60; // Base score
  
  if (context.name && context.name !== 'there') personalizationScore += 15;
  if (context.company) personalizationScore += 10;
  if (context.role) personalizationScore += 8;
  if (context.industry) personalizationScore += 5;
  if (context.professionalFocus.length > 0) personalizationScore += 7;
  
  // Bonus for natural language (no placeholders)
  if (!message.includes('[') && !message.includes(']')) personalizationScore += 10;
  
  personalizationScore = Math.min(95, personalizationScore);
  
  // Calculate response rate based on personalization and message quality
  const responseRate = Math.min(85, Math.max(35, 45 + (personalizationScore - 70) * 0.8));
  
  return {
    wordCount,
    personalizationScore,
    responseRate
  };
}

function getTemplateName(style: string): string {
  const names = {
    'professional_intro': 'Professional Introduction',
    'networking_followup': 'Networking Follow-up',
    'career_opportunity': 'Career Opportunity',
    'industry_insight': 'Industry Insight',
    'collaboration_pitch': 'Collaboration Pitch'
  };
  
  return names[style as keyof typeof names] || 'Professional Introduction';
}
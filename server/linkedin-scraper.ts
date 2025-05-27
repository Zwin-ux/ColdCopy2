interface LinkedInProfile {
  name?: string;
  headline?: string;
  company?: string;
  location?: string;
  experience?: string[];
  education?: string[];
  about?: string;
  email?: string;
  connections?: string;
  profileImage?: string;
}

export async function scrapeLinkedInProfile(linkedinUrl: string): Promise<LinkedInProfile | null> {
  try {
    // Clean and validate the LinkedIn URL
    const cleanUrl = cleanLinkedInUrl(linkedinUrl);
    if (!cleanUrl) {
      console.log('Invalid LinkedIn URL provided');
      return null;
    }

    console.log(`Attempting to scrape LinkedIn profile: ${cleanUrl}`);
    
    // Fetch the LinkedIn page
    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    });

    if (!response.ok) {
      console.log(`Failed to fetch LinkedIn page: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Extract profile information using regex patterns
    const profile: LinkedInProfile = {};
    
    // Extract name from title or meta tags
    const nameMatch = html.match(/<title[^>]*>([^<]*(?:LinkedIn|Profile)[^<]*)<\/title>/i);
    if (nameMatch) {
      const titleText = nameMatch[1];
      const cleanName = titleText.replace(/\s*\|\s*LinkedIn.*$/i, '').trim();
      if (cleanName && cleanName !== 'LinkedIn') {
        profile.name = cleanName;
      }
    }

    // Try to extract from structured data
    const structuredDataMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]*)<\/script>/i);
    if (structuredDataMatch) {
      try {
        const data = JSON.parse(structuredDataMatch[1]);
        if (data.name) profile.name = data.name;
        if (data.jobTitle) profile.headline = data.jobTitle;
        if (data.worksFor && data.worksFor.name) profile.company = data.worksFor.name;
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }

    // Extract headline/job title
    const headlineMatch = html.match(/data-field="headline"[^>]*>([^<]+)</i) || 
                         html.match(/class="[^"]*headline[^"]*"[^>]*>([^<]+)</i);
    if (headlineMatch) {
      profile.headline = headlineMatch[1].trim();
    }

    // Extract company from current experience
    const companyMatch = html.match(/class="[^"]*company[^"]*"[^>]*>([^<]+)</i) ||
                        html.match(/data-field="company"[^>]*>([^<]+)</i);
    if (companyMatch) {
      profile.company = companyMatch[1].trim();
    }

    // Extract location
    const locationMatch = html.match(/data-field="location"[^>]*>([^<]+)</i) ||
                         html.match(/class="[^"]*location[^"]*"[^>]*>([^<]+)</i);
    if (locationMatch) {
      profile.location = locationMatch[1].trim();
    }

    // Extract about section
    const aboutMatch = html.match(/data-field="summary"[^>]*>([^<]+)</i) ||
                      html.match(/class="[^"]*summary[^"]*"[^>]*>([^<]+)</i);
    if (aboutMatch) {
      profile.about = aboutMatch[1].trim();
    }

    // Clean up extracted data
    Object.keys(profile).forEach(key => {
      if (typeof profile[key as keyof LinkedInProfile] === 'string') {
        (profile as any)[key] = (profile as any)[key]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .trim();
      }
    });

    console.log('Extracted profile data:', profile);
    return Object.keys(profile).length > 0 ? profile : null;

  } catch (error) {
    console.error('Error scraping LinkedIn profile:', error);
    return null;
  }
}

function cleanLinkedInUrl(url: string): string | null {
  try {
    // Remove any tracking parameters and normalize the URL
    let cleanUrl = url.trim();
    
    // Ensure it's a LinkedIn URL
    if (!cleanUrl.includes('linkedin.com')) {
      return null;
    }
    
    // Add https if missing
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    // Parse and clean the URL
    const urlObj = new URL(cleanUrl);
    if (!urlObj.hostname.includes('linkedin.com')) {
      return null;
    }
    
    // Ensure it's a profile URL
    if (!urlObj.pathname.includes('/in/')) {
      return null;
    }
    
    // Remove query parameters and hash
    urlObj.search = '';
    urlObj.hash = '';
    
    // Ensure the path ends properly
    let pathname = urlObj.pathname;
    if (!pathname.endsWith('/')) {
      pathname += '/';
    }
    
    return `${urlObj.protocol}//${urlObj.hostname}${pathname}`;
  } catch (error) {
    console.error('Error cleaning LinkedIn URL:', error);
    return null;
  }
}

export function generateEnhancedBio(profile: LinkedInProfile): string {
  const parts: string[] = [];
  
  if (profile.name) {
    parts.push(`Name: ${profile.name}`);
  }
  
  if (profile.headline) {
    parts.push(`Role: ${profile.headline}`);
  }
  
  if (profile.company) {
    parts.push(`Company: ${profile.company}`);
  }
  
  if (profile.location) {
    parts.push(`Location: ${profile.location}`);
  }
  
  if (profile.about) {
    parts.push(`About: ${profile.about}`);
  }
  
  if (profile.experience && profile.experience.length > 0) {
    parts.push(`Experience: ${profile.experience.join(', ')}`);
  }
  
  return parts.join('\n');
}
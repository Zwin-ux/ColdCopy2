import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import Stripe from "stripe";
import { storage } from "./storage";
import { generatePersonalizedMessage } from "./groq-engine";
import { scrapeLinkedInProfile, generateEnhancedBio } from "./linkedin-scraper";
import { insertUserSchema, insertMessageSchema, SUBSCRIPTION_PLANS } from "@shared/schema";
import { sendWelcomeEmail, sendLoginNotification } from "./email-service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

declare module "express-session" {
  interface SessionData {
    userId: number;
    anonymousMessagesUsed: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration for persistent login
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for persistent login
    }
  }));

  function requireAuth(req: any, res: any, next: any) {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  }

  // Register route with email notification
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Set session for persistent login
      req.session.userId = newUser.id;
      
      // Send welcome email with login info
      if (userData.email) {
        await sendWelcomeEmail(userData.email, userData.username);
      }

      res.json({ 
        message: "User created successfully",
        user: { id: newUser.id, username: newUser.username, email: newUser.email }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // Login route with email notification
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(400).json({ message: "Invalid username or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Invalid username or password" });
      }

      // Set session for persistent login
      req.session.userId = user.id;
      
      // Send login notification email
      if (user.email) {
        await sendLoginNotification(user.email, user.username);
      }

      res.json({ 
        message: "Login successful",
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, username: user.username, email: user.email });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Create Stripe checkout session
  app.post("/api/create-checkout-session", requireAuth, async (req, res) => {
    try {
      const { plan } = req.body;
      
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing temporarily unavailable" });
      }

      // Get plan details
      const planDetails = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
      if (!planDetails || plan === 'trial') {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `ColdCopy ${planDetails.name}`,
                description: `${planDetails.messagesPerMonth} AI-powered personalized messages per month`,
              },
              unit_amount: planDetails.price * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `http://localhost:5000/success`,
        cancel_url: `http://localhost:5000/cancel`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Generate message
  app.post("/api/generate-message", async (req, res) => {
    try {
      const { linkedinUrl, bioText, style, resume } = req.body;
      
      if (req.session?.userId) {
        // Authenticated user flow
        const user = await storage.getUser(req.session.userId);
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        // PAYWALL TEMPORARILY DISABLED FOR DEBUGGING
        // const canGenerate = await storage.canUserGenerateMessage(user.id);
        // if (!canGenerate) {
        //   return res.status(403).json({ 
        //     message: "You've reached your message limit for this month. Upgrade to Pro for unlimited messages!",
        //     redirectTo: "/pricing"
        //   });
        // }

        // Smart LinkedIn profile detection and enhancement
        let enhancedBioText = bioText;
        let extractedProfileData: any = null;
        
        if (linkedinUrl) {
          console.log('Attempting to scrape LinkedIn profile:', linkedinUrl);
          extractedProfileData = await scrapeLinkedInProfile(linkedinUrl);
          
          if (extractedProfileData) {
            console.log('Successfully extracted LinkedIn data:', extractedProfileData);
            
            // Generate enhanced bio text from scraped data
            const scrapedBio = generateEnhancedBio(extractedProfileData);
            
            // Combine user-provided bio with scraped data
            if (bioText) {
              enhancedBioText = `${bioText}\n\nDetected Profile Info:\n${scrapedBio}`;
            } else {
              enhancedBioText = scrapedBio;
            }
            
            console.log('Enhanced bio text:', enhancedBioText);
          } else {
            console.log('No profile data extracted from LinkedIn URL');
          }
        }

        const result = await generatePersonalizedMessage({
          linkedinUrl,
          bioText: enhancedBioText,
          templateId: style || 'professional',
          resume: resume || undefined,
          recipientName: extractedProfileData?.name,
          recipientCompany: extractedProfileData?.company,
          recipientRole: extractedProfileData?.headline,
          senderName: req.body.senderName,
          senderCompany: req.body.senderCompany,
          senderRole: req.body.senderRole,
          purpose: req.body.purpose
        });

        await storage.createMessage({
          generatedMessage: result.message,
          linkedinUrl,
          bioText,
          resumeContent: resume || undefined,
          personalizationScore: result.personalizationScore,
          wordCount: result.wordCount,
          estimatedResponseRate: result.estimatedResponseRate,
          userId: user.id
        });

        await storage.incrementMessageUsage(user.id);
        const updatedUser = await storage.getUser(user.id);
        const userPlan = SUBSCRIPTION_PLANS[updatedUser!.plan as keyof typeof SUBSCRIPTION_PLANS];

        res.json({
          ...result,
          messagesUsed: updatedUser!.messagesUsedThisMonth,
          messagesRemaining: userPlan.messagesPerMonth - updatedUser!.messagesUsedThisMonth
        });
      } else {
        // Anonymous user flow
        const anonymousMessagesUsed = req.session?.anonymousMessagesUsed || 0;
        
        if (anonymousMessagesUsed >= 1) {
          return res.status(403).json({ 
            message: "You've used your free message! Please create an account to generate another message for free.",
            requiresLogin: true
          });
        }

        const result = await generatePersonalizedMessage({
          linkedinUrl,
          bioText,
          templateId: style || "professional",
          resume: resume || undefined,
          senderName: req.body.senderName,
          senderCompany: req.body.senderCompany,
          senderRole: req.body.senderRole,
          purpose: req.body.purpose
        });

        await storage.createMessage({
          generatedMessage: result.message,
          linkedinUrl,
          bioText,
          resumeContent: resume || undefined,
          personalizationScore: result.personalizationScore,
          wordCount: result.wordCount,
          estimatedResponseRate: result.estimatedResponseRate
        });

        req.session.anonymousMessagesUsed = anonymousMessagesUsed + 1;

        res.json({
          ...result,
          messagesUsed: 1,
          messagesRemaining: 0,
          requiresLogin: true
        });
      }
    } catch (error: any) {
      console.error("Message generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate message" });
    }
  });

  // Get user subscription status
  app.get("/api/user/subscription", async (req, res) => {
    try {
      if (!req.session?.userId) {
        const anonymousMessagesUsed = req.session?.anonymousMessagesUsed || 0;
        return res.json({
          plan: "trial",
          subscriptionStatus: "trial",
          messagesUsed: anonymousMessagesUsed,
          messagesLimit: 1,
          messagesRemaining: Math.max(0, 1 - anonymousMessagesUsed),
          currentPeriodEnd: null
        });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userPlan = SUBSCRIPTION_PLANS[user.plan as keyof typeof SUBSCRIPTION_PLANS];
      
      res.json({
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus || "active",
        messagesUsed: user.messagesUsedThisMonth,
        messagesLimit: userPlan.messagesPerMonth,
        messagesRemaining: userPlan.messagesPerMonth - user.messagesUsedThisMonth,
        currentPeriodEnd: user.currentPeriodEnd
      });
    } catch (error) {
      console.error("Subscription status error:", error);
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });

  // Get messages
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
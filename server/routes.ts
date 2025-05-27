import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePersonalizedMessage } from "./groq-engine";
import { generateMessageRequestSchema, insertUserSchema, SUBSCRIPTION_PLANS } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import MemoryStore from "memorystore";
import Stripe from "stripe";

// Extend session data type
declare module 'express-session' {
  interface SessionData {
    userId: number;
    anonymousMessagesUsed: number;
  }
}

const upload = multer({ storage: multer.memoryStorage() });

// Configure session
const MemStore = MemoryStore(session);

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY not found - payment functionality will be disabled");
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  function requireAuth(req: any, res: any, next: any) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  }

  // Register route
  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      if (validatedData.email) {
        const existingEmailUser = await storage.getUserByEmail(validatedData.email);
        if (existingEmailUser) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });

      // Set session
      req.session.userId = user.id;

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // Login route
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Generate message route
  app.post("/api/messages/generate", upload.single('resume'), async (req, res) => {
    try {
      // Parse form data
      const linkedinUrl = Array.isArray(req.body.linkedinUrl) ? req.body.linkedinUrl[0] : req.body.linkedinUrl;
      const bioText = Array.isArray(req.body.bioText) ? req.body.bioText[0] : req.body.bioText;
      const style = Array.isArray(req.body.style) ? req.body.style[0] : req.body.style;
      
      // Validate required fields
      if (!linkedinUrl && !bioText) {
        return res.status(400).json({ 
          message: "Please provide either a LinkedIn URL or bio text to generate a personalized message." 
        });
      }

      // Handle resume file
      let resumeContent = null;
      if (req.file) {
        resumeContent = req.file.buffer.toString('utf-8');
      }

      // Check user authentication and limits
      if (req.session.userId) {
        // User is logged in - check their message limit
        const user = await storage.getUser(req.session.userId);
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        const canGenerate = await storage.canUserGenerateMessage(user.id);
        if (!canGenerate) {
          const userPlan = SUBSCRIPTION_PLANS[user.plan as keyof typeof SUBSCRIPTION_PLANS];
          return res.status(403).json({ 
            message: `You've reached your monthly limit of ${userPlan.messagesPerMonth} messages. Please upgrade your plan to continue.`,
            requiresUpgrade: true
          });
        }

        // Generate message
        const result = await generatePersonalizedMessage({
          linkedinUrl,
          bioText,
          style: style || "professional",
          resume: resumeContent
        });

        // Save message and increment usage
        await storage.createMessage({
          generatedMessage: result.message,
          linkedinUrl,
          bioText,
          resumeContent,
          personalizationScore: result.personalizationScore,
          wordCount: result.wordCount,
          estimatedResponseRate: result.estimatedResponseRate
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
        // Anonymous user - allow only 1 free message, then require signup
        // For simplicity, we'll use session to track anonymous usage
        const anonymousMessagesUsed = req.session.anonymousMessagesUsed || 0;
        
        if (anonymousMessagesUsed >= 1) {
          return res.status(403).json({ 
            message: "You've used your free message! Please create an account to generate another message for free.",
            requiresLogin: true
          });
        }

        // Generate message for anonymous user
        const result = await generatePersonalizedMessage({
          linkedinUrl,
          bioText,
          style: style || "professional",
          resume: resumeContent
        });

        // Save message without user ID
        await storage.createMessage({
          generatedMessage: result.message,
          linkedinUrl,
          bioText,
          resumeContent,
          personalizationScore: result.personalizationScore,
          wordCount: result.wordCount,
          estimatedResponseRate: result.estimatedResponseRate
        });

        // Increment anonymous usage
        req.session.anonymousMessagesUsed = anonymousMessagesUsed + 1;

        res.json({
          ...result,
          messagesUsed: 1,
          messagesRemaining: 0,
          requiresLogin: true // Signal that they need to register for more
        });
      }

    } catch (error: any) {
      console.error("Message generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate message" });
    }
  });

  // Get user subscription status
  app.get("/api/user/subscription", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userPlan = SUBSCRIPTION_PLANS[user.plan as keyof typeof SUBSCRIPTION_PLANS];
      
      res.json({
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        messagesUsed: user.messagesUsedThisMonth,
        messagesLimit: userPlan.messagesPerMonth,
        messagesRemaining: userPlan.messagesPerMonth - user.messagesUsedThisMonth,
        currentPeriodEnd: user.currentPeriodEnd
      });
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });

  // Stripe payment routes (only if Stripe is configured)
  if (stripe) {
    // Create payment intent for one-time payments
    app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
      try {
        const { amount } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        console.error("Payment intent error:", error);
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });

    // Webhook to handle successful payments
    app.post("/api/webhook", async (req, res) => {
      try {
        const event = req.body;

        if (event.type === 'payment_intent.succeeded') {
          // Handle successful payment
          console.log('Payment succeeded:', event.data.object);
        }

        res.json({ received: true });
      } catch (error) {
        console.error("Webhook error:", error);
        res.status(400).json({ message: "Webhook error" });
      }
    });
  } else {
    // Disabled Stripe routes
    app.post("/api/create-payment-intent", (req, res) => {
      res.status(503).json({ message: "Payment functionality is not configured" });
    });
  }

  // Get all messages (for admin/debugging)
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
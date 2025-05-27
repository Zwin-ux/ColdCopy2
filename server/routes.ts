import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { generateMessageRequestSchema, insertMessageSchema, subscriptionSchema, SUBSCRIPTION_PLANS, type Plan } from "@shared/schema";
import { generatePersonalizedMessage } from "./groq-engine";
import multer from "multer";
import Stripe from "stripe";
import { z } from "zod";

// No AI dependencies - using smart template system instead

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

// Stripe Price IDs (these should be set in your Stripe dashboard)
const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
  agency: process.env.STRIPE_AGENCY_PRICE_ID || 'price_agency_placeholder'
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // OAuth placeholder routes (requires setup of OAuth credentials)
  app.get("/api/auth/google", (req, res) => {
    res.status(501).json({ 
      message: "Google OAuth requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables. Please contact support to enable social login." 
    });
  });

  app.get("/api/auth/apple", (req, res) => {
    res.status(501).json({ 
      message: "Apple OAuth requires Apple Developer credentials. Please contact support to enable social login." 
    });
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create new user
      const newUser = await storage.createUser({
        username,
        email,
        password, // In production, this should be hashed
      });

      // Log the user in
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in after registration" });
        }
        res.json({ user: { id: newUser.id, username: newUser.username, email: newUser.email } });
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) { // In production, use proper password hashing
        return res.status(401).json({ error: "Invalid username or password" });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in" });
        }
        res.json({ user: { id: user.id, username: user.username, email: user.email } });
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: { id: req.user.id, username: req.user.username, email: req.user.email } });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
  // Generate personalized outreach message with usage tracking
  app.post("/api/generate-message", upload.single('resume'), async (req, res) => {
    try {
      const { linkedinUrl, bioText } = req.body;
      
      // For demo purposes, simulate a logged-in user (in real app, get from session/auth)
      const userId = 1; // In production, this would come from authentication
      
      // Check if user can generate messages (usage limit)
      const canGenerate = await storage.canUserGenerateMessage(userId);
      if (!canGenerate) {
        const user = await storage.getUser(userId);
        const userPlan = SUBSCRIPTION_PLANS[user?.plan as Plan || 'free'];
        return res.status(403).json({ 
          message: `You've reached your ${userPlan.messagesPerMonth} message limit for this month. Upgrade your plan to generate more messages.`,
          currentUsage: user?.messagesUsedThisMonth || 0,
          planLimit: userPlan.messagesPerMonth,
          plan: user?.plan || 'free'
        });
      }
      
      // Validate input
      const validatedInput = generateMessageRequestSchema.parse({
        linkedinUrl: linkedinUrl || undefined,
        bioText: bioText || undefined,
        resumeContent: req.file ? req.file.buffer.toString('utf-8') : undefined
      });

      if (!validatedInput.linkedinUrl && !validatedInput.bioText) {
        return res.status(400).json({ 
          message: "Please provide at least a LinkedIn URL or bio text" 
        });
      }

      // Generate message using Groq AI
      const { templateId, recipientName, recipientCompany, recipientRole } = req.body;
      
      const generatedMessage = await generatePersonalizedMessage({
        linkedinUrl: validatedInput.linkedinUrl,
        bioText: validatedInput.bioText,
        templateId: templateId || 'professional_intro',
        recipientName: recipientName,
        recipientCompany: recipientCompany,
        recipientRole: recipientRole,
        resume: validatedInput.resumeContent
      });

      // Store the generated message
      const messageRecord = await storage.createMessage({
        linkedinUrl: validatedInput.linkedinUrl,
        bioText: validatedInput.bioText,
        resumeContent: validatedInput.resumeContent,
        generatedMessage: generatedMessage.message,
        personalizationScore: generatedMessage.personalizationScore,
        wordCount: generatedMessage.wordCount,
        estimatedResponseRate: generatedMessage.estimatedResponseRate
      });

      // Increment user's message usage count
      await storage.incrementMessageUsage(userId);
      
      // Get updated user data to return current usage
      const updatedUser = await storage.getUser(userId);
      const userPlan = SUBSCRIPTION_PLANS[updatedUser?.plan as Plan || 'free'];

      res.json({
        id: messageRecord.id,
        message: generatedMessage.message,
        personalizationScore: generatedMessage.personalizationScore,
        wordCount: generatedMessage.wordCount,
        estimatedResponseRate: generatedMessage.estimatedResponseRate,
        templateUsed: generatedMessage.templateName,
        usage: {
          used: updatedUser?.messagesUsedThisMonth || 0,
          limit: userPlan.messagesPerMonth,
          remaining: userPlan.messagesPerMonth - (updatedUser?.messagesUsedThisMonth || 0)
        }
      });

    } catch (error) {
      console.error("Error generating message:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ 
          message: error.message 
        });
      }

      res.status(500).json({ 
        message: "Failed to generate message. Please try again with different inputs." 
      });
    }
  });

  // Get all messages
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get specific message
  app.get("/api/messages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      const message = await storage.getMessageById(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.json(message);
    } catch (error) {
      console.error("Error fetching message:", error);
      res.status(500).json({ message: "Failed to fetch message" });
    }
  });

  // Get user subscription status and usage
  app.get("/api/user/subscription", async (req, res) => {
    try {
      const userId = 1; // In production, get from authentication
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userPlan = SUBSCRIPTION_PLANS[user.plan as Plan];
      
      res.json({
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        messagesUsed: user.messagesUsedThisMonth,
        messagesLimit: userPlan.messagesPerMonth,
        messagesRemaining: userPlan.messagesPerMonth - user.messagesUsedThisMonth,
        currentPeriodEnd: user.currentPeriodEnd
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription data" });
    }
  });

  // Create Stripe checkout session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { plan } = subscriptionSchema.parse(req.body);
      const userId = 1; // In production, get from authentication
      
      if (plan === 'free') {
        return res.status(400).json({ message: "Cannot create checkout for free plan" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || `user${userId}@example.com`,
          metadata: { userId: userId.toString() }
        });
        customerId = customer.id;
        await storage.updateUserSubscription(userId, { stripeCustomerId: customerId });
      }

      const priceId = STRIPE_PRICE_IDS[plan as keyof typeof STRIPE_PRICE_IDS];
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/cancel`,
        metadata: {
          userId: userId.toString(),
          plan: plan
        }
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Stripe webhook for handling subscription events
  app.post("/api/webhooks/stripe", async (req, res) => {
    let event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(req.body, signature as string, webhookSecret);
      } else {
        event = req.body;
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send('Webhook signature verification failed');
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = parseInt(session.metadata?.userId || '0');
          const plan = session.metadata?.plan as Plan;
          
          if (userId && plan) {
            await storage.updateUserSubscription(userId, {
              stripeSubscriptionId: session.subscription as string,
              plan: plan,
              subscriptionStatus: 'active'
            });
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = parseInt(subscription.metadata?.userId || '0');
          
          if (userId) {
            await storage.updateUserSubscription(userId, {
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              subscriptionStatus: 'active'
            });
            // Reset monthly usage at the start of new billing period
            await storage.resetMonthlyUsage(userId);
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = parseInt(subscription.metadata?.userId || '0');
          
          if (userId) {
            await storage.updateUserSubscription(userId, {
              subscriptionStatus: 'past_due'
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = parseInt(subscription.metadata?.userId || '0');
          
          if (userId) {
            await storage.updateUserSubscription(userId, {
              plan: 'free',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null
            });
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Cancel subscription
  app.post("/api/cancel-subscription", async (req, res) => {
    try {
      const userId = 1; // In production, get from authentication
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      res.json({ message: "Subscription will be canceled at the end of the current period" });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

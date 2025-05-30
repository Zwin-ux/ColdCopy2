import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").notNull().default("free"), // 'free', 'pro', 'agency'
  messagesUsedThisMonth: integer("messages_used_this_month").notNull().default(0),
  subscriptionStatus: text("subscription_status").default("active"), // 'active', 'canceled', 'past_due'
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  linkedinUrl: text("linkedin_url"),
  bioText: text("bio_text"),
  resumeContent: text("resume_content"),
  generatedMessage: text("generated_message").notNull(),
  personalizationScore: integer("personalization_score"),
  wordCount: integer("word_count"),
  estimatedResponseRate: integer("estimated_response_rate"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
}).extend({
  linkedinUrl: z.string().url().optional(),
  bioText: z.string().max(500).optional(),
});

export const generateMessageRequestSchema = z.object({
  linkedinUrl: z.string().url().optional(),
  bioText: z.string().max(500).optional(),
  resumeContent: z.string().optional(),
  // User's own information to prevent AI hallucination
  senderName: z.string().min(2).max(50).optional(),
  senderCompany: z.string().max(100).optional(),
  senderRole: z.string().max(100).optional(),
  purpose: z.string().max(200).optional(),
});

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  trial: {
    name: "Free Trial",
    price: 0,
    messagesPerMonth: 2,
    features: [
      "2 free messages",
      "AI-powered personalization", 
      "LinkedIn profile analysis",
      "No credit card required"
    ]
  },
  pro: {
    name: "Pro", 
    price: 5,
    messagesPerMonth: 500,
    features: [
      "500 messages per month", 
      "All free features",
      "Message history & analytics",
      "Export your messages",
      "Priority support"
    ]
  },
  agency: {
    name: "Ultimate",
    price: 20, 
    messagesPerMonth: 5000,
    features: [
      "5,000 messages per month",
      "All Pro features",
      "Unlimited message history",
      "Advanced analytics dashboard",
      "Priority support"
    ]
  }
} as const;

export type Plan = keyof typeof SUBSCRIPTION_PLANS;

export const subscriptionSchema = z.object({
  plan: z.enum(["trial", "pro", "agency"]),
  priceId: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type GenerateMessageRequest = z.infer<typeof generateMessageRequestSchema>;
export type SubscriptionData = z.infer<typeof subscriptionSchema>;

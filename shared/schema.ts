import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
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
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type GenerateMessageRequest = z.infer<typeof generateMessageRequestSchema>;

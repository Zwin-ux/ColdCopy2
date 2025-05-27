import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMessageRequestSchema, insertMessageSchema } from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import { z } from "zod";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

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
  // Generate personalized outreach message
  app.post("/api/generate-message", upload.single('resume'), async (req, res) => {
    try {
      const { linkedinUrl, bioText } = req.body;
      
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

      // Construct prompt for OpenAI
      let prompt = "You are an expert at writing personalized outreach messages. Create a professional, personalized outreach message based on the following information:\n\n";
      
      if (validatedInput.linkedinUrl) {
        prompt += `LinkedIn Profile: ${validatedInput.linkedinUrl}\n`;
      }
      
      if (validatedInput.bioText) {
        prompt += `Additional Context/Bio: ${validatedInput.bioText}\n`;
      }
      
      if (validatedInput.resumeContent) {
        prompt += `Sender's Background (Resume): ${validatedInput.resumeContent.substring(0, 1000)}\n`;
      }

      prompt += `\nPlease generate a personalized outreach message that:
1. Is professional and authentic
2. References specific details from the provided information
3. Is concise (100-150 words)
4. Has a clear call to action
5. Feels personal, not templated

Return the response in JSON format with the following structure:
{
  "message": "the generated message text",
  "personalizationScore": number between 1-100,
  "wordCount": number of words in the message,
  "estimatedResponseRate": estimated response rate percentage 1-100
}`;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are an expert outreach message writer." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate the AI response structure
      const aiResponse = z.object({
        message: z.string(),
        personalizationScore: z.number().min(1).max(100),
        wordCount: z.number().min(1),
        estimatedResponseRate: z.number().min(1).max(100)
      }).parse(result);

      // Store the generated message
      const messageRecord = await storage.createMessage({
        linkedinUrl: validatedInput.linkedinUrl,
        bioText: validatedInput.bioText,
        resumeContent: validatedInput.resumeContent,
        generatedMessage: aiResponse.message,
        personalizationScore: aiResponse.personalizationScore,
        wordCount: aiResponse.wordCount,
        estimatedResponseRate: aiResponse.estimatedResponseRate
      });

      res.json({
        id: messageRecord.id,
        message: aiResponse.message,
        personalizationScore: aiResponse.personalizationScore,
        wordCount: aiResponse.wordCount,
        estimatedResponseRate: aiResponse.estimatedResponseRate
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
        message: "Failed to generate message. Please check your OpenAI API key and try again." 
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

  const httpServer = createServer(app);
  return httpServer;
}

import { users, messages, ipUsageTracking, type User, type InsertUser, type Message, type InsertMessage, type Plan, SUBSCRIPTION_PLANS } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createMessage(message: InsertMessage & { userId?: number; ipAddress?: string }): Promise<Message>;
  getMessages(): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  
  // Subscription management
  updateUserSubscription(userId: number, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan?: Plan;
    subscriptionStatus?: string;
    currentPeriodEnd?: Date;
  }): Promise<User>;
  incrementMessageUsage(userId: number): Promise<User>;
  resetMonthlyUsage(userId: number): Promise<User>;
  canUserGenerateMessage(userId: number): Promise<boolean>;
  
  // IP-based trial tracking for anonymous users
  getIpUsage(ipAddress: string): Promise<{ messagesUsed: number; canGenerate: boolean }>;
  incrementIpUsage(ipAddress: string): Promise<void>;
  checkTrialEligibility(userId?: number, ipAddress?: string): Promise<{
    canGenerate: boolean;
    messagesUsed: number;
    requiresLogin: boolean;
    requiresUpgrade: boolean;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private ipTracking: Map<string, { messagesUsed: number; lastResetDate: Date }>;
  private currentUserId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.ipTracking = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    
    // Create a demo user for testing
    this.createDemoUser();
  }

  private async createDemoUser() {
    const demoUser: User = {
      id: 1,
      username: "demo",
      password: "demo",
      email: "demo@coldcopy.com",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      plan: "trial",
      messagesUsedThisMonth: 0, // Production ready - start fresh
      subscriptionStatus: "active",
      currentPeriodEnd: null,
      createdAt: new Date()
    };
    this.users.set(1, demoUser);
    this.currentUserId = 2; // Next user will get ID 2
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      email: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      plan: "trial",
      messagesUsedThisMonth: 0,
      subscriptionStatus: "active",
      currentPeriodEnd: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async createMessage(insertMessage: InsertMessage & { userId?: number; ipAddress?: string }): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage,
      linkedinUrl: insertMessage.linkedinUrl || null,
      bioText: insertMessage.bioText || null,
      resumeContent: insertMessage.resumeContent || null,
      personalizationScore: insertMessage.personalizationScore || null,
      wordCount: insertMessage.wordCount || null,
      estimatedResponseRate: insertMessage.estimatedResponseRate || null,
      userId: insertMessage.userId || null,
      ipAddress: insertMessage.ipAddress || null,
      id,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  // Subscription management methods
  async updateUserSubscription(userId: number, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan?: Plan;
    subscriptionStatus?: string;
    currentPeriodEnd?: Date;
  }): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...user,
      ...data
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async incrementMessageUsage(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...user,
      messagesUsedThisMonth: user.messagesUsedThisMonth + 1
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async resetMonthlyUsage(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...user,
      messagesUsedThisMonth: 0
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async canUserGenerateMessage(userId: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    const { SUBSCRIPTION_PLANS } = await import("@shared/schema");
    const userPlan = SUBSCRIPTION_PLANS[user.plan as Plan];
    
    return user.messagesUsedThisMonth < userPlan.messagesPerMonth;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    if (!db) throw new Error('Database not available');
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error('Database not available');
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error('Database not available');
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(messages.createdAt);
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  // Subscription management methods
  async updateUserSubscription(userId: number, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan?: Plan;
    subscriptionStatus?: string;
    currentPeriodEnd?: Date;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async incrementMessageUsage(userId: number): Promise<User> {
    // Get current user first, then increment
    const currentUser = await this.getUser(userId);
    if (!currentUser) throw new Error("User not found");
    
    const [user] = await db
      .update(users)
      .set({ 
        messagesUsedThisMonth: currentUser.messagesUsedThisMonth + 1
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async resetMonthlyUsage(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ messagesUsedThisMonth: 0 })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async canUserGenerateMessage(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }

    const userPlan = SUBSCRIPTION_PLANS[user.plan as Plan];
    return user.messagesUsedThisMonth < userPlan.messagesPerMonth;
  }
}

// Smart storage that tries database first, falls back to memory
class HybridStorage implements IStorage {
  private dbStorage: DatabaseStorage;
  private memStorage: MemStorage;
  private useDatabase: boolean = true;

  constructor() {
    this.dbStorage = new DatabaseStorage();
    this.memStorage = new MemStorage();
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      // Test database connection
      await this.dbStorage.getUser(1);
      console.log("✅ Database connected successfully");
    } catch (error) {
      console.log("⚠️  Database unavailable, using in-memory storage");
      this.useDatabase = false;
    }
  }

  private getActiveStorage(): IStorage {
    return this.useDatabase ? this.dbStorage : this.memStorage;
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      return await this.getActiveStorage().getUser(id);
    } catch (error) {
      if (this.useDatabase) {
        console.log("Database error, falling back to memory storage");
        this.useDatabase = false;
        return await this.memStorage.getUser(id);
      }
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      return await this.getActiveStorage().getUserByUsername(username);
    } catch (error) {
      if (this.useDatabase) {
        this.useDatabase = false;
        return await this.memStorage.getUserByUsername(username);
      }
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      return await this.getActiveStorage().createUser(user);
    } catch (error) {
      if (this.useDatabase) {
        this.useDatabase = false;
        return await this.memStorage.createUser(user);
      }
      throw error;
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      return await this.getActiveStorage().createMessage(message);
    } catch (error) {
      if (this.useDatabase) {
        this.useDatabase = false;
        return await this.memStorage.createMessage(message);
      }
      throw error;
    }
  }

  async getMessages(): Promise<Message[]> {
    try {
      return await this.getActiveStorage().getMessages();
    } catch (error) {
      if (this.useDatabase) {
        this.useDatabase = false;
        return await this.memStorage.getMessages();
      }
      throw error;
    }
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    try {
      return await this.getActiveStorage().getMessageById(id);
    } catch (error) {
      if (this.useDatabase) {
        this.useDatabase = false;
        return await this.memStorage.getMessageById(id);
      }
      throw error;
    }
  }

  async updateUserSubscription(userId: number, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan?: Plan;
    subscriptionStatus?: string;
    currentPeriodEnd?: Date;
  }): Promise<User> {
    try {
      return await this.getActiveStorage().updateUserSubscription(userId, data);
    } catch (error) {
      if (this.useDatabase) {
        this.useDatabase = false;
        return await this.memStorage.updateUserSubscription(userId, data);
      }
      throw error;
    }
  }

  async incrementMessageUsage(userId: number): Promise<User> {
    try {
      return await this.getActiveStorage().incrementMessageUsage(userId);
    } catch (error) {
      if (this.useDatabase) {
        this.useDatabase = false;
        return await this.memStorage.incrementMessageUsage(userId);
      }
      throw error;
    }
  }

  async resetMonthlyUsage(userId: number): Promise<User> {
    try {
      return await this.getActiveStorage().resetMonthlyUsage(userId);
    } catch (error) {
      if (this.useDatabase) {
        this.useDatabase = false;
        return await this.memStorage.resetMonthlyUsage(userId);
      }
      throw error;
    }
  }

  async canUserGenerateMessage(userId: number): Promise<boolean> {
    try {
      return await this.getActiveStorage().canUserGenerateMessage(userId);
    } catch (error) {
      if (this.useDatabase) {
        this.useDatabase = false;
        return await this.memStorage.canUserGenerateMessage(userId);
      }
      throw error;
    }
  }
}

// Use memory storage for now to ensure app runs smoothly
export const storage = new MemStorage();

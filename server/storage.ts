import { users, messages, type User, type InsertUser, type Message, type InsertMessage, type Plan, SUBSCRIPTION_PLANS } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createMessage(message: InsertMessage): Promise<Message>;
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    
    // Create a demo user for testing
    this.createDemoUser();
  }

  private async createDemoUser() {
    const demoUser: User = {
      id: 1,
      username: "demo",
      email: "demo@example.com",
      password: "$2b$10$K7L.z9QXQ9QZQK.x4x9Qhu",
      plan: "trial",
      messagesUsedThisMonth: 0,
      subscriptionStatus: "active",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      createdAt: new Date()
    };
    this.users.set(1, demoUser);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser,
      email: insertUser.email || null,
      id,
      plan: "trial",
      messagesUsedThisMonth: 0,
      subscriptionStatus: "active",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage,
      linkedinUrl: insertMessage.linkedinUrl || null,
      bioText: insertMessage.bioText || null,
      resumeContent: insertMessage.resumeContent || null,
      personalizationScore: insertMessage.personalizationScore || null,
      wordCount: insertMessage.wordCount || null,
      estimatedResponseRate: insertMessage.estimatedResponseRate || null,
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
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }
    
    const userPlan = SUBSCRIPTION_PLANS[user.plan as keyof typeof SUBSCRIPTION_PLANS];
    if (!userPlan) {
      return false;
    }
    
    return user.messagesUsedThisMonth < userPlan.messagesPerMonth;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        plan: "trial",
        messagesUsedThisMonth: 0,
        subscriptionStatus: "active"
      })
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
    return await db.select().from(messages).orderBy(sql`${messages.createdAt} DESC`);
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

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
    const [user] = await db
      .update(users)
      .set({ messagesUsedThisMonth: sql`${users.messagesUsedThisMonth} + 1` })
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
    
    const userPlan = SUBSCRIPTION_PLANS[user.plan as keyof typeof SUBSCRIPTION_PLANS];
    if (!userPlan) {
      return false;
    }
    
    return user.messagesUsedThisMonth < userPlan.messagesPerMonth;
  }
}

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
      this.useDatabase = true;
      console.log("[Storage] Using database storage");
    } catch (error) {
      this.useDatabase = false;
      console.log("[Storage] Database unavailable, using memory storage");
    }
  }

  private getActiveStorage(): IStorage {
    return this.useDatabase ? this.dbStorage : this.memStorage;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.getActiveStorage().getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.getActiveStorage().getUserByUsername(username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.getActiveStorage().getUserByEmail(email);
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.getActiveStorage().createUser(user);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    return this.getActiveStorage().createMessage(message);
  }

  async getMessages(): Promise<Message[]> {
    return this.getActiveStorage().getMessages();
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return this.getActiveStorage().getMessageById(id);
  }

  async updateUserSubscription(userId: number, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan?: Plan;
    subscriptionStatus?: string;
    currentPeriodEnd?: Date;
  }): Promise<User> {
    return this.getActiveStorage().updateUserSubscription(userId, data);
  }

  async incrementMessageUsage(userId: number): Promise<User> {
    return this.getActiveStorage().incrementMessageUsage(userId);
  }

  async resetMonthlyUsage(userId: number): Promise<User> {
    return this.getActiveStorage().resetMonthlyUsage(userId);
  }

  async canUserGenerateMessage(userId: number): Promise<boolean> {
    return this.getActiveStorage().canUserGenerateMessage(userId);
  }
}

export const storage = new MemStorage();
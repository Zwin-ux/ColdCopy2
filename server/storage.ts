import { users, messages, type User, type InsertUser, type Message, type InsertMessage, type Plan } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
      password: "demo",
      email: "demo@coldcopy.com",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      plan: "free",
      messagesUsedThisMonth: 3, // Start with some usage for demo
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      email: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      plan: "free",
      messagesUsedThisMonth: 0,
      subscriptionStatus: "active",
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

export const storage = new MemStorage();

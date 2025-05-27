import { db } from "./db";
import { users } from "@shared/schema";

export async function initializeDatabase() {
  try {
    // Create demo user if it doesn't exist
    const existingUser = await db.select().from(users).limit(1);
    
    if (existingUser.length === 0) {
      await db.insert(users).values({
        username: "demo",
        password: "demo",
        email: "demo@coldcopy.com",
        plan: "free",
        messagesUsedThisMonth: 3,
        subscriptionStatus: "active"
      });
      console.log("Demo user created successfully");
    }
  } catch (error) {
    console.log("Database initialization skipped - will use in-memory storage");
    return false;
  }
  return true;
}
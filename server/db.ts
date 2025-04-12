import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure ws for the Neon database connection
neonConfig.webSocketConstructor = ws;

console.log('Setting up database connection...');

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Using the standard connection - no custom configuration that might cause issues
// The previous error was because we were trying to manually modify the WebSocket security settings
const dbUrl = process.env.DATABASE_URL;
console.log('Connecting to database...');

// Create connection pool with default settings
export const pool = new Pool({ 
  connectionString: dbUrl,
});

// Initialize Drizzle ORM with our schema
export const db = drizzle(pool, { schema });
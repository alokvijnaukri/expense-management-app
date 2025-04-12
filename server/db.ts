import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure ws for the Neon database connection
neonConfig.webSocketConstructor = ws;

// Force wss when using Neon with WebSockets
// This can be disabled in environments where TLS is not available
const useWSS = process.env.NEON_FORCE_WSS !== 'false';
if (!useWSS) {
  console.log('⚠️ Warning: Neon WebSocket Secure (WSS) is disabled. This should only be used for development.');
}

// Additional Neon config for HTTP environments
neonConfig.useSecureWebSocket = useWSS; // Set to false if you're having SSL/TLS issues
neonConfig.pipelineTLS = useWSS;        // Set to false in non-TLS environments

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Remove forced HTTPS in connection string if needed
let dbUrl = process.env.DATABASE_URL;
if (!useWSS && dbUrl.includes('https://')) {
  // Convert https:// to http:// for environments that can't use TLS
  dbUrl = dbUrl.replace('https://', 'http://');
  console.log('Database connection converted to HTTP for compatibility');
}

console.log(`Connecting to database using ${useWSS ? 'secure' : 'non-secure'} WebSockets`);

export const pool = new Pool({ 
  connectionString: dbUrl,
  connect_timeout: 10, // Increased timeout (in seconds) for slower connections
});

export const db = drizzle(pool, { schema });
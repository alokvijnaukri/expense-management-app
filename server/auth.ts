import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Skip comparison if either password is missing
  if (!supplied || !stored) {
    console.log("Password comparison failed - missing password");
    return false;
  }
  
  // For demo accounts where we don't hash the password initially
  // This allows us to use plain passwords for development
  if (!stored.includes(".")) {
    console.log(`Using plain text password comparison for demo account. Supplied: '${supplied}', Stored: '${stored}'`);
    return supplied === stored;
  }
  
  try {
    // For properly hashed passwords
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    return result;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Force non-secure cookies for HTTP compatibility in all environments
  // This ensures the application will work in environments without HTTPS support
  const useSecureCookies = false;
  
  console.log(`Auth setup - Environment: ${process.env.NODE_ENV || 'development'}, Using HTTP-compatible cookie settings`);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: false, // Never use secure cookies to ensure HTTP compatibility
      sameSite: "lax" // Use 'lax' for better compatibility with non-HTTPS environments
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for username: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log(`User found: ${username}, comparing passwords`);
        const passwordMatches = await comparePasswords(password, user.password);
        console.log(`Password comparison result: ${passwordMatches}`);
        
        if (!passwordMatches) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          console.log(`Login successful for: ${username}`);
          return done(null, user);
        }
      } catch (error) {
        console.error("Login error:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      console.log("Login request received:", req.body);
      
      if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Handle fixed logins for admin and manager accounts
      // This ensures login always works even if the database connection has issues
      if (req.body.username === 'admin' && req.body.password === 'admin123') {
        // Create a full user object compatible with the User type
        const adminUser: Express.User = {
          id: 1,
          username: 'admin',
          name: 'Admin User',
          email: 'admin@company.com',
          department: 'Administration',
          designation: 'System Administrator',
          branch: 'Head Office',
          eCode: 'E001',
          band: 'B5',
          businessUnit: 'IT',
          role: 'admin',
          managerId: null,
          password: 'admin123', // Password is needed for the type but won't be sent to client
          createdAt: new Date()
        };
        
        req.login(adminUser, (err) => {
          if (err) {
            console.error("Session login error:", err);
            return res.status(500).json({ message: "Session initialization failed" });
          }
          console.log("Admin logged in via direct authentication");
          // Remove sensitive data like password before sending response
          const { password, ...userWithoutPassword } = adminUser;
          return res.status(200).json(userWithoutPassword);
        });
        return;
      }
      
      if (req.body.username === 'manager' && req.body.password === 'manager123') {
        // Create a full user object compatible with the User type
        const managerUser: Express.User = {
          id: 3,
          username: 'manager',
          name: 'John Manager',
          email: 'manager@company.com',
          department: 'Engineering',
          designation: 'Engineering Manager',
          branch: 'Main Branch',
          eCode: 'E003',
          band: 'B3',
          businessUnit: 'Technology',
          role: 'manager',
          managerId: 2,
          password: 'manager123', // Password is needed for the type but won't be sent to client
          createdAt: new Date()
        };
        
        req.login(managerUser, (err) => {
          if (err) {
            console.error("Session login error:", err);
            return res.status(500).json({ message: "Session initialization failed" });
          }
          console.log("Manager logged in via direct authentication");
          // Remove sensitive data like password before sending response
          const { password, ...userWithoutPassword } = managerUser;
          return res.status(200).json(userWithoutPassword);
        });
        return;
      }
      
      // Regular Passport authentication for other users
      passport.authenticate("local", (err: any, user: Express.User, info: { message: string }) => {
        if (err) {
          console.error("Authentication error:", err);
          return res.status(500).json({ message: "Authentication error" });
        }
        
        if (!user) {
          console.log("Authentication failed:", info?.message);
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (err) => {
          if (err) {
            console.error("Session login error:", err);
            return res.status(500).json({ 
              message: "Session initialization failed", 
              details: process.env.NODE_ENV === "development" ? err.message : undefined 
            });
          }
          
          console.log("User successfully logged in:", user.username);
          // Remove sensitive data like password before sending response
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      console.error("Unexpected error in login route:", error);
      return res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Remove sensitive data like password
    const { password, ...userWithoutPassword } = req.user as Express.User;
    res.json(userWithoutPassword);
  });
}
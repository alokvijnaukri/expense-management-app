import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { setupAuth } from "./auth";
import { 
  insertClaimSchema, 
  insertApprovalSchema, 
  ClaimStatus, 
  travelExpenseSchema,
  businessPromotionSchema,
  conveyanceClaimSchema,
  mobileBillSchema,
  relocationExpenseSchema,
  otherClaimsSchema
} from "@shared/schema";
import { formatZodError } from "../shared/utils";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  // The auth routes are now handled by passport in auth.ts

  // User routes
  app.get("/api/users/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as Express.User;
    // Remove sensitive data like password
    const { password, ...userResponse } = user;
    
    return res.status(200).json(userResponse);
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      designation: user.designation,
      branch: user.branch,
      eCode: user.eCode,
      band: user.band,
      businessUnit: user.businessUnit,
    });
  });

  // Claims routes
  app.get("/api/claims", async (req: Request, res: Response) => {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const status = req.query.status as string | undefined;

    let claims = [];
    
    if (userId && status) {
      claims = await storage.getClaimsByUserIdAndStatus(userId, status);
    } else if (userId) {
      claims = await storage.getClaimsByUserId(userId);
    } else if (status) {
      claims = await storage.getClaimsByStatus(status);
    } else {
      claims = await storage.getAllClaims();
    }

    // Set cache-control headers to prevent excessive caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    return res.status(200).json(claims);
  });

  app.get("/api/claims/approval", async (req: Request, res: Response) => {
    const approverId = req.query.approverId ? parseInt(req.query.approverId as string) : undefined;
    
    if (!approverId) {
      return res.status(400).json({ message: "Approver ID is required" });
    }

    const claims = await storage.getClaimsForApproval(approverId);
    return res.status(200).json(claims);
  });

  app.get("/api/claims/:id", async (req: Request, res: Response) => {
    const claimId = parseInt(req.params.id);

    if (isNaN(claimId)) {
      return res.status(400).json({ message: "Invalid claim ID" });
    }

    const claim = await storage.getClaim(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    return res.status(200).json(claim);
  });

  app.post("/api/claims", async (req: Request, res: Response) => {
    try {
      // Validate the claim data
      const newClaimData = insertClaimSchema.parse(req.body);
      
      // Additional validation based on claim type
      const { type, details } = newClaimData;
      
      try {
        switch (type) {
          case 'travel':
            travelExpenseSchema.parse(details);
            break;
          case 'business_promotion':
            businessPromotionSchema.parse(details);
            break;
          case 'conveyance':
            conveyanceClaimSchema.parse(details);
            break;
          case 'mobile_bill':
            mobileBillSchema.parse(details);
            break;
          case 'relocation':
            relocationExpenseSchema.parse(details);
            break;
          case 'other':
            otherClaimsSchema.parse(details);
            break;
          default:
            throw new Error(`Invalid claim type: ${type}`);
        }
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: "Invalid claim details", 
            errors: formatZodError(error) 
          });
        }
        throw error;
      }
      
      // Handle approval flow based on user band
      const user = await storage.getUser(newClaimData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Set current approver based on user's manager
      let currentApproverId = null;
      if (newClaimData.status === ClaimStatus.SUBMITTED && user.managerId) {
        currentApproverId = user.managerId;
      }
      
      // Create the claim
      const claim = await storage.createClaim({
        ...newClaimData,
        currentApproverId
      });
      
      // If claim is submitted, create an approval record
      if (claim.status === ClaimStatus.SUBMITTED && currentApproverId) {
        await storage.createApproval({
          claimId: claim.id,
          approverId: currentApproverId,
          status: "pending",
          notes: ""
        });
      }
      
      return res.status(201).json(claim);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid claim data", 
          errors: formatZodError(error) 
        });
      }
      
      console.error("Error creating claim:", error);
      return res.status(500).json({ message: "Failed to create claim" });
    }
  });

  app.patch("/api/claims/:id", async (req: Request, res: Response) => {
    const claimId = parseInt(req.params.id);
    
    if (isNaN(claimId)) {
      return res.status(400).json({ message: "Invalid claim ID" });
    }
    
    const claim = await storage.getClaim(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }
    
    try {
      // If status is changing, handle approval flow
      if (req.body.status && req.body.status !== claim.status) {
        // If submitting a draft
        if (claim.status === ClaimStatus.DRAFT && req.body.status === ClaimStatus.SUBMITTED) {
          const user = await storage.getUser(claim.userId);
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
          
          // Set current approver based on user's manager
          if (user.managerId) {
            req.body.currentApproverId = user.managerId;
            
            // Create an approval record
            await storage.createApproval({
              claimId: claim.id,
              approverId: user.managerId,
              status: "pending",
              notes: ""
            });
          }
        }
        
        // If approving or rejecting a claim
        if (claim.status === ClaimStatus.SUBMITTED && 
            (req.body.status === ClaimStatus.APPROVED || req.body.status === ClaimStatus.REJECTED)) {
          
          // Update any pending approvals
          const approvals = await storage.getApprovalsByClaimId(claim.id);
          const pendingApprovals = approvals.filter(a => a.status === "pending");
          
          for (const approval of pendingApprovals) {
            await storage.updateApproval(approval.id, {
              status: req.body.status === ClaimStatus.APPROVED ? "approved" : "rejected",
              notes: req.body.notes || ""
            });
          }
          
          // Clear current approver if claim is approved/rejected
          req.body.currentApproverId = null;
        }
      }
      
      // Update the claim
      const updatedClaim = await storage.updateClaim(claimId, req.body);
      return res.status(200).json(updatedClaim);
    } catch (error) {
      console.error("Error updating claim:", error);
      return res.status(500).json({ message: "Failed to update claim" });
    }
  });

  // Approvals routes
  app.get("/api/approvals", async (req: Request, res: Response) => {
    const claimId = req.query.claimId ? parseInt(req.query.claimId as string) : undefined;
    
    if (!claimId) {
      return res.status(400).json({ message: "Claim ID is required" });
    }
    
    const approvals = await storage.getApprovalsByClaimId(claimId);
    return res.status(200).json(approvals);
  });

  app.post("/api/approvals", async (req: Request, res: Response) => {
    try {
      const approvalData = insertApprovalSchema.parse(req.body);
      const approval = await storage.createApproval(approvalData);
      return res.status(201).json(approval);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid approval data", 
          errors: formatZodError(error) 
        });
      }
      
      console.error("Error creating approval:", error);
      return res.status(500).json({ message: "Failed to create approval" });
    }
  });

  app.patch("/api/approvals/:id", async (req: Request, res: Response) => {
    const approvalId = parseInt(req.params.id);
    
    if (isNaN(approvalId)) {
      return res.status(400).json({ message: "Invalid approval ID" });
    }
    
    try {
      const approval = await storage.updateApproval(approvalId, req.body);
      
      if (!approval) {
        return res.status(404).json({ message: "Approval not found" });
      }
      
      // If approval status changed to approved/rejected, update the claim
      if ((req.body.status === "approved" || req.body.status === "rejected") && approval.claimId) {
        const claim = await storage.getClaim(approval.claimId);
        
        if (claim) {
          const newStatus = req.body.status === "approved" ? ClaimStatus.APPROVED : ClaimStatus.REJECTED;
          await storage.updateClaim(claim.id, { 
            status: newStatus,
            notes: req.body.notes || claim.notes
          });
        }
      }
      
      return res.status(200).json(approval);
    } catch (error) {
      console.error("Error updating approval:", error);
      return res.status(500).json({ message: "Failed to update approval" });
    }
  });

  // Navision mock integration
  app.post("/api/navision/claims", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        employeeId: z.string(),
        claimType: z.string(),
        approvedAmount: z.number(),
        paymentDate: z.string().optional()
      });
      
      const data = schema.parse(req.body);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return res.status(200).json({
        status: "success",
        message: "Claim processed in Navision",
        referenceNumber: `NAV-${Date.now().toString().substring(8)}`,
        ...data,
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid Navision data", 
          errors: formatZodError(error) 
        });
      }
      
      console.error("Error processing Navision integration:", error);
      return res.status(500).json({ message: "Failed to process in Navision" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

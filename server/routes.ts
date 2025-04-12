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
  ApprovalLevels,
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
    const approverId = req.query.approverId ? parseInt(req.query.approverId as string) : undefined;
    let status = req.query.status as string | undefined;

    let claims = [];
    
    // Handle multiple statuses (comma-separated)
    if (status && status.includes(',')) {
      const statuses = status.split(',');
      let claimsList: any[] = [];
      
      for (const s of statuses) {
        const statusClaims = userId 
          ? await storage.getClaimsByUserIdAndStatus(userId, s.trim())
          : await storage.getClaimsByStatus(s.trim());
        claimsList = [...claimsList, ...statusClaims];
      }
      
      claims = claimsList;
    } else if (userId && status) {
      claims = await storage.getClaimsByUserIdAndStatus(userId, status);
    } else if (userId) {
      claims = await storage.getClaimsByUserId(userId);
    } else if (status) {
      claims = await storage.getClaimsByStatus(status);
    } else if (approverId) {
      // Get all claims associated with this approver (approved or rejected)
      const allClaims = await storage.getAllClaims();
      // Filter to only include claims that were approved or rejected by this approver
      claims = allClaims.filter(claim => 
        (claim.status === ClaimStatus.APPROVED || claim.status === ClaimStatus.REJECTED) && 
        claim.currentApproverId === null && // Current approver is cleared after approval/rejection
        claim.notes?.includes(`by approver ID ${approverId}`) // Add this metadata in update
      );
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
      // Check if this is a draft claim - we'll handle validation differently
      const isDraft = req.body.status === 'draft';
      console.log(`Processing ${isDraft ? 'draft' : 'submitted'} claim`);
      
      try {
        // Validate the claim data with appropriate schema
        const newClaimData = insertClaimSchema.parse(req.body);
        
        // For drafts, we skip the detailed validation since users might save incomplete forms
        if (!isDraft) {
          // Only validate details for non-draft claims
          const { type, details } = newClaimData;
          
          if (!details) {
            throw new Error("Claim details are required for non-draft claims");
          }
          
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
        } else {
          console.log("Draft claim - skipping detailed validation");
        }
      } catch (error) {
        console.error("Validation error:", error);
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: "Invalid claim details", 
            errors: formatZodError(error) 
          });
        }
        return res.status(400).json({ 
          message: error.message || "Invalid claim data"
        });
      }
      
      // Handle approval flow based on org hierarchy
      const user = await storage.getUser(newClaimData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Set current approver based on organizational hierarchy
      let currentApproverId = null;
      let nextApproverId = null;
      
      if (newClaimData.status === ClaimStatus.SUBMITTED) {
        // Get the next approver from org hierarchy
        const nextApprover = await storage.getNextApprover(
          newClaimData.userId,
          user.department,
          user.businessUnit,
          newClaimData.totalAmount
        );
        
        if (nextApprover) {
          currentApproverId = nextApprover.id;
          
          // Get the full approval chain to determine next approver
          const approvalChain = await storage.getApprovalChain(
            user.department,
            user.businessUnit,
            newClaimData.totalAmount
          );
          
          // If there's more than one approver in the chain,
          // set the next approver for the approval record
          if (approvalChain.length > 1) {
            // Find the index of current approver
            const currentApproverIndex = approvalChain.findIndex(a => a.id === currentApproverId);
            if (currentApproverIndex >= 0 && currentApproverIndex < approvalChain.length - 1) {
              nextApproverId = approvalChain[currentApproverIndex + 1].id;
            }
          }
        }
      }
      
      // Create the claim
      const claim = await storage.createClaim({
        ...newClaimData,
        currentApproverId
      });
      
      // If claim is submitted, create an approval record with the appropriate approval level
      if (claim.status === ClaimStatus.SUBMITTED && currentApproverId) {
        // Determine approval level based on amount
        let approvalLevel = ApprovalLevels.MANAGER;
        
        if (newClaimData.totalAmount > 50000) {
          approvalLevel = ApprovalLevels.CXO;
        } else if (newClaimData.totalAmount > 20000) {
          approvalLevel = ApprovalLevels.DIRECTOR;
        } else if (newClaimData.totalAmount > 5000) {
          approvalLevel = ApprovalLevels.FINANCE;
        }
        
        await storage.createApproval({
          claimId: claim.id,
          approverId: currentApproverId,
          approvalLevel: approvalLevel,
          status: "pending",
          notes: "",
          nextApproverId: nextApproverId
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
          
          // Set current approver based on org hierarchy
          let currentApproverId = null;
          let nextApproverId = null;
          
          // Get the next approver from org hierarchy
          const nextApprover = await storage.getNextApprover(
            claim.userId,
            user.department,
            user.businessUnit,
            claim.totalAmount
          );
          
          if (nextApprover) {
            currentApproverId = nextApprover.id;
            req.body.currentApproverId = currentApproverId;
            
            // Get the full approval chain to determine next approver
            const approvalChain = await storage.getApprovalChain(
              user.department,
              user.businessUnit,
              claim.totalAmount
            );
            
            // If there's more than one approver in the chain,
            // set the next approver for the approval record
            if (approvalChain.length > 1) {
              // Find the index of current approver
              const currentApproverIndex = approvalChain.findIndex(a => a.id === currentApproverId);
              if (currentApproverIndex >= 0 && currentApproverIndex < approvalChain.length - 1) {
                nextApproverId = approvalChain[currentApproverIndex + 1].id;
              }
            }
            
            // Determine approval level based on amount
            let approvalLevel = ApprovalLevels.MANAGER;
            
            if (claim.totalAmount > 50000) {
              approvalLevel = ApprovalLevels.CXO;
            } else if (claim.totalAmount > 20000) {
              approvalLevel = ApprovalLevels.DIRECTOR;
            } else if (claim.totalAmount > 5000) {
              approvalLevel = ApprovalLevels.FINANCE;
            }
            
            // Create an approval record
            await storage.createApproval({
              claimId: claim.id,
              approverId: currentApproverId,
              approvalLevel: approvalLevel,
              status: "pending",
              notes: "",
              nextApproverId: nextApproverId
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
    const approverId = req.query.approverId ? parseInt(req.query.approverId as string) : undefined;
    
    if (!claimId && !approverId) {
      return res.status(400).json({ message: "Either claim ID or approver ID is required" });
    }
    
    if (claimId) {
      const approvals = await storage.getApprovalsByClaimId(parseInt(claimId as string));
      
      // Enhance approvals with approver details
      const enhancedApprovals = await Promise.all(
        approvals.map(async (approval) => {
          const approver = await storage.getUser(approval.approverId);
          
          return {
            ...approval,
            approverName: approver ? approver.name : "Unknown",
            approverTitle: approver ? approver.designation : "Approver",
            approverDepartment: approver ? approver.department : "",
          };
        })
      );
      
      return res.status(200).json(enhancedApprovals);
    } else if (approverId) {
      const approvals = await storage.getApprovalsByApproverId(parseInt(approverId as string));
      return res.status(200).json(approvals);
    }
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
      
      // If approval status changed to approved/rejected, handle the multi-level approval flow
      if ((req.body.status === "approved" || req.body.status === "rejected") && approval.claimId) {
        const claim = await storage.getClaim(approval.claimId);
        
        if (claim) {
          // If rejected, update the claim status to rejected
          if (req.body.status === "rejected") {
            await storage.updateClaim(claim.id, { 
              status: ClaimStatus.REJECTED,
              notes: `${req.body.notes || claim.notes || ''}\nRejected by approver ID ${approval.approverId}.`,
              currentApproverId: null  // Clear the current approver
            });
          } 
          // If approved and there's a next approver, move to the next approval level
          else if (req.body.status === "approved" && approval.nextApproverId) {
            // Update claim with the next approver
            await storage.updateClaim(claim.id, { 
              currentApproverId: approval.nextApproverId,
              notes: `${req.body.notes || claim.notes || ''}\nApproved by approver ID ${approval.approverId}. Moving to next approver.`
            });
            
            // Get the user who is submitting the claim
            const claimUser = await storage.getUser(claim.userId);
            
            if (claimUser) {
              // Determine the next approval level
              let nextApprovalLevel = approval.approvalLevel + 1;
              
              // Create a new approval record for the next approver
              await storage.createApproval({
                claimId: claim.id,
                approverId: approval.nextApproverId,
                approvalLevel: nextApprovalLevel,
                status: "pending",
                notes: "",
                // Determine if there are more approvers in the chain
                nextApproverId: null  // This will be determined in a real implementation by checking the approval chain
              });
            }
          } 
          // If approved and there's no next approver, mark the claim as fully approved
          else if (req.body.status === "approved" && !approval.nextApproverId) {
            await storage.updateClaim(claim.id, { 
              status: ClaimStatus.APPROVED,
              notes: `${req.body.notes || claim.notes || ''}\nFully approved by approver ID ${approval.approverId}.`,
              currentApproverId: null  // Clear the current approver
            });
          }
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

import { 
  type User, type InsertUser, users,
  type Claim, type InsertClaim, claims,
  type Approval, type InsertApproval, approvals,
  organizationHierarchy,
  ClaimStatus, UserRoles, ClaimTypes, ApprovalLevels,
  type ClaimType, type ClaimStatusType, type ApprovalLevel
} from "@shared/schema";

import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByExternalId(externalId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserFromExternalAuth(user: Omit<InsertUser, 'password'> & { externalId: string }): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Claim methods
  getClaim(id: number): Promise<Claim | undefined>;
  getClaimByClaimId(claimId: string): Promise<Claim | undefined>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: number, updates: Partial<Claim>): Promise<Claim | undefined>;
  getAllClaims(): Promise<Claim[]>;
  getClaimsByUserId(userId: number): Promise<Claim[]>;
  getClaimsByStatus(status: string): Promise<Claim[]>;
  getClaimsByUserIdAndStatus(userId: number, status: string): Promise<Claim[]>;
  getClaimsForApproval(approverId: number): Promise<Claim[]>;
  
  // Approval methods
  createApproval(approval: InsertApproval): Promise<Approval>;
  getApprovalsByClaimId(claimId: number): Promise<Approval[]>;
  getApprovalsByApproverId(approverId: number): Promise<Approval[]>;
  updateApproval(id: number, updates: Partial<Approval>): Promise<Approval | undefined>;
  
  // Organization Hierarchy methods
  getOrgHierarchy(id: number): Promise<any>;
  createOrgHierarchy(hierarchy: any): Promise<any>;
  getApproversByDepartment(departmentId: string, level: ApprovalLevel): Promise<User[]>;
  getNextApprover(userId: number, departmentId: string, businessUnitId: string, amount: number): Promise<User | undefined>;
  getApprovalChain(departmentId: string, businessUnitId: string, amount: number): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private claimsMap: Map<number, Claim>;
  private approvalsMap: Map<number, Approval>;
  private orgHierarchyMap: Map<number, any>;
  private userIdCounter: number;
  private claimIdCounter: number;
  private approvalIdCounter: number;
  private orgHierarchyIdCounter: number;
  private claimIdPrefix: string;
  public sessionStore: session.Store;

  constructor() {
    this.usersMap = new Map();
    this.claimsMap = new Map();
    this.approvalsMap = new Map();
    this.orgHierarchyMap = new Map();
    this.userIdCounter = 1;
    this.claimIdCounter = 1;
    this.approvalIdCounter = 1;
    this.orgHierarchyIdCounter = 1;
    this.claimIdPrefix = "EXP-2023-";
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with some demo users
    (async () => {
      try {
        await this.initializeDemoData();
      } catch (error) {
        console.error("Error initializing demo data:", error);
      }
    })();
  }

  private async initializeDemoData() {
    // Add demo users
    const admin = await this.createUser({
      username: "admin",
      password: "admin123",
      name: "Admin User",
      email: "admin@company.com",
      department: "Administration",
      designation: "Admin Manager",
      branch: "Head Office",
      eCode: "E001",
      band: "B5",
      businessUnit: "Administration",
      role: UserRoles.ADMIN,
      managerId: undefined,
    });

    const financeManager = await this.createUser({
      username: "finance",
      password: "finance123",
      name: "Finance Manager",
      email: "finance@company.com",
      department: "Finance",
      designation: "Finance Manager",
      branch: "Head Office",
      eCode: "E002",
      band: "B4",
      businessUnit: "Finance",
      role: UserRoles.FINANCE,
      managerId: admin.id,
    });

    const manager = await this.createUser({
      username: "manager",
      password: "manager123",
      name: "John Manager",
      email: "manager@company.com",
      department: "Engineering",
      designation: "Engineering Manager",
      branch: "Main Branch",
      eCode: "E003",
      band: "B3",
      businessUnit: "Technology",
      role: UserRoles.MANAGER,
      managerId: financeManager.id,
    });

    const employee = await this.createUser({
      username: "employee",
      password: "employee123",
      name: "John Doe",
      email: "john.doe@company.com",
      department: "Engineering",
      designation: "Software Engineer",
      branch: "Main Branch",
      eCode: "E004",
      band: "B2",
      businessUnit: "Technology",
      role: UserRoles.EMPLOYEE,
      managerId: manager.id,
    });

    // Add some demo claims
    const claim1 = await this.createClaim({
      claimId: this.generateClaimId(),
      userId: employee.id,
      type: ClaimTypes.TRAVEL,
      status: ClaimStatus.SUBMITTED,
      totalAmount: 12500,
      details: {
        destination: "Mumbai to Bangalore",
        purpose: "Client Meeting",
        departureDate: "2023-10-10",
        returnDate: "2023-10-12",
        travelMode: "flight",
        travelClass: "economy",
        advanceAmount: 0,
        expenses: [
          {
            date: "2023-10-10",
            category: "flight",
            description: "Flight tickets",
            amount: 8500,
            receipt: "receipt1.pdf"
          },
          {
            date: "2023-10-10",
            category: "hotel",
            description: "Hotel stay",
            amount: 4000,
            receipt: "receipt2.pdf"
          }
        ],
        checklist: {
          receiptsAttached: true,
          policyCompliance: true,
          detailsAccurate: true
        },
        additionalNotes: "Client meeting with XYZ Corp"
      },
      notes: "Awaiting manager approval",
      currentApproverId: manager.id,
    });
    
    const claim2 = await this.createClaim({
      claimId: this.generateClaimId(),
      userId: employee.id,
      type: ClaimTypes.MOBILE_BILL,
      status: ClaimStatus.APPROVED,
      totalAmount: 1450,
      details: {
        period: "September 2023",
        totalBill: 1450,
        deductions: 0,
        gstAmount: 221.19,
        netClaim: 1450,
        isdCalls: false,
        billAttachment: "mobile_bill_sept.pdf"
      },
      notes: "Approved by manager",
      currentApproverId: null,
      approvedAmount: 1450,
    });
    
    const claim3 = await this.createClaim({
      claimId: this.generateClaimId(),
      userId: employee.id,
      type: ClaimTypes.CONVEYANCE,
      status: ClaimStatus.APPROVED,
      totalAmount: 880,
      details: {
        date: "2023-09-28",
        fromLocation: "Office",
        toLocation: "Client Site",
        distance: 22,
        vehicleType: "car",
        purpose: "Client Meeting",
        ratePerKm: 40,
        totalAmount: 880
      },
      notes: "Approved and payment completed",
      currentApproverId: null,
      approvedAmount: 880,
    });
    
    const claim4 = await this.createClaim({
      claimId: this.generateClaimId(),
      userId: employee.id,
      type: ClaimTypes.BUSINESS_PROMOTION,
      status: ClaimStatus.REJECTED,
      totalAmount: 3080,
      details: {
        clientName: "ABC Corp",
        eventDate: "2023-09-22",
        expenseType: "food",
        totalCost: 3080,
        attendees: 4,
        costPerPerson: 770,
        purpose: "Business Discussion"
      },
      notes: "Rejected due to exceeding per person limit",
      currentApproverId: null,
      approvedAmount: 0,
    });

    // Add demo approvals
    await this.createApproval({
      claimId: claim1.id,
      approverId: manager.id,
      approvalLevel: ApprovalLevels.MANAGER,
      status: "pending",
      notes: "",
      nextApproverId: financeManager.id
    });

    await this.createApproval({
      claimId: claim2.id,
      approverId: manager.id,
      approvalLevel: ApprovalLevels.MANAGER,
      status: "approved",
      notes: "Approved as per policy",
      nextApproverId: null
    });

    await this.createApproval({
      claimId: claim3.id,
      approverId: manager.id,
      approvalLevel: ApprovalLevels.MANAGER,
      status: "approved",
      notes: "Approved",
      nextApproverId: null
    });

    await this.createApproval({
      claimId: claim4.id,
      approverId: manager.id,
      approvalLevel: ApprovalLevels.MANAGER,
      status: "rejected",
      notes: "Exceeds the per person limit for business meals",
      nextApproverId: null
    });
  }

  private generateClaimId(): string {
    const nextNumber = String(this.claimIdCounter + 100).padStart(4, '0');
    return `${this.claimIdPrefix}${nextNumber}`;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Create a properly typed User object with all required fields
    const newUser: User = { 
      id,
      username: user.username,
      password: user.password,
      name: user.name,
      email: user.email,
      department: user.department,
      designation: user.designation,
      branch: user.branch,
      eCode: user.eCode,
      band: user.band,
      businessUnit: user.businessUnit,
      role: user.role,
      managerId: user.managerId ?? null,
      createdAt: new Date()
    };
    this.usersMap.set(id, newUser);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  // Claim methods
  async getClaim(id: number): Promise<Claim | undefined> {
    return this.claimsMap.get(id);
  }

  async getClaimByClaimId(claimId: string): Promise<Claim | undefined> {
    return Array.from(this.claimsMap.values()).find(
      (claim) => claim.claimId === claimId
    );
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const id = this.claimIdCounter++;
    const now = new Date();
    // Ensure we have the correct type for ClaimType and ClaimStatusType
    const type = claim.type as ClaimType;
    const status = claim.status as ClaimStatusType;
    
    // Create a properly structured claim object with all required fields
    const newClaim: Claim = { 
      id,
      claimId: claim.claimId,
      userId: claim.userId,
      type,
      status,
      totalAmount: claim.totalAmount,
      details: claim.details,
      notes: claim.notes || null,
      currentApproverId: claim.currentApproverId || null,
      createdAt: now, 
      updatedAt: now,
      submittedAt: status === ClaimStatus.SUBMITTED ? now : null,
      approvedAt: null,
      rejectedAt: null,
      paidAt: null,
      approvedAmount: (claim as any).approvedAmount !== undefined ? (claim as any).approvedAmount : null
    };
    this.claimsMap.set(id, newClaim);
    return newClaim;
  }

  async updateClaim(id: number, updates: Partial<Claim>): Promise<Claim | undefined> {
    const claim = this.claimsMap.get(id);
    if (!claim) return undefined;

    const updatedClaim: Claim = { 
      ...claim, 
      ...updates,
      updatedAt: new Date(),
      submittedAt: updates.status === ClaimStatus.SUBMITTED ? new Date() : claim.submittedAt,
      approvedAt: updates.status === ClaimStatus.APPROVED ? new Date() : claim.approvedAt,
      rejectedAt: updates.status === ClaimStatus.REJECTED ? new Date() : claim.rejectedAt,
      paidAt: updates.status === ClaimStatus.PAID ? new Date() : claim.paidAt
    };
    
    this.claimsMap.set(id, updatedClaim);
    return updatedClaim;
  }

  async getAllClaims(): Promise<Claim[]> {
    return Array.from(this.claimsMap.values());
  }

  async getClaimsByUserId(userId: number): Promise<Claim[]> {
    return Array.from(this.claimsMap.values()).filter(
      (claim) => claim.userId === userId
    );
  }

  async getClaimsByStatus(status: string): Promise<Claim[]> {
    return Array.from(this.claimsMap.values()).filter(
      (claim) => claim.status === status
    );
  }

  async getClaimsByUserIdAndStatus(userId: number, status: string): Promise<Claim[]> {
    return Array.from(this.claimsMap.values()).filter(
      (claim) => claim.userId === userId && claim.status === status
    );
  }

  async getClaimsForApproval(approverId: number): Promise<Claim[]> {
    return Array.from(this.claimsMap.values()).filter(
      (claim) => claim.currentApproverId === approverId && claim.status === ClaimStatus.PENDING
    );
  }

  // Approval methods
  async createApproval(approval: InsertApproval): Promise<Approval> {
    const id = this.approvalIdCounter++;
    const now = new Date();
    // Ensure status is a valid approval status type
    const status = approval.status as "pending" | "approved" | "rejected";
    
    const newApproval: Approval = { 
      claimId: approval.claimId, 
      approverId: approval.approverId,
      approvalLevel: approval.approvalLevel,
      status,
      notes: approval.notes || null,
      nextApproverId: approval.nextApproverId || null,
      id, 
      createdAt: now, 
      updatedAt: now
    };
    this.approvalsMap.set(id, newApproval);
    return newApproval;
  }

  async getApprovalsByClaimId(claimId: number): Promise<Approval[]> {
    return Array.from(this.approvalsMap.values()).filter(
      (approval) => approval.claimId === claimId
    );
  }
  
  async getApprovalsByApproverId(approverId: number): Promise<Approval[]> {
    return Array.from(this.approvalsMap.values())
      .filter((approval) => approval.approverId === approverId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updateApproval(id: number, updates: Partial<Approval>): Promise<Approval | undefined> {
    const approval = this.approvalsMap.get(id);
    if (!approval) return undefined;

    const updatedApproval: Approval = { 
      ...approval, 
      ...updates,
      updatedAt: new Date()
    };
    
    this.approvalsMap.set(id, updatedApproval);
    return updatedApproval;
  }

  // Organization Hierarchy methods
  async getOrgHierarchy(id: number): Promise<any> {
    return this.orgHierarchyMap.get(id);
  }

  async createOrgHierarchy(hierarchy: any): Promise<any> {
    const id = this.orgHierarchyIdCounter++;
    const now = new Date();
    const newHierarchy = { 
      ...hierarchy, 
      id, 
      createdAt: now, 
      updatedAt: now
    };
    this.orgHierarchyMap.set(id, newHierarchy);
    return newHierarchy;
  }

  async getApproversByDepartment(departmentId: string, level: ApprovalLevel): Promise<User[]> {
    // Find users who can approve for this department at this level
    const departmentApprovers = Array.from(this.usersMap.values()).filter(user => {
      // Check if the user is in the same department and has appropriate role
      if (user.department !== departmentId) return false;
      
      // Check role based on level
      if (level === ApprovalLevels.MANAGER && user.role === UserRoles.MANAGER) return true;
      if (level === ApprovalLevels.FINANCE && user.role === UserRoles.FINANCE) return true;
      if (level === ApprovalLevels.DIRECTOR && user.role === UserRoles.MANAGER && user.band >= "B4") return true;
      if (level === ApprovalLevels.CXO && user.role === UserRoles.ADMIN) return true;
      
      return false;
    });
    
    return departmentApprovers;
  }

  async getNextApprover(userId: number, departmentId: string, businessUnitId: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Get user's manager
    if (user.managerId) {
      const manager = await this.getUser(user.managerId);
      if (manager) return manager;
    }
    
    // If no direct manager found, find an approver based on amount threshold and department
    let level: ApprovalLevel = ApprovalLevels.MANAGER;
    
    // Determine approval level based on amount
    if (amount > 50000) {
      level = ApprovalLevels.CXO;
    } else if (amount > 20000) {
      level = ApprovalLevels.DIRECTOR;
    } else if (amount > 5000) {
      level = ApprovalLevels.FINANCE;
    }
    
    // Get potential approvers for this level and department
    const approvers = await this.getApproversByDepartment(departmentId, level);
    
    // Return the first available approver or undefined if none found
    return approvers.length > 0 ? approvers[0] : undefined;
  }

  async getApprovalChain(departmentId: string, businessUnitId: string, amount: number): Promise<User[]> {
    // Get the approval chain based on amount and department
    const approvalChain: User[] = [];
    
    // For low amounts (<= 5000), just need manager approval
    if (amount <= 5000) {
      const managers = await this.getApproversByDepartment(departmentId, ApprovalLevels.MANAGER);
      if (managers.length > 0) approvalChain.push(managers[0]);
    }
    // For medium amounts (5000-20000), need manager and finance approval
    else if (amount <= 20000) {
      const managers = await this.getApproversByDepartment(departmentId, ApprovalLevels.MANAGER);
      if (managers.length > 0) approvalChain.push(managers[0]);
      
      const finance = await this.getApproversByDepartment("Finance", ApprovalLevels.FINANCE);
      if (finance.length > 0) approvalChain.push(finance[0]);
    }
    // For high amounts (20000-50000), need manager, finance, and director approval
    else if (amount <= 50000) {
      const managers = await this.getApproversByDepartment(departmentId, ApprovalLevels.MANAGER);
      if (managers.length > 0) approvalChain.push(managers[0]);
      
      const finance = await this.getApproversByDepartment("Finance", ApprovalLevels.FINANCE);
      if (finance.length > 0) approvalChain.push(finance[0]);
      
      const directors = await this.getApproversByDepartment(departmentId, ApprovalLevels.DIRECTOR);
      if (directors.length > 0) approvalChain.push(directors[0]);
    }
    // For very high amounts (>50000), need full approval chain including CXO
    else {
      const managers = await this.getApproversByDepartment(departmentId, ApprovalLevels.MANAGER);
      if (managers.length > 0) approvalChain.push(managers[0]);
      
      const finance = await this.getApproversByDepartment("Finance", ApprovalLevels.FINANCE);
      if (finance.length > 0) approvalChain.push(finance[0]);
      
      const directors = await this.getApproversByDepartment(departmentId, ApprovalLevels.DIRECTOR);
      if (directors.length > 0) approvalChain.push(directors[0]);
      
      const cxos = await this.getApproversByDepartment("Administration", ApprovalLevels.CXO);
      if (cxos.length > 0) approvalChain.push(cxos[0]);
    }
    
    return approvalChain;
  }
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Initialize with demo data
    (async () => {
      try {
        await this.initializeDemoData();
      } catch (error) {
        console.error("Error initializing demo data:", error);
      }
    })();
  }
  
  private async initializeDemoData() {
    // Check if we have any users already
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already has users, skipping demo data initialization");
      return;
    }

    console.log("Initializing database with demo data...");
    
    // Add demo users
    const admin = await this.createUser({
      username: "admin",
      password: "admin123",
      name: "Admin User",
      email: "admin@company.com",
      department: "Administration",
      designation: "Admin Manager",
      branch: "Head Office",
      eCode: "E001",
      band: "B5",
      businessUnit: "Administration",
      role: UserRoles.ADMIN,
    });

    const financeManager = await this.createUser({
      username: "finance",
      password: "finance123",
      name: "Finance Manager",
      email: "finance@company.com",
      department: "Finance",
      designation: "Finance Manager",
      branch: "Head Office",
      eCode: "E002",
      band: "B4",
      businessUnit: "Finance",
      role: UserRoles.FINANCE,
      managerId: admin.id,
    });

    const manager = await this.createUser({
      username: "manager",
      password: "manager123",
      name: "John Manager",
      email: "manager@company.com",
      department: "Engineering",
      designation: "Engineering Manager",
      branch: "Main Branch",
      eCode: "E003",
      band: "B3",
      businessUnit: "Technology",
      role: UserRoles.MANAGER,
      managerId: financeManager.id,
    });

    const employee = await this.createUser({
      username: "employee",
      password: "employee123",
      name: "John Doe",
      email: "john.doe@company.com",
      department: "Engineering",
      designation: "Software Engineer",
      branch: "Main Branch",
      eCode: "E004",
      band: "B2",
      businessUnit: "Technology",
      role: UserRoles.EMPLOYEE,
      managerId: manager.id,
    });
    
    // Generate claim ID prefix
    const claimIdPrefix = "EXP-2023-";
    const generateClaimId = (num: number) => {
      return `${claimIdPrefix}${String(num + 100).padStart(4, '0')}`;
    };

    // Add some demo claims
    const claim1 = await this.createClaim({
      claimId: generateClaimId(1),
      userId: employee.id,
      type: ClaimTypes.TRAVEL,
      status: ClaimStatus.SUBMITTED,
      totalAmount: 12500,
      details: {
        destination: "Mumbai to Bangalore",
        purpose: "Client Meeting",
        departureDate: "2023-10-10",
        returnDate: "2023-10-12",
        travelMode: "flight",
        travelClass: "economy",
        advanceAmount: 0,
        expenses: [
          {
            date: "2023-10-10",
            category: "flight",
            description: "Flight tickets",
            amount: 8500,
            receipt: "receipt1.pdf"
          },
          {
            date: "2023-10-10",
            category: "hotel",
            description: "Hotel stay",
            amount: 4000,
            receipt: "receipt2.pdf"
          }
        ],
        checklist: {
          receiptsAttached: true,
          policyCompliance: true,
          detailsAccurate: true
        },
        additionalNotes: "Client meeting with XYZ Corp"
      },
      notes: "Awaiting manager approval",
      currentApproverId: manager.id,
    });
    
    const claim2 = await this.createClaim({
      claimId: generateClaimId(2),
      userId: employee.id,
      type: ClaimTypes.MOBILE_BILL,
      status: ClaimStatus.APPROVED,
      totalAmount: 1450,
      details: {
        period: "September 2023",
        totalBill: 1450,
        deductions: 0,
        gstAmount: 221.19,
        netClaim: 1450,
        isdCalls: false,
        billAttachment: "mobile_bill_sept.pdf"
      },
      notes: "Approved by manager",
      currentApproverId: null,
    });
    
    // Update to add approved amount
    await db.update(claims).set({
      approvedAmount: 1450,
    }).where(eq(claims.id, claim2.id));
    
    const claim3 = await this.createClaim({
      claimId: generateClaimId(3),
      userId: employee.id,
      type: ClaimTypes.CONVEYANCE,
      status: ClaimStatus.APPROVED,
      totalAmount: 880,
      details: {
        date: "2023-09-28",
        fromLocation: "Office",
        toLocation: "Client Site",
        distance: 22,
        vehicleType: "car",
        purpose: "Client Meeting",
        ratePerKm: 40,
        totalAmount: 880
      },
      notes: "Approved and payment completed",
      currentApproverId: null,
    });
    
    // Update to add approved amount
    await db.update(claims).set({
      approvedAmount: 880,
    }).where(eq(claims.id, claim3.id));
    
    const claim4 = await this.createClaim({
      claimId: generateClaimId(4),
      userId: employee.id,
      type: ClaimTypes.BUSINESS_PROMOTION,
      status: ClaimStatus.REJECTED,
      totalAmount: 3080,
      details: {
        clientName: "ABC Corp",
        eventDate: "2023-09-22",
        expenseType: "food",
        totalCost: 3080,
        attendees: 4,
        costPerPerson: 770,
        purpose: "Business Discussion"
      },
      notes: "Rejected due to exceeding per person limit",
      currentApproverId: null,
    });

    // Add demo approvals
    await this.createApproval({
      claimId: claim1.id,
      approverId: manager.id,
      approvalLevel: ApprovalLevels.MANAGER,
      status: "pending",
      notes: "",
      nextApproverId: financeManager.id
    });

    await this.createApproval({
      claimId: claim2.id,
      approverId: manager.id,
      approvalLevel: ApprovalLevels.MANAGER,
      status: "approved",
      notes: "Approved as per policy",
      nextApproverId: null
    });

    await this.createApproval({
      claimId: claim3.id,
      approverId: manager.id,
      approvalLevel: ApprovalLevels.MANAGER,
      status: "approved",
      notes: "Approved",
      nextApproverId: null
    });

    await this.createApproval({
      claimId: claim4.id,
      approverId: manager.id,
      approvalLevel: ApprovalLevels.MANAGER,
      status: "rejected",
      notes: "Exceeds the per person limit for business meals",
      nextApproverId: null
    });
    
    console.log("Demo data initialization complete!");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Claim methods
  async getClaim(id: number): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    return claim;
  }

  async getClaimByClaimId(claimId: string): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.claimId, claimId));
    return claim;
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const [newClaim] = await db.insert(claims).values(claim).returning();
    return newClaim;
  }

  async updateClaim(id: number, updates: Partial<Claim>): Promise<Claim | undefined> {
    const [updatedClaim] = await db
      .update(claims)
      .set({
        ...updates,
        updatedAt: new Date(),
        submittedAt: updates.status === ClaimStatus.SUBMITTED ? new Date() : undefined,
        approvedAt: updates.status === ClaimStatus.APPROVED ? new Date() : undefined,
        rejectedAt: updates.status === ClaimStatus.REJECTED ? new Date() : undefined,
        paidAt: updates.status === ClaimStatus.PAID ? new Date() : undefined,
      })
      .where(eq(claims.id, id))
      .returning();
    
    return updatedClaim;
  }

  async getAllClaims(): Promise<Claim[]> {
    return await db.select().from(claims);
  }

  async getClaimsByUserId(userId: number): Promise<Claim[]> {
    return await db.select().from(claims).where(eq(claims.userId, userId));
  }

  async getClaimsByStatus(status: string): Promise<Claim[]> {
    return await db.select().from(claims).where(eq(claims.status, status));
  }

  async getClaimsByUserIdAndStatus(userId: number, status: string): Promise<Claim[]> {
    return await db
      .select()
      .from(claims)
      .where(and(eq(claims.userId, userId), eq(claims.status, status)));
  }

  async getClaimsForApproval(approverId: number): Promise<Claim[]> {
    return await db
      .select()
      .from(claims)
      .where(
        and(
          eq(claims.currentApproverId, approverId),
          eq(claims.status, ClaimStatus.PENDING)
        )
      );
  }

  // Approval methods
  async createApproval(approval: InsertApproval): Promise<Approval> {
    const [newApproval] = await db.insert(approvals).values(approval).returning();
    return newApproval;
  }

  async getApprovalsByClaimId(claimId: number): Promise<Approval[]> {
    return await db
      .select()
      .from(approvals)
      .where(eq(approvals.claimId, claimId))
      .orderBy(approvals.createdAt);
  }

  async updateApproval(id: number, updates: Partial<Approval>): Promise<Approval | undefined> {
    const [updatedApproval] = await db
      .update(approvals)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(approvals.id, id))
      .returning();
    
    return updatedApproval;
  }
  
  async getApprovalsByApproverId(approverId: number): Promise<Approval[]> {
    return await db
      .select()
      .from(approvals)
      .where(eq(approvals.approverId, approverId))
      .orderBy(desc(approvals.updatedAt));
  }

  // Organization Hierarchy methods
  async getOrgHierarchy(id: number): Promise<any> {
    const [hierarchy] = await db
      .select()
      .from(organizationHierarchy)
      .where(eq(organizationHierarchy.id, id));
    
    return hierarchy;
  }

  async createOrgHierarchy(hierarchy: any): Promise<any> {
    const [newHierarchy] = await db
      .insert(organizationHierarchy)
      .values(hierarchy)
      .returning();
    
    return newHierarchy;
  }

  async getApproversByDepartment(departmentId: string, level: ApprovalLevel): Promise<User[]> {
    // Find users who can approve for this department at this level
    // Join with organization_hierarchy table to get approval levels
    const result = await db
      .select()
      .from(users)
      .innerJoin(
        organizationHierarchy,
        eq(users.id, organizationHierarchy.userId)
      )
      .where(
        and(
          eq(users.department, departmentId),
          eq(organizationHierarchy.approvalLevel, level),
          eq(organizationHierarchy.canApprove, true)
        )
      );
    
    return result.map(r => r.users);
  }

  async getNextApprover(userId: number, departmentId: string, businessUnitId: string, amount: number): Promise<User | undefined> {
    // First try to get the user's direct manager
    const user = await this.getUser(userId);
    if (!user) return undefined;

    if (user.managerId) {
      const manager = await this.getUser(user.managerId);
      if (manager) return manager;
    }

    // If no direct manager, find based on approval hierarchy
    let level: ApprovalLevel = ApprovalLevels.MANAGER;
    
    // Determine the required approval level based on amount
    if (amount > 50000) {
      level = ApprovalLevels.CXO;
    } else if (amount > 25000) {
      level = ApprovalLevels.DIRECTOR;
    } else if (amount > 10000) {
      level = ApprovalLevels.FINANCE;
    }

    // Get approvers at the determined level
    const approvers = await this.getApproversByDepartment(departmentId, level);
    return approvers.length > 0 ? approvers[0] : undefined;
  }

  async getApprovalChain(departmentId: string, businessUnitId: string, amount: number): Promise<User[]> {
    const approvalChain: User[] = [];
    
    for (const level of Object.values(ApprovalLevels)) {
      if (typeof level === 'number') {
        const approvers = await this.getApproversByDepartment(departmentId, level);
        if (approvers.length > 0) {
          approvalChain.push(approvers[0]);
        }
      }
    }
    
    return approvalChain;
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();

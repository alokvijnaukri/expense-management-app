import { 
  type User, type InsertUser, users,
  type Claim, type InsertClaim, claims,
  type Approval, type InsertApproval, approvals,
  ClaimStatus, UserRoles, ClaimTypes, ApprovalLevels
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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
  updateApproval(id: number, updates: Partial<Approval>): Promise<Approval | undefined>;
  
  // Organization Hierarchy methods
  getOrgHierarchy(id: number): Promise<any>;
  createOrgHierarchy(hierarchy: any): Promise<any>;
  getApproversByDepartment(departmentId: string, level: number): Promise<User[]>;
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
    const newUser: User = { ...user, id, createdAt: new Date() };
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
    const newClaim: Claim = { 
      ...claim, 
      id, 
      createdAt: now, 
      updatedAt: now,
      submittedAt: claim.status === ClaimStatus.SUBMITTED ? now : null,
      approvedAt: null,
      rejectedAt: null,
      paidAt: null
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
      (claim) => claim.currentApproverId === approverId && claim.status === ClaimStatus.SUBMITTED
    );
  }

  // Approval methods
  async createApproval(approval: InsertApproval): Promise<Approval> {
    const id = this.approvalIdCounter++;
    const now = new Date();
    const newApproval: Approval = { 
      ...approval, 
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

  async getApproversByDepartment(departmentId: string, level: number): Promise<User[]> {
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
    let level = ApprovalLevels.MANAGER;
    
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

export const storage = new MemStorage();

import { 
  type User, type InsertUser, users,
  type Claim, type InsertClaim, claims,
  type Approval, type InsertApproval, approvals,
  ClaimStatus, UserRoles, ClaimTypes
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
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private claimsMap: Map<number, Claim>;
  private approvalsMap: Map<number, Approval>;
  private userIdCounter: number;
  private claimIdCounter: number;
  private approvalIdCounter: number;
  private claimIdPrefix: string;
  public sessionStore: session.Store;

  constructor() {
    this.usersMap = new Map();
    this.claimsMap = new Map();
    this.approvalsMap = new Map();
    this.userIdCounter = 1;
    this.claimIdCounter = 1;
    this.approvalIdCounter = 1;
    this.claimIdPrefix = "EXP-2023-";
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with some demo users
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Add demo users
    const admin = this.createUser({
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

    const financeManager = this.createUser({
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

    const manager = this.createUser({
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

    const employee = this.createUser({
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
    const demoClaimIds = [
      this.createClaim({
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
      }),
      this.createClaim({
        claimId: this.generateClaimId(),
        userId: employee.id,
        type: ClaimTypes.MOBILE_BILL,
        status: ClaimStatus.APPROVED,
        totalAmount: 1450,
        approvedAmount: 1450,
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
      }),
      this.createClaim({
        claimId: this.generateClaimId(),
        userId: employee.id,
        type: ClaimTypes.CONVEYANCE,
        status: ClaimStatus.APPROVED,
        totalAmount: 880,
        approvedAmount: 880,
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
      }),
      this.createClaim({
        claimId: this.generateClaimId(),
        userId: employee.id,
        type: ClaimTypes.BUSINESS_PROMOTION,
        status: ClaimStatus.REJECTED,
        totalAmount: 3080,
        approvedAmount: 0,
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
      })
    ];

    // Add demo approvals
    this.createApproval({
      claimId: demoClaimIds[0],
      approverId: manager.id,
      status: "pending",
      notes: ""
    });

    this.createApproval({
      claimId: demoClaimIds[1],
      approverId: manager.id,
      status: "approved",
      notes: "Approved as per policy"
    });

    this.createApproval({
      claimId: demoClaimIds[2],
      approverId: manager.id,
      status: "approved",
      notes: "Approved"
    });

    this.createApproval({
      claimId: demoClaimIds[3],
      approverId: manager.id,
      status: "rejected",
      notes: "Exceeds the per person limit for business meals"
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
}

export const storage = new MemStorage();

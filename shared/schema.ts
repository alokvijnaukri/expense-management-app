import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Roles
export const UserRoles = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  FINANCE: "finance",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

// Claim Status
export const ClaimStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  PROCESSING: "processing",
  PAID: "paid",
} as const;

export type ClaimStatusType = (typeof ClaimStatus)[keyof typeof ClaimStatus];

// Claim Types
export const ClaimTypes = {
  TRAVEL: "travel",
  BUSINESS_PROMOTION: "business_promotion",
  CONVEYANCE: "conveyance",
  MOBILE_BILL: "mobile_bill",
  RELOCATION: "relocation",
  OTHER: "other",
} as const;

export type ClaimType = (typeof ClaimTypes)[keyof typeof ClaimTypes];

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  department: text("department").notNull(),
  designation: text("designation").notNull(),
  branch: text("branch").notNull(),
  eCode: text("e_code").notNull(),
  band: text("band").notNull(),
  businessUnit: text("business_unit").notNull(),
  role: text("role").notNull().$type<UserRole>(),
  managerId: integer("manager_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Claims Schema
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  claimId: text("claim_id").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull().$type<ClaimType>(),
  status: text("status").notNull().$type<ClaimStatusType>(),
  totalAmount: real("total_amount").notNull(),
  approvedAmount: real("approved_amount"),
  details: jsonb("details").notNull(),
  notes: text("notes"),
  currentApproverId: integer("current_approver_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  paidAt: timestamp("paid_at"),
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  paidAt: true,
  approvedAmount: true,
  currentApproverId: true,
});

// Approvals Schema
export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull().references(() => claims.id),
  approverId: integer("approver_id").notNull().references(() => users.id),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = z.infer<typeof insertApprovalSchema>;

// Form-specific schema extensions
export const travelExpenseSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  purpose: z.string().min(1, "Purpose is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  returnDate: z.string().min(1, "Return date is required"),
  travelMode: z.string().min(1, "Travel mode is required"),
  travelClass: z.string().min(1, "Travel class is required"),
  advanceAmount: z.number().default(0),
  expenses: z.array(
    z.object({
      date: z.string().min(1, "Date is required"),
      category: z.string().min(1, "Category is required"),
      description: z.string().min(1, "Description is required"),
      amount: z.number().min(0.01, "Amount must be greater than 0"),
      receipt: z.string().optional(),
    })
  ).min(1, "At least one expense item is required"),
  checklist: z.object({
    receiptsAttached: z.boolean().default(false),
    policyCompliance: z.boolean().default(false),
    detailsAccurate: z.boolean().default(false),
  }),
  documents: z.array(z.string()).optional(),
  additionalNotes: z.string().optional(),
});

export const businessPromotionSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  eventDate: z.string().min(1, "Event date is required"),
  expenseType: z.string().min(1, "Expense type is required"),
  totalCost: z.number().min(0.01, "Total cost must be greater than 0"),
  attendees: z.number().int().min(1, "Number of attendees is required"),
  costPerPerson: z.number(),
  purpose: z.string().min(1, "Purpose is required"),
  documents: z.array(z.string()).optional(),
  additionalNotes: z.string().optional(),
});

export const conveyanceClaimSchema = z.object({
  date: z.string().min(1, "Date is required"),
  fromLocation: z.string().min(1, "From location is required"),
  toLocation: z.string().min(1, "To location is required"),
  distance: z.number().min(0.1, "Distance must be greater than 0"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  purpose: z.string().min(1, "Purpose is required"),
  ratePerKm: z.number(),
  totalAmount: z.number(),
  documents: z.array(z.string()).optional(),
  additionalNotes: z.string().optional(),
});

export const mobileBillSchema = z.object({
  period: z.string().min(1, "Period is required"),
  totalBill: z.number().min(0.01, "Total bill must be greater than 0"),
  deductions: z.number().default(0),
  gstAmount: z.number(),
  netClaim: z.number(),
  isdCalls: z.boolean().default(false),
  billAttachment: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export const relocationExpenseSchema = z.object({
  fromLocation: z.string().min(1, "From location is required"),
  toLocation: z.string().min(1, "To location is required"),
  movingDate: z.string().min(1, "Moving date is required"),
  ticketCost: z.number(),
  goodsTransportCost: z.number(),
  otherExpenses: z.number().default(0),
  totalAmount: z.number(),
  documents: z.array(z.string()).optional(),
  additionalNotes: z.string().optional(),
});

export const otherClaimsSchema = z.object({
  expenseType: z.string().min(1, "Expense type is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  documents: z.array(z.string()).optional(),
  additionalNotes: z.string().optional(),
});

export type TravelExpenseDetails = z.infer<typeof travelExpenseSchema>;
export type BusinessPromotionDetails = z.infer<typeof businessPromotionSchema>;
export type ConveyanceClaimDetails = z.infer<typeof conveyanceClaimSchema>;
export type MobileBillDetails = z.infer<typeof mobileBillSchema>;
export type RelocationExpenseDetails = z.infer<typeof relocationExpenseSchema>;
export type OtherClaimsDetails = z.infer<typeof otherClaimsSchema>;

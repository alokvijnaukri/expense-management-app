/**
 * Script to seed demo data - 100 claims across different categories, statuses,
 * and approval levels for comprehensive demonstration purposes.
 */

import { pool } from '../server/db.js';
import { ClaimTypes, ClaimStatus } from '../shared/schema.js';

// Config - tweak these to adjust the distribution of claims
const TOTAL_CLAIMS = 100;
const USERS = [4, 5]; // Regular employees
const APPROVERS = [3, 2, 1]; // Manager, Finance, Admin

// Helper function to get a random item from an array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get a random date within the last 60 days
const getRandomDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 60);
  const result = new Date(now);
  result.setDate(result.getDate() - daysAgo);
  return result.toISOString();
};

// Helper function to generate a random claim ID
const generateClaimId = (index) => {
  return `EXP-2025-${String(index + 10).padStart(4, '0')}`;
};

// Helper to generate random amount between 500 and 50000
const getRandomAmount = () => Math.floor(Math.random() * 49500) + 500;

// Generate travel expense details
const generateTravelExpenseDetails = () => {
  return {
    tripPurpose: getRandomItem([
      "Client Meeting", "Conference", "Training", "Site Visit", 
      "Sales Presentation", "Team Building", "Project Kickoff"
    ]),
    destination: getRandomItem([
      "New York", "San Francisco", "Chicago", "London", "Tokyo", 
      "Singapore", "Berlin", "Sydney", "Mumbai", "Dubai"
    ]),
    departureDate: getRandomDate(),
    returnDate: getRandomDate(),
    transportationMode: getRandomItem(["Flight", "Train", "Car", "Bus"]),
    accommodationType: getRandomItem(["Hotel", "Airbnb", "Corporate Housing"]),
    perDiemRequested: Math.random() > 0.5,
    expenses: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
      date: getRandomDate(),
      category: getRandomItem(["Transport", "Accommodation", "Meals", "Incidentals"]),
      description: "Expense item description",
      amount: Math.floor(Math.random() * 5000) + 100,
    }))
  };
};

// Generate business promotion details
const generateBusinessPromotionDetails = () => {
  return {
    purpose: getRandomItem([
      "Client Entertainment", "Partner Meeting", "Product Demonstration",
      "Business Development", "Networking Event", "Customer Relationship Building"
    ]),
    clientName: getRandomItem([
      "Acme Corp", "GlobalTech", "Innovate Inc.", "Enterprise Solutions",
      "TechNova", "MegaSoft", "Digital Dynamics", "Future Systems"
    ]),
    eventDate: getRandomDate(),
    location: getRandomItem([
      "Restaurant", "Hotel", "Conference Center", "Office", "Event Venue"
    ]),
    numberOfAttendees: Math.floor(Math.random() * 10) + 1,
    businessOutcome: getRandomItem([
      "Contract Discussion", "Partnership Agreement", "Sales Lead", 
      "Client Retention", "Project Extension", "New Opportunity"
    ]),
    expenses: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
      date: getRandomDate(),
      category: getRandomItem(["Meals", "Entertainment", "Venue", "Gifts"]),
      description: "Business promotion expense",
      amount: Math.floor(Math.random() * 3000) + 200,
    }))
  };
};

// Generate conveyance claim details
const generateConveyanceClaimDetails = () => {
  return {
    purpose: getRandomItem([
      "Local Client Meeting", "Office Travel", "Multiple Location Visit",
      "Training Venue", "Event Attendance", "Supplier Visit"
    ]),
    fromLocation: getRandomItem([
      "Office", "Home", "Client Site", "Airport", "Hotel", "Conference Center"
    ]),
    toLocation: getRandomItem([
      "Office", "Client Site", "Airport", "Hotel", "Conference Center", "Partner Office"
    ]),
    date: getRandomDate(),
    transportMode: getRandomItem(["Taxi", "Ride-sharing", "Public Transport", "Personal Vehicle"]),
    distanceTraveled: Math.floor(Math.random() * 100) + 5,
    isRoundTrip: Math.random() > 0.5,
    expenses: Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => ({
      date: getRandomDate(),
      category: getRandomItem(["Taxi", "Fuel", "Parking", "Toll", "Public Transport"]),
      description: "Conveyance expense",
      amount: Math.floor(Math.random() * 1000) + 100,
    }))
  };
};

// Generate mobile bill details
const generateMobileBillDetails = () => {
  return {
    billingPeriod: getRandomItem([
      "January 2025", "February 2025", "March 2025", "April 2025", 
      "May 2025", "June 2025", "July 2025", "August 2025"
    ]),
    phoneNumber: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    serviceProvider: getRandomItem(["AT&T", "Verizon", "T-Mobile", "Sprint"]),
    planType: getRandomItem(["Corporate", "Business", "Enterprise"]),
    billDate: getRandomDate(),
    billDueDate: getRandomDate(),
    billingAmount: Math.floor(Math.random() * 1000) + 500,
    dataPlanUsage: `${Math.floor(Math.random() * 20) + 1}GB`,
    internationalRoaming: Math.random() > 0.7,
  };
};

// Generate relocation expense details
const generateRelocationExpenseDetails = () => {
  return {
    relocationReason: getRandomItem([
      "New Job Role", "Office Relocation", "Department Transfer", 
      "Project Assignment", "Promotion", "Organizational Change"
    ]),
    fromLocation: getRandomItem([
      "New York", "Chicago", "Los Angeles", "Denver", "Miami",
      "Seattle", "Boston", "Austin", "Portland", "Atlanta"
    ]),
    toLocation: getRandomItem([
      "San Francisco", "Dallas", "Washington D.C.", "Phoenix", "Minneapolis",
      "Nashville", "Baltimore", "Salt Lake City", "Indianapolis", "Charlotte"
    ]),
    relocationDate: getRandomDate(),
    familySize: Math.floor(Math.random() * 5) + 1,
    housingAllowance: Math.random() > 0.5,
    temporaryAccommodation: Math.random() > 0.6,
    movingCompany: getRandomItem([
      "Allied Van Lines", "United Van Lines", "Atlas Van Lines",
      "North American Van Lines", "Mayflower Transit", "Two Men and a Truck"
    ]),
    expenses: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
      date: getRandomDate(),
      category: getRandomItem([
        "Moving Services", "Temporary Housing", "Travel", 
        "Storage", "Home Finding", "Lease Breakage"
      ]),
      description: "Relocation expense",
      amount: Math.floor(Math.random() * 5000) + 500,
    }))
  };
};

// Generate other claims details
const generateOtherClaimsDetails = () => {
  return {
    expenseCategory: getRandomItem([
      "Office Supplies", "Professional Development", "Subscription",
      "Certification", "Work From Home", "Meeting Expense",
      "Team Building", "Software Purchase", "Hardware",
      "Books and Publications", "Internet Reimbursement"
    ]),
    expenseDate: getRandomDate(),
    purpose: getRandomItem([
      "Work Necessity", "Team Productivity", "Professional Growth",
      "Business Requirement", "Client Deliverable", "Remote Work Support"
    ]),
    approvalPreApproved: Math.random() > 0.5,
    paymentMethod: getRandomItem(["Personal Card", "Cash", "Corporate Card"]),
    needsReimbursement: Math.random() > 0.3,
    expenses: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
      date: getRandomDate(),
      category: getRandomItem([
        "Hardware", "Software", "Subscription", "Office Supplies", 
        "Professional Development", "Miscellaneous"
      ]),
      description: "Other expense item",
      amount: Math.floor(Math.random() * 2000) + 100,
    }))
  };
};

// Generate claim details based on claim type
const generateClaimDetails = (claimType) => {
  switch (claimType) {
    case ClaimTypes.TRAVEL:
      return generateTravelExpenseDetails();
    case ClaimTypes.BUSINESS_PROMOTION:
      return generateBusinessPromotionDetails();
    case ClaimTypes.CONVEYANCE:
      return generateConveyanceClaimDetails();
    case ClaimTypes.MOBILE_BILL:
      return generateMobileBillDetails();
    case ClaimTypes.RELOCATION:
      return generateRelocationExpenseDetails();
    case ClaimTypes.OTHER:
      return generateOtherClaimsDetails();
    default:
      return generateTravelExpenseDetails();
  }
};

// Main function to insert claims
async function seedClaims() {
  try {
    console.log('Starting to seed demo claims...');
    
    // First clear out any existing demo claims (keep the first few real ones)
    await pool.query('DELETE FROM claims WHERE id > 10');
    await pool.query('DELETE FROM approvals WHERE claim_id > 10');
    
    // Reset sequence if needed
    await pool.query('ALTER SEQUENCE claims_id_seq RESTART WITH 11');
    await pool.query('ALTER SEQUENCE approvals_id_seq RESTART WITH 10');
    
    // Generate claims with varied types and statuses
    for (let i = 0; i < TOTAL_CLAIMS; i++) {
      const claimType = getRandomItem(Object.values(ClaimTypes));
      const userId = getRandomItem(USERS);
      
      // Distribute status - mostly pending, some approved, some rejected
      let status;
      const statusRoll = Math.random();
      if (statusRoll < 0.6) {
        status = ClaimStatus.PENDING;
      } else if (statusRoll < 0.85) {
        status = ClaimStatus.APPROVED;
      } else {
        status = ClaimStatus.REJECTED;
      }
      
      const details = generateClaimDetails(claimType);
      
      // Calculate total amount from expenses if available, otherwise use random amount
      let totalAmount = getRandomAmount();
      if (details.expenses && Array.isArray(details.expenses)) {
        totalAmount = details.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      }
      
      // Claim creation date
      const createdAt = getRandomDate();
      
      // Insert the claim
      const claimResult = await pool.query(
        `INSERT INTO claims 
         (claim_id, user_id, type, status, details, total_amount, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          generateClaimId(i + 10),
          userId,
          claimType,
          status,
          JSON.stringify(details),
          totalAmount,
          createdAt,
          createdAt
        ]
      );
      
      const claimId = claimResult.rows[0].id;
      
      // If claim is approved or rejected, create approval records
      if (status === ClaimStatus.APPROVED || status === ClaimStatus.REJECTED) {
        // Determine how many approval levels this went through
        const approvalLevels = status === ClaimStatus.APPROVED 
          ? (totalAmount < 5000 ? 1 : totalAmount < 10000 ? 2 : 3)
          : 1; // Rejected claims usually only have one level
          
        for (let level = 1; level <= approvalLevels; level++) {
          const approverId = level === 1 ? APPROVERS[0] : 
                             level === 2 ? APPROVERS[1] : APPROVERS[2];
          
          // Approval happened a bit after claim creation
          const approvalDate = new Date(createdAt);
          approvalDate.setDate(approvalDate.getDate() + level); // Each level takes a day
          
          const approvalStatus = level < approvalLevels ? ClaimStatus.APPROVED : status;
          
          const notes = approvalStatus === ClaimStatus.APPROVED
            ? getRandomItem([
                "Approved. All expenses are within policy.",
                "Verified and approved.",
                "Reviewed and approved as requested.",
                "Expenses validated against receipts.",
                "Approved with standard allowances."
              ])
            : getRandomItem([
                "Rejected due to missing receipts.",
                "Amount exceeds department budget.",
                "Policy violation - unauthorized expense.",
                "Insufficient documentation provided.",
                "Duplicate claim submitted."
              ]);
          
          // Determine the next approver ID (or null if final approval)
          const nextApproverId = level < approvalLevels ? APPROVERS[level] : null;
          
          await pool.query(
            `INSERT INTO approvals 
             (claim_id, approver_id, approval_level, status, notes, next_approver_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              claimId,
              approverId,
              level,
              approvalStatus,
              notes,
              nextApproverId,
              approvalDate.toISOString(),
              approvalDate.toISOString()
            ]
          );
        }
        
        // Update the claim's current_approver_id if still pending
        if (status === ClaimStatus.PENDING && approvalLevels < 3) {
          await pool.query(
            `UPDATE claims SET current_approver_id = $1 WHERE id = $2`,
            [APPROVERS[approvalLevels], claimId]
          );
        }
      } else if (status === ClaimStatus.PENDING) {
        // For pending claims, set the appropriate current approver
        const approverLevel = totalAmount < 5000 ? 0 : totalAmount < 10000 ? 1 : 2;
        await pool.query(
          `UPDATE claims SET current_approver_id = $1 WHERE id = $2`,
          [APPROVERS[approverLevel], claimId]
        );
      }
      
      // Log progress
      if ((i + 1) % 10 === 0) {
        console.log(`Inserted ${i + 1} claims`);
      }
    }
    
    console.log(`Successfully inserted ${TOTAL_CLAIMS} demo claims.`);
  } catch (error) {
    console.error('Error seeding demo data:', error);
  } finally {
    await pool.end();
  }
}

// Run the seeding
seedClaims().then(() => {
  console.log('Demo data seeding complete!');
  process.exit(0);
}).catch(err => {
  console.error('Error in seed process:', err);
  process.exit(1);
});
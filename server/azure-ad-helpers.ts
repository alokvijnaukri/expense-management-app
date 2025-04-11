import { storage } from './storage';
import { UserRole, UserRoles } from '@shared/schema';

// Type definition for Azure AD profile
export interface AzureADProfile {
  oid: string;          // Object ID in Azure AD
  displayName: string;  // User's display name
  givenName?: string;   // First name
  surname?: string;     // Last name
  mail?: string;        // Email address
  userPrincipalName: string; // UPN (typically email)
  jobTitle?: string;    // Job title
  department?: string;  // Department
  officeLocation?: string; // Office location
  mobilePhone?: string; // Mobile phone number
  preferredLanguage?: string; // Preferred language
  extension_EmployeeId?: string; // Custom extension attribute for employee ID
  groups?: string[];    // Group memberships (if requested)
}

// Map Azure AD roles to application roles
function mapAzureADRoleToAppRole(groups: string[] = []): UserRole {
  // This is a simplified example - you would map your actual AD groups
  if (groups.some(g => g.includes('Finance') || g.includes('finance'))) {
    return UserRoles.FINANCE;
  } else if (groups.some(g => g.includes('Manager') || g.includes('manager'))) {
    return UserRoles.MANAGER;
  } else if (groups.some(g => g.includes('Admin') || g.includes('admin'))) {
    return UserRoles.ADMIN;
  } else {
    return UserRoles.EMPLOYEE;
  }
}

// Determine manager ID based on Azure AD information
async function findManagerId(profile: AzureADProfile): Promise<number | null> {
  // This function would typically query the Azure AD Graph API to get manager info
  // For now, we'll return null as a placeholder
  return null;
}

// Map Azure AD department to internal department
function mapDepartment(adDepartment?: string): string {
  if (!adDepartment) return 'General';
  
  // Map standard department names
  const departmentMap: Record<string, string> = {
    'IT': 'Information Technology',
    'HR': 'Human Resources',
    'FIN': 'Finance',
    'MKT': 'Marketing',
    'SALES': 'Sales',
    'OPS': 'Operations',
    'ADMIN': 'Administration'
  };
  
  return departmentMap[adDepartment] || adDepartment;
}

// Extract business unit from Azure AD attributes
function determineBusinessUnit(profile: AzureADProfile): string {
  // This could be derived from a custom attribute, group membership, or department
  // For now, we'll derive it from department
  const department = profile.department || '';
  
  if (department.includes('IT') || department.includes('Technology')) {
    return 'Technology';
  } else if (department.includes('Sales') || department.includes('Marketing')) {
    return 'Revenue';
  } else if (department.includes('Finance') || department.includes('HR')) {
    return 'Support Functions';
  } else {
    return 'General';
  }
}

// Find or create a user based on Azure AD profile
export async function findOrCreateUserFromAzureAD(profile: AzureADProfile): Promise<any> {
  // First, check if the user already exists by looking up the Azure AD Object ID
  // We would typically store this as an external_id in our users table
  let user = await storage.getUserByExternalId(profile.oid);
  
  if (user) {
    // User exists, update any changed attributes
    const updatedUser = {
      ...user,
      name: profile.displayName,
      email: profile.mail || profile.userPrincipalName,
      department: mapDepartment(profile.department),
      designation: profile.jobTitle || user.designation,
      branch: profile.officeLocation || user.branch,
      businessUnit: determineBusinessUnit(profile)
    };
    
    // Only update if something changed
    if (JSON.stringify(user) !== JSON.stringify(updatedUser)) {
      user = await storage.updateUser(user.id, updatedUser);
    }
    
    return user;
  } else {
    // User doesn't exist, create a new one
    const groups = profile.groups || [];
    const role = mapAzureADRoleToAppRole(groups);
    const managerId = await findManagerId(profile);
    
    // Generate a random eCode if not provided from AD
    const eCode = profile.extension_EmployeeId || `E${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Create the new user
    const newUser = {
      username: profile.userPrincipalName.split('@')[0], // Use UPN username part
      name: profile.displayName,
      email: profile.mail || profile.userPrincipalName,
      department: mapDepartment(profile.department),
      designation: profile.jobTitle || 'Employee',
      branch: profile.officeLocation || 'Main Office',
      eCode: eCode,
      band: 'B1', // Default band
      businessUnit: determineBusinessUnit(profile),
      role: role,
      managerId: managerId,
      externalId: profile.oid // Store Azure AD Object ID
    };
    
    return await storage.createUserFromExternalAuth(newUser);
  }
}
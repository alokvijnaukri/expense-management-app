// Azure AD Configuration
export const azureADConfig = {
  // The OAuth 2.0 Client ID of the registered application
  clientID: process.env.AZURE_AD_CLIENT_ID || '',
  
  // The client secret if using confidential client application
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
  
  // The Azure AD tenant ID or domain name
  tenantID: process.env.AZURE_AD_TENANT_ID || '',
  
  // Azure AD issuer URL
  issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
  
  // Redirect URL after successful authentication
  redirectUrl: process.env.AZURE_AD_REDIRECT_URL || 'http://localhost:5000/auth/openid/return',
  
  // Azure AD metadata endpoint
  identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  
  // Requested scopes for access token
  scope: ['openid', 'profile', 'email', 'User.Read'],
  
  // Response type from Azure AD
  responseType: 'code id_token',
  
  // Response mode
  responseMode: 'form_post',
  
  // User attributes to be requested from Azure AD
  userAttributes: {
    nameAttributeKey: 'displayName',
    emailAttributeKey: 'mail',
    userIdAttributeKey: 'oid'
  },
  
  // Whether to validate token issuer
  validateIssuer: true,
  
  // Whether to pass the request object when calling verify callback
  passReqToCallback: false,
  
  // Whether to log token and claims
  loggingLevel: 'info',
  
  // Whether to save the session after response is generated
  saveSession: true
};
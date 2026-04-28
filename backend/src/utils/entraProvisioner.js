const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Microsoft Entra ID (Azure AD) Provisioning Utility
 * 
 * Handles programmatic user creation in the Entra ID / CIAM tenant
 * using the Microsoft Graph API.
 */

const GRAPH_TENANT_ID = process.env.GRAPH_TENANT_ID;
const GRAPH_CLIENT_ID = process.env.GRAPH_CLIENT_ID;
const GRAPH_CLIENT_SECRET = process.env.GRAPH_CLIENT_SECRET;

/**
 * Gets an access token for Microsoft Graph using Client Credentials flow.
 */
async function getGraphToken() {
  if (!GRAPH_CLIENT_SECRET) {
    console.warn('[ENTRA] No GRAPH_CLIENT_SECRET found. Provisioning will be mocked.');
    return null;
  }

  const url = `https://login.microsoftonline.com/${GRAPH_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: GRAPH_CLIENT_ID,
    client_secret: GRAPH_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to get Graph token');
    }

    return data.access_token;
  } catch (err) {
    console.error('[ENTRA] Token Error:', err.message);
    throw err;
  }
}

/**
 * Creates a user account in Microsoft Entra ID (CIAM).
 * 
 * @param {Object} user - { name, email, department }
 */
async function provisionEntraUser(user) {
  console.log(`[ENTRA] Provisioning account for: ${user.email}`);

  const token = await getGraphToken();

  if (!token) {
    // Mock successful provisioning for local dev/demo
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[ENTRA-MOCK] Successfully provisioned ${user.email} (MOCK)`);
    return {
      id: `mock-guid-${Date.now()}`,
      userPrincipalName: user.email,
      mock: true
    };
  }

  const url = 'https://graph.microsoft.com/v1.0/users';
  const userData = {
    accountEnabled: true,
    displayName: user.name,
    mailNickname: user.email.split('@')[0],
    userPrincipalName: user.email, // Note: In CIAM this must be the full email
    passwordProfile: {
      forceChangePasswordNextSignIn: true,
      password: `Welcome@${Math.random().toString(36).slice(-8)}!123` // Randomized temp password
    },
    // Custom data
    department: user.department,
    jobTitle: 'New Hire'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    if (!response.ok) {
      // If user already exists, we might get a 400
      if (data.error?.code === 'Request_BadRequest' && data.error?.message?.includes('already exists')) {
        console.warn(`[ENTRA] User ${user.email} already exists in Entra.`);
        return { existing: true, userPrincipalName: user.email };
      }
      throw new Error(data.error?.message || 'Failed to create user in Graph');
    }

    console.log(`[ENTRA] Successfully provisioned ${user.email} in Microsoft Entra ID`);
    return data;
  } catch (err) {
    console.error('[ENTRA] Provisioning Error:', err.message);
    throw err;
  }
}

module.exports = { provisionEntraUser };

import { LogLevel } from "@azure/msal-browser";

/**
 * Enterprise Azure AD B2C Configuration for Sovereign Cloud (OnboardIQ)
 * 
 * To activate B2C:
 * 1. Create a .env file in frontend/ with:
 *    VITE_B2C_TENANT=yourtenant
 *    VITE_B2C_CLIENT_ID=your-client-id-guid
 *    VITE_B2C_POLICY=B2C_1_susi
 * 2. Restart the Vite dev server.
 */

const B2C_TENANT = import.meta.env.VITE_B2C_TENANT || "onboardin";
const B2C_CLIENT_ID = import.meta.env.VITE_B2C_CLIENT_ID || "28190bb2-1f43-4458-8ad3-e1780d6bc352";
const B2C_DIRECTORY_ID = import.meta.env.VITE_B2C_DIRECTORY_ID || "a0164170-e70e-42fe-98a6-e469d1a73851";

export const b2cPolicies = {
  names: {
    signUpSignIn: import.meta.env.VITE_B2C_POLICY || "susi", 
  },
  authorities: {
    signUpSignIn: {
      authority: `https://${B2C_TENANT}.ciamlogin.com`,
    },
  },
  authorityDomain: `${B2C_TENANT}.ciamlogin.com`,
};

export const msalConfig = {
  auth: {
    clientId: B2C_CLIENT_ID,
    authority: b2cPolicies.authorities.signUpSignIn.authority,
    knownAuthorities: [b2cPolicies.authorityDomain],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: ["openid", "offline_access"],
};

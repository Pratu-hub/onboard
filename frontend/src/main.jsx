import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Router from './Router.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PublicClientApplication, EventType } from "@azure/msal-browser"
import { MsalProvider } from "@azure/msal-react"
import { msalConfig } from "./authConfig"

const msalInstance = new PublicClientApplication(msalConfig)

// MSAL must process the redirect response BEFORE React renders.
// Without this, the auth tokens in the URL hash are never captured.
msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().then((response) => {
    if (response) {
      console.log('✅ B2C redirect handled, account:', response.account?.username);
      msalInstance.setActiveAccount(response.account);
    } else {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
      }
    }

    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <MsalProvider instance={msalInstance}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </MsalProvider>
      </StrictMode>,
    )
  }).catch((err) => {
    console.error('MSAL redirect error:', err);
  });
});

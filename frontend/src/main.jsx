import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Router from './Router.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PublicClientApplication } from "@azure/msal-browser"
import { MsalProvider } from "@azure/msal-react"
import { msalConfig } from "./authConfig"

const msalInstance = new PublicClientApplication(msalConfig)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </MsalProvider>
  </StrictMode>,
)

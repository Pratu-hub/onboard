import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

const Login = () => {
  const { login, loginWithB2C, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('NEW_HIRE');
  const [b2cLoading, setB2cLoading] = useState(false);
  const [b2cError, setB2cError] = useState(null);
  const [devError, setDevError] = useState(null);
  const { instance } = useMsal();

  if (user) {
    if (user.role === 'NEW_HIRE') return <Navigate to="/profile" />;
    if (user.role === 'HR') return <Navigate to="/dashboard/hr" />;
    return <Navigate to="/profile" />;
  }

  const handleB2CLogin = async () => {
    setB2cError(null);
    setB2cLoading(true);
    try {
      // Switched to redirect method to avoid popup loops and bridge across ports
      await instance.loginRedirect(loginRequest);
    } catch (e) {
      console.error('B2C Redirect Error:', e);
      setB2cError("Azure AD B2C redirect failed. Ensure your tenant is configured correctly.");
      setB2cLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setDevError(null);
    try {
      await login(role);
      navigate(
        role === 'NEW_HIRE' ? '/profile'
        : role === 'HR' ? '/dashboard/hr'
        : '/dashboard/it-admin'
      );
    } catch (err) {
      setDevError(err.message || 'Login failed');
    }
  };

  return (
    <div className="bg-background font-body text-on-background min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Architectural Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-fixed-dim/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] bg-secondary-container/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-surface-container-low to-transparent opacity-50"></div>
      </div>

      {/* Auth Shell */}
      <main className="w-full max-w-[1200px] grid md:grid-cols-2 gap-0 glass-panel shadow-2xl rounded-xl overflow-hidden relative z-10 border border-outline-variant/10 bg-white">
        {/* Branding Side (Editorial Visual) */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-surface-container-low relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-on-background">OnboardIQ</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-medium leading-tight mb-6 text-on-surface">
              Architecting the future of <span className="text-primary font-semibold">Enterprise Onboarding</span>.
            </h1>
            <p className="text-on-surface-variant text-lg max-w-md">
                Secure, scalable, and seamless identity management for the modern workforce.
            </p>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/15 max-w-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                <span className="text-sm font-medium text-on-surface-variant">SOC2 Type II &amp; ISO 27001 Certified Environment</span>
            </div>
          </div>
          <div className="absolute bottom-[-10%] right-[-10%] opacity-5">
            <span className="material-symbols-outlined text-[300px]" style={{ fontWeight: 100 }}>hub</span>
          </div>
        </div>

        {/* Forms Side */}
        <div className="flex flex-col bg-surface-container-lowest p-8 md:p-16">
          <div className="w-full max-w-sm mx-auto">
            <header className="mb-10">
              <h2 className="text-2xl font-semibold text-on-background mb-2">Sign In</h2>
              <p className="text-on-surface-variant text-sm">Welcome back. Enter your credentials to access the Sovereign Cloud.</p>
            </header>

            {/* Azure AD B2C Enterprise SSO — Primary */}
            <div className="mb-8">
              <p className="text-center text-xs font-medium text-on-surface-variant mb-4 uppercase tracking-widest">Enterprise SSO</p>
              <button 
                onClick={handleB2CLogin}
                disabled={b2cLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors group disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                <span className="text-sm font-medium text-on-surface">
                  {b2cLoading ? 'Authenticating...' : 'Sign in with Microsoft Azure'}
                </span>
              </button>
              {b2cError && (
                <p className="mt-2 text-xs text-red-600 text-center">{b2cError}</p>
              )}
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-3 bg-surface-container-lowest text-on-surface-variant uppercase tracking-widest font-semibold">Development Login</span>
              </div>
            </div>

            {/* Dev Mock Login */}
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-on-surface-variant">Mock Role Selector</label>
                <div className="relative">
                  <select 
                     value={role} onChange={(e) => setRole(e.target.value)}
                     className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface"
                  >
                     <option value="NEW_HIRE">New Hire Profile (Alexander)</option>
                     <option value="HR">HR Profile (Sarah Jenkins)</option>
                     <option value="IT_ADMIN">IT Admin Profile (David Chen)</option>
                  </select>
                </div>
                <p className="text-xs text-primary">Use this dropdown to simulate login into different roles during development.</p>
              </div>
              
              <button className="w-full kinetic-button bg-gradient-to-br from-primary to-primary-container text-white font-semibold py-3.5 rounded-lg shadow-md shadow-primary/20 flex items-center justify-center gap-2" type="submit">
                <span>Continue to Dashboard</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              {devError && (
                <p className="mt-3 text-xs text-red-600 text-center">{devError}</p>
              )}
              {devError && (
                <p className="mt-3 text-xs text-red-600 text-center">{devError}</p>
              )}
            </form>
          </div>
          <footer className="mt-auto pt-12 flex justify-between items-center text-[10px] uppercase tracking-widest text-outline font-bold">
            <span>© 2026 Sovereign Cloud</span>
            <div className="flex gap-4">
               <a className="hover:text-on-surface" href="#">Privacy</a>
               <a className="hover:text-on-surface" href="#">Terms</a>
            </div>
          </footer>
        </div>
      </main>

      {/* Support Floating Action */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="flex items-center gap-3 px-5 py-3 bg-surface-container-lowest shadow-xl shadow-on-background/5 border border-outline-variant/20 rounded-full hover:bg-surface transition-all group">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 0" }}>help</span>
          <span className="text-sm font-semibold text-slate-500">System Status: <span className="text-green-600">Optimal</span></span>
        </button>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [b2cLoading, setB2cLoading] = useState(false);
  const [b2cError, setB2cError] = useState(null);
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
      await instance.loginRedirect(loginRequest);
    } catch (e) {
      console.error('B2C Redirect Error:', e);
      setB2cError("Azure AD B2C redirect failed. Ensure your tenant is configured correctly.");
      setB2cLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-body">
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[15%] -left-[10%] w-[45%] h-[45%] bg-primary/15 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[30%] -right-[8%] w-[35%] h-[50%] bg-secondary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s' }}></div>
        <div className="absolute -bottom-[10%] left-[30%] w-[30%] h-[30%] bg-primary/8 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>

      {/* Auth Card */}
      <main className="w-full max-w-[1100px] grid md:grid-cols-2 gap-0 glass-panel rounded-2xl overflow-hidden relative z-10 glass-animate-in">
        {/* Branding Side */}
        <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden border-r border-white/[0.06]">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-14">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white font-headline">OnboardIQ</span>
            </div>
            <h1 className="text-4xl lg:text-[2.75rem] font-semibold leading-[1.15] mb-6 text-white tracking-tight">
              Architecting the future of{' '}
              <span className="text-primary">Enterprise Onboarding</span>.
            </h1>
            <p className="text-white/50 text-base max-w-md leading-relaxed">
              Secure, scalable, and seamless identity management for the modern workforce.
            </p>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="flex items-center gap-4 p-4 rounded-xl glass-surface max-w-sm">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="text-sm font-medium text-white/60">SOC2 Type II & ISO 27001 Certified Environment</span>
            </div>
          </div>
          {/* Subtle watermark */}
          <div className="absolute bottom-[-10%] right-[-10%] opacity-[0.03]">
            <span className="material-symbols-outlined text-[300px] text-white" style={{ fontWeight: 100 }}>hub</span>
          </div>
        </div>

        {/* Forms Side */}
        <div className="flex flex-col p-8 md:p-14">
          <div className="w-full max-w-sm mx-auto">
            <header className="mb-10">
              {/* Mobile logo */}
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-white">OnboardIQ</span>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Sign In</h2>
              <p className="text-white/40 text-sm">Welcome back. Enter your credentials to access the Sovereign Cloud.</p>
            </header>

            {/* Azure AD B2C Enterprise SSO */}
            <div className="mb-8">
              <p className="text-center text-[10px] font-semibold text-white/30 mb-4 uppercase tracking-[0.2em]">Enterprise SSO</p>
              <button
                onClick={handleB2CLogin}
                disabled={b2cLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 glass-surface rounded-xl hover:bg-white/[0.06] transition-all duration-200 group disabled:opacity-40 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                  {b2cLoading ? 'Authenticating...' : 'Sign in with Microsoft Azure'}
                </span>
              </button>
              {b2cError && (
                <p className="mt-3 text-xs text-danger text-center">{b2cError}</p>
              )}
            </div>

          </div>
          <footer className="mt-auto pt-12 flex justify-between items-center text-[10px] uppercase tracking-[0.15em] text-white/20 font-semibold">
            <span>© 2026 Sovereign Cloud</span>
            <div className="flex gap-4">
               <a className="hover:text-white/50 transition-colors" href="#">Privacy</a>
               <a className="hover:text-white/50 transition-colors" href="#">Terms</a>
            </div>
          </footer>
        </div>
      </main>

      {/* System Status FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="flex items-center gap-3 px-5 py-2.5 glass-elevated rounded-full hover:bg-white/[0.08] transition-all group">
          <span className="material-symbols-outlined text-white/40 text-lg">help</span>
          <span className="text-xs font-semibold text-white/40">System Status: <span className="text-success">Optimal</span></span>
        </button>
      </div>
    </div>
  );
};

export default Login;

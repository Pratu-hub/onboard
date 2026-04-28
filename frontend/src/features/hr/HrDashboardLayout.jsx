import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { useMsal } from '@azure/msal-react';

const HrDashboardLayout = () => {
  const { user, logout } = useAuth();
  const { instance } = useMsal();

  const handleLogout = async () => {
    logout();
    try {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        await instance.logoutRedirect({ 
          account: accounts[0], 
          postLogoutRedirectUri: window.location.origin + '/login' 
        });
        return;
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
  };
  return (
    <div className="text-white/90 font-body h-screen flex overflow-hidden">
      
      {/* Glass SideNavBar */}
      <aside className="h-full w-64 flex flex-col p-4 glass-panel border-r-0 z-50 font-headline text-sm tracking-tight flex-shrink-0 rounded-none">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="material-symbols-outlined text-white text-lg">folder_shared</span>
          </div>
          <div>
            <h1 className="font-headline font-extrabold text-xl tracking-tighter text-primary">OnboardIQ</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold">Enterprise Admin</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1">
          <NavLink 
            to="/dashboard/hr/cases"
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                isActive 
                  ? 'bg-primary/15 text-primary font-bold border border-primary/20' 
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
              }`
            }
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">folder_shared</span>
            <span>All Cases</span>
          </NavLink>
          <NavLink 
            to="/dashboard/hr/analytics"
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                isActive 
                  ? 'bg-primary/15 text-primary font-bold border border-primary/20' 
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
              }`
            }
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">analytics</span>
            <span>Analytics</span>
          </NavLink>
          <NavLink 
            to="/dashboard/hr/team"
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                isActive 
                  ? 'bg-primary/15 text-primary font-bold border border-primary/20' 
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
              }`
            }
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">group</span>
            <span>Team Management</span>
          </NavLink>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">lock</span>
            <span className="font-medium">IT Provisioning Config</span>
          </a>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-white/[0.06] space-y-1">
          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl mb-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/25">
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="text-xs tracking-wider uppercase">Create New Case</span>
          </button>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
            <span className="material-symbols-outlined text-lg">settings</span>
            <span className="font-medium">Settings</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
            <span className="material-symbols-outlined text-lg">help_outline</span>
            <span className="font-medium">Support</span>
          </a>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors mt-2 text-left">
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Glass TopAppBar */}
        <header className="flex justify-between items-center h-14 w-full px-8 sticky top-0 z-40 glass-surface border-b-0 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-lg">search</span>
              <input 
                type="text" 
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all placeholder:text-white/25 text-white/80 outline-none" 
                placeholder="Search cases, employees, or analytics..." 
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button className="p-2 text-white/40 hover:bg-white/[0.06] rounded-xl transition-all relative">
                <span className="material-symbols-outlined text-xl">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border border-[#0a0a12]"></span>
              </button>
              <button className="p-2 text-white/40 hover:bg-white/[0.06] rounded-xl transition-all">
                <span className="material-symbols-outlined text-xl">help_center</span>
              </button>
            </div>
            <div className="h-6 w-px bg-white/[0.08]"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white/80">Alex Rivera</p>
                <p className="text-[10px] text-white/30 font-semibold">Global Admin</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold font-headline text-sm border border-primary/30">
                AR
              </div>
            </div>
          </div>
        </header>

        {/* View Port (Outlet) */}
        <div className="flex-1 overflow-y-auto p-6 glass-animate-in">
          <Outlet />
        </div>
        
        {/* Glass FAB */}
        <button className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
          <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">add</span>
          <div className="absolute right-16 glass-elevated text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            New Case
          </div>
        </button>
      </main>
    </div>
  );
};

export default HrDashboardLayout;

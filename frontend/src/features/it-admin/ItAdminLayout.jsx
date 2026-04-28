import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { useMsal } from '@azure/msal-react';

const ItAdminLayout = () => {
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
    <div className="text-white/90 font-body h-screen flex overflow-hidden bg-[#0a0a12]">
      
      {/* Glass SideNavBar */}
      <aside className="h-full w-64 flex flex-col p-4 glass-panel border-r-0 z-50 font-headline text-sm tracking-tight flex-shrink-0 rounded-none bg-transparent">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="material-symbols-outlined text-white text-lg" style={{fontVariationSettings: "'FILL' 1"}}>terminal</span>
          </div>
          <div>
            <h1 className="font-headline font-extrabold text-xl tracking-tighter text-white">Root Admin</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold">Cluster-01 / Ops</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1">
          <NavLink 
            to="/dashboard/it-admin/provisioning"
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                isActive 
                  ? 'bg-primary/15 text-primary font-bold border border-primary/20' 
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06] hover:translate-x-1'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">queue</span>
            <span>Provisioning Queue</span>
          </NavLink>
          <NavLink 
            to="/dashboard/it-admin/logs"
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                isActive 
                  ? 'bg-primary/15 text-primary font-bold border border-primary/20' 
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06] hover:translate-x-1'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">terminal</span>
            <span>System Logs</span>
          </NavLink>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 cursor-not-allowed">
            <span className="material-symbols-outlined text-[20px]">router</span>
            <span className="font-medium">Network Status</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 cursor-not-allowed">
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            <span className="font-medium">Security Audit</span>
          </div>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-white/[0.06] space-y-1">
          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl mb-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/25">
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span className="text-xs tracking-wider uppercase">Run Diagnostics</span>
          </button>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            <span className="font-medium">Documentation</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
            <span className="material-symbols-outlined text-[20px]">support_agent</span>
            <span className="font-medium">Support</span>
          </a>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors mt-2 text-left">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* Glass TopAppBar */}
        <header className="flex justify-between items-center h-16 w-full px-8 sticky top-0 z-40 glass-surface border-b border-white/[0.05] flex-shrink-0">
          <div className="flex items-center gap-8">
             {/* Can add breadcrumbs or section title here if needed */}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">search</span>
              <input 
                type="text" 
                className="w-full glass-surface border-none rounded-full py-1.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/30 text-white outline-none" 
                placeholder="Search resources..." 
              />
            </div>
            <button className="p-2 text-white/40 hover:bg-white/[0.06] rounded-full transition-all">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <button className="p-2 text-white/40 hover:bg-white/[0.06] rounded-full transition-all">
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
            <div className="h-8 w-8 ml-2 rounded-full overflow-hidden border border-white/20">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuByeBOgofzRsk5E8T-akr3fJWBxASQSuFKxum0oN5Ce3NnkIWjldXDv3kvWCbfXuOgyh603hsFbH67npKlLY_i62gyIYCqdx_oynBAhspg7p6tC-j1_eUDrfEXHfqpKWl6Mfb2rWXYCKcsQ5_DthgGnQUFiyry7phcPCaMeTR3kTGV031LDG2_u_CIcQIFg3dsI5WehbUMAFW8nZhYcE8b8fvNXijlysM0G6RTbetUDmoO2ICdZb6ChVO0hOQPxqsrZ1t9OAj4qQA" 
                alt="Admin Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* View Port (Outlet) */}
        <div className="flex-1 overflow-y-auto p-8 glass-animate-in">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ItAdminLayout;

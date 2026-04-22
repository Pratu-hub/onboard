import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const HrDashboardLayout = () => {
  return (
    <div className="bg-background text-on-surface font-body selection:bg-secondary-container/30 h-screen flex overflow-hidden">
      
      {/* SideNavBar */}
      <aside className="h-full w-64 flex flex-col p-4 bg-slate-50 dark:bg-slate-900 border-r border-transparent z-50 font-headline text-sm tracking-tight flex-shrink-0">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg">folder_shared</span>
          </div>
          <div>
            <h1 className="font-headline font-extrabold text-xl tracking-tighter text-[#005faa]">OnboardIQ</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Enterprise Admin</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1">
          <NavLink 
            to="/dashboard/hr/cases"
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                isActive 
                  ? 'bg-white dark:bg-slate-800 text-[#005faa] font-bold shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-[#005faa] hover:bg-slate-100 dark:hover:bg-slate-800'
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
                  ? 'bg-white dark:bg-slate-800 text-[#005faa] font-bold shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-[#005faa] hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">analytics</span>
            <span>Analytics</span>
          </NavLink>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#005faa] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">group</span>
            <span className="font-medium">Team Management</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#005faa] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">lock</span>
            <span className="font-medium">IT Provisioning Config</span>
          </a>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <button className="w-full bg-gradient-to-br from-primary to-primary-container text-white font-bold py-3 px-4 rounded-xl mb-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]">
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="text-xs tracking-wider uppercase">Create New Case</span>
          </button>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#005faa] hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-lg">settings</span>
            <span className="font-medium">Settings</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#005faa] hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-lg">help_outline</span>
            <span className="font-medium">Support</span>
          </a>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface h-full overflow-hidden">
        
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 w-full px-8 sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                type="text" 
                className="w-full bg-surface-container-high border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-slate-400" 
                placeholder="Search cases, employees, or analytics..." 
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                <span className="material-symbols-outlined">help_center</span>
              </button>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface">Alex Rivera</p>
                <p className="text-[10px] text-slate-500">Global Admin</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-bold font-headline ring-2 ring-primary/10">
                AR
              </div>
            </div>
          </div>
        </header>

        {/* View Port (Outlet) */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
        
        {/* Contextual FAB - Only for main screens */}
        <button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
          <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">add</span>
          <div className="absolute right-16 bg-on-surface text-white text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            New Case
          </div>
        </button>
      </main>
    </div>
  );
};

export default HrDashboardLayout;

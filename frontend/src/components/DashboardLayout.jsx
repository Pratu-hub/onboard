import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import Avatar from './Avatar';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { instance } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    navigate('/login');
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed top-0 w-full flex justify-between items-center px-8 h-16 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-slate-900 font-headline">OnboardIQ</span>
            <nav className="hidden md:flex items-center gap-1 ml-6">
              {[
                { label: 'Dashboard', path: '/dashboard/new-hire' },
                { label: 'Status Tracker', path: '/dashboard/status-tracker' },
              ].map(link => {
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-primary bg-primary/5 font-semibold'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">notifications</span>
          
          <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
          
          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700 leading-tight">{user?.name || 'Alexander'}</p>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">{(user?.role || 'NEW_HIRE').replace('_', ' ')}</p>
            </div>
            <div 
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={toggleDropdown}
            >
                <Avatar name={user?.name || 'Alexander'} size="md" />
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <div 
                    className="px-4 py-2 hover:bg-slate-50 flex items-center gap-3 cursor-pointer group"
                    onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/profile');
                    }}
                >
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-xl">account_circle</span>
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Account</span>
                </div>
                <div className="h-[1px] bg-slate-100 my-1 mx-2"></div>
                <div 
                    className="px-4 py-2 hover:bg-red-50 flex items-center gap-3 cursor-pointer group"
                    onClick={handleLogout}
                >
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-red-500 text-xl">logout</span>
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-red-600">Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 sm:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

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
    <div className="min-h-screen font-body">
      {/* Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 mx-4 mt-3">
        <div className="glass-elevated rounded-2xl flex justify-between items-center px-6 h-14 shadow-lg shadow-black/10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white font-headline">OnboardIQ</span>
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
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-primary bg-primary/10 font-semibold'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white/30 cursor-pointer hover:text-white/60 transition-colors text-xl">notifications</span>
            
            <div className="h-6 w-px bg-white/[0.08] mx-1"></div>
            
            <div className="flex items-center gap-3 relative" ref={dropdownRef}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white/80 leading-tight">{user?.name || 'Alexander'}</p>
                <p className="text-[10px] uppercase font-bold text-white/30 tracking-wider">{(user?.role || 'NEW_HIRE').replace('_', ' ')}</p>
              </div>
              <div 
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={toggleDropdown}
              >
                  <Avatar name={user?.name || 'Alexander'} size="md" />
              </div>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 glass-elevated rounded-xl py-2 z-[60] glass-animate-in">
                  <div 
                      className="px-4 py-2.5 hover:bg-white/[0.06] flex items-center gap-3 cursor-pointer group transition-colors"
                      onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/profile');
                      }}
                  >
                      <span className="material-symbols-outlined text-white/40 group-hover:text-primary text-xl transition-colors">account_circle</span>
                      <span className="text-sm font-semibold text-white/60 group-hover:text-white transition-colors">Account</span>
                  </div>
                  <div className="h-px bg-white/[0.06] my-1 mx-3"></div>
                  <div 
                      className="px-4 py-2.5 hover:bg-danger/10 flex items-center gap-3 cursor-pointer group transition-colors"
                      onClick={handleLogout}
                  >
                      <span className="material-symbols-outlined text-white/40 group-hover:text-danger text-xl transition-colors">logout</span>
                      <span className="text-sm font-semibold text-white/60 group-hover:text-danger transition-colors">Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 sm:px-8 pb-12">
        <div className="max-w-7xl mx-auto glass-animate-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

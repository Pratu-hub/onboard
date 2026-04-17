import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

const AuthContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://onboard-back.azurewebsites.net';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { instance, accounts } = useMsal();

  useEffect(() => {
    // Check if user is already logged in on mount
    const checkAuth = async () => {
      console.log('🔄 Checking Auth State...');
      const token = localStorage.getItem('onboardiq_token');
      if (token) {
        console.log('Found local token, verifying...');
        try {
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Token valid, user:', data.user.email);
            setUser(data.user);
            setLoading(false);
            return;
          } else {
            console.warn('❌ Token expired or invalid, clearing storage');
            localStorage.removeItem('onboardiq_token');
            localStorage.removeItem('onboardiq_user');
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
        }
      }

      if (accounts && accounts.length > 0) {
        console.log('Active B2C accounts detected, attempting silent sync...');
        try {
          const staticTokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
          });
          
          if (staticTokenResponse && staticTokenResponse.idToken) {
            const b2cResponse = await fetch(`${API_BASE}/api/auth/b2c`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: staticTokenResponse.idToken })
            });
            
            if (b2cResponse.ok) {
              const data = await b2cResponse.json();
              console.log('✅ Silent B2C sync successful');
              localStorage.setItem('onboardiq_token', data.token);
              localStorage.setItem('onboardiq_user', JSON.stringify(data.user));
              setUser(data.user);
              setLoading(false);
              return;
            }
          }
        } catch (refreshError) {
          console.error('Silent B2C token refresh failed:', refreshError);
        }
      }

      console.log('👋 Not logged in or needs manual interaction');
      setLoading(false);
    };

    checkAuth();
  }, [instance, accounts]);

  /**
   * Dev mock login — sends a role to the backend,
   * which looks up a seeded user and returns a self-signed JWT.
   */
  const login = async (role) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      const { token, user: userData } = data;

      setUser(userData);
      localStorage.setItem('onboardiq_token', token);
      localStorage.setItem('onboardiq_user', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Azure AD B2C login — sends the B2C idToken to the backend,
   * which validates it, finds or creates the user, and returns our own JWT.
   */
  const loginWithB2C = async (idToken) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/b2c`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'B2C login failed');
      }

      const data = await response.json();
      const { token, user: userData } = data;

      localStorage.setItem('onboardiq_token', token);
      localStorage.setItem('onboardiq_user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('B2C Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('onboardiq_token');
    localStorage.removeItem('onboardiq_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithB2C, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

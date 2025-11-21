'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', session.access_token);
          // Also set cookie for middleware
          document.cookie = `auth_token=${session.access_token}; path=/; max-age=86400`;
        }
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          // Remove cookie
          document.cookie = 'auth_token=; path=/; max-age=0';
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', session.access_token);
          // Also set cookie for middleware
          document.cookie = `auth_token=${session.access_token}; path=/; max-age=86400`;
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.session.access_token);
          // Also set cookie for middleware
          document.cookie = `auth_token=${data.session.access_token}; path=/; max-age=86400`;
        }
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        // Remove cookie
        document.cookie = 'auth_token=; path=/; max-age=0';
      }
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}


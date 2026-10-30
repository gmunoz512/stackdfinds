import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'host' | 'vendor' | 'user' | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const fetchUserRole = async (userId: string): Promise<UserRole> => {
  try {
    // Fetch all roles for the user (handles cases with multiple roles)
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Priority: admin > host > vendor > user
    const roles = data.map(r => r.role);
    let resolvedRole: UserRole = null;
    if (roles.includes('admin')) resolvedRole = 'host'; // Admin acts as host for UI purposes
    else if (roles.includes('host')) resolvedRole = 'host';
    else if (roles.includes('vendor')) resolvedRole = 'vendor';
    else if (roles.includes('user')) resolvedRole = 'user';
    else resolvedRole = (data[0]?.role as UserRole) ?? null;
    
    return resolvedRole;
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state with session and role before setting isLoading to false
  const initializeAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setAuthState({
          session,
          user: session.user,
          role,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          session: null,
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    // Initialize auth on mount
    initializeAuth();

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Skip initial session event since we handle it in initializeAuth
        if (event === 'INITIAL_SESSION') return;

        if (session?.user) {
          // Update state immediately with user info, then defer role fetch
          setAuthState(prev => ({
            ...prev,
            session,
            user: session.user,
            isAuthenticated: true,
            isLoading: false,
          }));
          
          // Defer role fetch to avoid deadlock
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            setAuthState(prev => ({ ...prev, role }));
          }, 0);
        } else {
          setAuthState({
            session: null,
            user: null,
            role: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initializeAuth]);

  const setUserRole = async (role: 'host' | 'vendor' | 'user'): Promise<{ error: string | null }> => {
    if (!authState.user) return { error: 'Not authenticated' };

    // Use server-side Edge Function to assign role securely
    const { data, error } = await supabase.functions.invoke('assign-role', { 
      body: { role } 
    });

    if (error) {
      console.error('Error assigning role:', error.message);
      return { error: error.message };
    }

    if (!data?.success) {
      return { error: data?.error || 'Failed to assign role' };
    }

    // Refresh role from database to confirm
    const newRole = await fetchUserRole(authState.user.id);
    setAuthState(prev => ({ ...prev, role: newRole }));
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthState({
      user: null,
      session: null,
      role: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return {
    ...authState,
    setUserRole,
    signOut,
  };
};

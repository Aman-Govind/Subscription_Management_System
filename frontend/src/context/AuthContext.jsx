import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Synchronous initialization prevents hydration flash or temporary null role state
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [role, setRole] = useState(() => authService.getUserRole());
  const [token, setToken] = useState(() => authService.getToken());
  const [isLoading, setIsLoading] = useState(false);

  // Monitor for global session invalidation events dispatched by the API interceptor
  useEffect(() => {
    const handleSessionInvalidated = () => {
      authService.logout();
      setUser(null);
      setRole(null);
      setToken(null);
    };

    window.addEventListener('brightloop:session_invalidated', handleSessionInvalidated);
    return () => {
      window.removeEventListener('brightloop:session_invalidated', handleSessionInvalidated);
    };
  }, []);

  /**
   * Authenticate user with strict role locking and state persistence
   */
  const login = useCallback(async ({ email, password, role: requestedRole }) => {
    setIsLoading(true);
    try {
      const result = await authService.login({
        email,
        password,
        role: requestedRole,
      });

      setUser(result.user);
      setRole(result.role);
      setToken(result.token);

      return { success: true, user: result.user, role: result.role };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Authentication failed. Please verify your credentials.',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register a new organization user and lock their session role
   */
  const register = useCallback(async ({ name, email, company, role: assignedRole, password }) => {
    setIsLoading(true);
    try {
      const result = await authService.register({
        name,
        email,
        company,
        role: assignedRole,
        password,
      });

      setUser(result.user);
      setRole(result.role);
      setToken(result.token);

      return { success: true, user: result.user, role: result.role };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed. Please check inputs and retry.',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Securely terminate session and purge all local tokens and profile data
   */
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setRole(null);
    setToken(null);
  }, []);

  /**
   * Validate whether the active user role fulfills access requirements
   */
  const hasRole = useCallback(
    (requiredRoles) => {
      if (!role) return false;
      if (!requiredRoles || requiredRoles.length === 0) return true;
      const allowed = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      return allowed.includes(role);
    },
    [role]
  );

  const value = {
    user,
    role,
    token,
    isLoading,
    isAuthenticated: !!token && !!user && !!role,
    isAdmin: role === 'admin',
    isStaff: role === 'staff' || role === 'admin',
    isCustomer: role === 'customer',
    hasRole,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

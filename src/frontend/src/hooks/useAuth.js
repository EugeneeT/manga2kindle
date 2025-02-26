// hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";

// Constants
const SESSION_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SESSION_BUFFER_TIME = 300000; // 5 minutes buffer for expiry check

/**
 * Authentication hook to manage user session and auth state
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  // State to track authentication status
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isInitialized: false,
    loginError: "",
    loginAttempts: 0,
  });

  /**
   * Verify if session is still valid
   * @param {string} sessionString - JSON string containing session info
   * @returns {boolean} Whether session is valid
   */
  const isSessionValid = useCallback((sessionString) => {
    try {
      const { expiry } = JSON.parse(sessionString);
      return new Date(expiry).getTime() - SESSION_BUFFER_TIME > Date.now();
    } catch (e) {
      console.error("Error parsing session:", e);
      return false;
    }
  }, []);

  /**
   * Create a new session
   * @returns {Object} Session object
   */
  const createSession = useCallback(() => {
    return {
      expiry: new Date(Date.now() + SESSION_EXPIRY_TIME).toISOString()
    };
  }, []);

  /**
   * Clear stored auth data
   */
  const clearStoredAuth = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("session");
  }, []);

  /**
   * Check authentication status from server or local storage
   * @returns {Promise<boolean>} Authentication status
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const session = localStorage.getItem("session");

      // If we have valid local auth data, use it
      if (token && session && isSessionValid(session)) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          isInitialized: true,
        }));
        return true;
      }

      // Otherwise check with the server
      const response = await fetch("/api/auth/status");
      
      if (!response.ok) {
        throw new Error("Failed to get auth status");
      }
      
      const data = await response.json();

      if (!data.isAuthenticated) {
        clearStoredAuth();
      }

      setAuthState(prev => ({
        ...prev,
        isInitialized: data.isInitialized,
        isAuthenticated: data.isAuthenticated,
      }));

      return data.isAuthenticated;
    } catch (error) {
      console.error("Failed to check auth status:", error);
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
      }));
      return false;
    }
  }, [clearStoredAuth, isSessionValid]);

  /**
   * Handle user login
   * @param {Object} credentials - User credentials
   * @returns {Promise<boolean>} Login success status
   */
  const handleLogin = useCallback(async (credentials) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error("No token received");
      }
      
      // Store auth data
      localStorage.setItem("token", data.token);
      localStorage.setItem("session", JSON.stringify(createSession()));

      // Update state
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        loginAttempts: 0,
        loginError: "",
      }));

      return true;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loginAttempts: prev.loginAttempts + 1,
        loginError: error.message || "Invalid credentials",
      }));
      return false;
    }
  }, [createSession]);

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(() => {
    clearStoredAuth();
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: false,
      loginError: "",
    }));
  }, [clearStoredAuth]);

  // Check auth status on initial load
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    authState,
    handleLogin,
    handleLogout,
    checkAuthStatus,
  };
};

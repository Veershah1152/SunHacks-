import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(resp.data);
    } catch (err) {
      console.error("Auth verify failed", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      setLoading(true);
      const resp = await axios.post(`${API_BASE_URL}/auth/login/google`, {
        token: googleToken
      });
      
      const { token: localToken, user: userData } = resp.data;
      localStorage.setItem('token', localToken);
      setToken(localToken);
      setUser(userData);
      return true;
    } catch (err) {
      console.error("Google login failed", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = async (email, password) => {
    try {
      setLoading(true);
      const resp = await axios.post(`${API_BASE_URL}/auth/login/credentials`, { email, password });
      const { token: localToken, user: userData } = resp.data;
      localStorage.setItem('token', localToken);
      setToken(localToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      console.error("Credentials login failed", err);
      return { success: false, error: err.response?.data?.detail || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const registerWithCredentials = async (name, email, password) => {
    try {
      setLoading(true);
      const resp = await axios.post(`${API_BASE_URL}/auth/register`, { name, email, password });
      return { success: true };
    } catch (err) {
      console.error("Registration failed", err);
      return { success: false, error: err.response?.data?.detail || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, loginWithCredentials, registerWithCredentials, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

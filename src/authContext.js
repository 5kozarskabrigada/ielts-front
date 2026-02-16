import React, { createContext, useContext, useState, useEffect } from "react";
import { apiLogin } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("ielts_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("ielts_token"));

  useEffect(() => {
    if (user) localStorage.setItem("ielts_user", JSON.stringify(user));
    else localStorage.removeItem("ielts_user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("ielts_token", token);
    else localStorage.removeItem("ielts_token");
  }, [token]);

  const login = async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

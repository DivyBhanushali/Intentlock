// INTENTLOCK – Enterprise Client Authentication & Tenant Context

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  org_id: string;
  org_name: string;
  plan: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, companyName: string) => Promise<string | undefined>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rehydrate token and user from localStorage
    const savedToken = localStorage.getItem("intentlock_token");
    const savedUser = localStorage.getItem("intentlock_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("intentlock_token");
        localStorage.removeItem("intentlock_user");
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Invalid email or password");
    }

    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("intentlock_token", data.access_token);
    localStorage.setItem("intentlock_user", JSON.stringify(data.user));
  }

  async function register(email: string, password: string, fullName: string, companyName: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        company_name: companyName,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }

    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("intentlock_token", data.access_token);
    localStorage.setItem("intentlock_user", JSON.stringify(data.user));
    return data.initial_api_key;
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("intentlock_token");
    localStorage.removeItem("intentlock_user");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

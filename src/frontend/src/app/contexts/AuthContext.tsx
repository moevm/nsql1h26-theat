import React, { createContext, useContext, useState, useEffect } from "react";

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, details: string) {
    super(details || `API error ${status}`);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text);
  }
  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  login: string;
  role: "user" | "manager" | "admin";
}

interface AuthContextType {
  currentUser: User | null;
  login: (login: string, password: string) => Promise<boolean>;
  register: (
    firstName: string,
    lastName: string,
    login: string,
    password: string,
  ) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUserRole: (
    userId: string,
    role: "user" | "manager" | "admin",
  ) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const saveCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("accessToken");
    }
    window.dispatchEvent(new Event("auth-changed"));
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const savedUser = localStorage.getItem("currentUser");
    if (!token || !savedUser) return;

    setCurrentUser(JSON.parse(savedUser) as User);

    apiFetch<User>("/auth/me")
      .then((user) => {
        setCurrentUser(user);
        localStorage.setItem("currentUser", JSON.stringify(user));
      })
      .catch(() => saveCurrentUser(null));
  }, []);

  const login = async (
    loginValue: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const response = await apiFetch<{ access_token: string; user: User }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ login: loginValue, password }),
        },
      );
      localStorage.setItem("accessToken", response.access_token);
      saveCurrentUser(response.user);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (): Promise<boolean> => false;

  const logout = () => saveCurrentUser(null);

  const getAllUsers = async (): Promise<User[]> =>
    apiFetch<User[]>("/admin/users");

  const updateUserRole = async (
    userId: string,
    role: "user" | "manager" | "admin",
  ): Promise<void> => {
    await apiFetch<User>(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
        isAuthenticated: currentUser !== null,
        updateUserRole,
        getAllUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

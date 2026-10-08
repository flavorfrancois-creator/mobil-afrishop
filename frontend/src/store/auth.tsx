import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { apiFetch, ApiError, setAuthToken } from "@/src/api/client";
import { AuthUser } from "@/src/api/types";
import { STORAGE_KEYS } from "@/src/config";
import { storage } from "@/src/utils/storage";

type AuthResponse = { token: string; user: AuthUser; message?: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export class CustomerOnlyError extends Error {}

function assertCustomer(user: AuthUser) {
  if (user.role !== "CLIENT") {
    throw new CustomerOnlyError("customerOnly");
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const savedToken = await storage.secureGet<string>(STORAGE_KEYS.token, "");
      const savedUser = await storage.getItem<AuthUser | null>(STORAGE_KEYS.user, null);
      if (savedToken) {
        setAuthToken(savedToken);
        setToken(savedToken);
        setUser(savedUser);
      }
      setReady(true);
    })();
  }, []);

  const persist = useCallback(async (res: AuthResponse) => {
    assertCustomer(res.user);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    await storage.secureSet(STORAGE_KEYS.token, res.token);
    await storage.setItem(STORAGE_KEYS.user, res.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<AuthResponse>("/mobile/auth/login", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password },
      });
      await persist(res);
    },
    [persist],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      const res = await apiFetch<AuthResponse>("/mobile/auth/register", {
        method: "POST",
        body: { name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone?.trim() || "" },
      });
      await persist(res);
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await storage.secureRemove(STORAGE_KEYS.token);
    await storage.removeItem(STORAGE_KEYS.user);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, signIn, signUp, signOut }),
    [user, token, ready, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };

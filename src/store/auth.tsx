import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";

import { apiFetch, ApiError, setAuthToken } from "@/src/api/client";
import { AuthUser } from "@/src/api/types";
import { STORAGE_KEYS } from "@/src/config";
import { useI18n } from "@/src/i18n";
import { Lang, translations } from "@/src/i18n/translations";
import { storage } from "@/src/utils/storage";

type AuthResponse = { token: string; user: AuthUser; message?: string };

export type TwoFactorChallenge = {
  require_2fa: true;
  challenge_id: string;
  channel?: string;
  dev_code?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  biometricEnabled: boolean;
  signIn: (email: string, password: string) => Promise<TwoFactorChallenge | null>;
  verifyTwoFactor: (challengeId: string, code: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone?: string, country?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  replaceToken: (token: string) => Promise<void>;
  saveLanguage: (lang: Lang) => Promise<void>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  loginWithBiometrics: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export class CustomerOnlyError extends Error {}
export class BiometricUnavailableError extends Error {}

function assertCustomer(user: AuthUser) {
  if (user.role !== "CLIENT") {
    throw new CustomerOnlyError("customerOnly");
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLang, t } = useI18n();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const applyUser = useCallback(
    async (next: AuthUser) => {
      setUser(next);
      await storage.setItem(STORAGE_KEYS.user, next as any);
      const l = next.language as Lang | undefined;
      if (l && translations[l]) setLang(l);
    },
    [setLang],
  );

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setBiometricEnabled(false);
    await storage.secureRemove(STORAGE_KEYS.token);
    await storage.secureRemove(STORAGE_KEYS.biometric);
    await storage.removeItem(STORAGE_KEYS.user);
  }, []);

  useEffect(() => {
    (async () => {
      const savedToken = await storage.secureGet<string>(STORAGE_KEYS.token, "");
      const bio = (await storage.secureGet<string>(STORAGE_KEYS.biometric, "")) === "true";
      setBiometricEnabled(bio && !!savedToken);
      // With biometrics enabled, the session is only unlocked after a successful scan.
      if (savedToken && !bio) {
        const savedUser = await storage.getItem<any>(STORAGE_KEYS.user, null);
        setAuthToken(savedToken);
        setToken(savedToken);
        setUser(savedUser);
        apiFetch<{ user: AuthUser }>("/mobile/auth/me")
          .then((d) => d.user && applyUser(d.user))
          .catch((e) => {
            if (e instanceof ApiError && (e.status === 401 || e.status === 403)) clearSession();
          });
      }
      setReady(true);
    })();
  }, [applyUser, clearSession]);

  const persist = useCallback(
    async (res: AuthResponse) => {
      assertCustomer(res.user);
      setAuthToken(res.token);
      setToken(res.token);
      await storage.secureSet(STORAGE_KEYS.token, res.token);
      await applyUser(res.user);
    },
    [applyUser],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<AuthResponse | TwoFactorChallenge>("/mobile/auth/login", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password },
      });
      if ((res as TwoFactorChallenge).require_2fa) return res as TwoFactorChallenge;
      await persist(res as AuthResponse);
      return null;
    },
    [persist],
  );

  const verifyTwoFactor = useCallback(
    async (challengeId: string, code: string) => {
      const res = await apiFetch<AuthResponse>("/auth/2fa/verify", {
        method: "POST",
        body: { challenge_id: challengeId, code: code.trim() },
      });
      await persist(res);
    },
    [persist],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string, phone?: string, country?: string) => {
      const res = await apiFetch<AuthResponse>("/mobile/auth/register", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone?.trim() || "",
          country: country?.trim() || "",
          role: "CLIENT",
        },
      });
      await persist(res);
    },
    [persist],
  );

  const forgotPassword = useCallback(async (email: string) => {
    await apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email: email.trim().toLowerCase() },
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (token) await apiFetch("/mobile/auth/logout", { method: "POST" });
    } catch {
      // Logging out locally must always succeed.
    }
    await clearSession();
  }, [token, clearSession]);

  const refreshUser = useCallback(async () => {
    const d = await apiFetch<{ user: AuthUser }>("/mobile/auth/me");
    if (d.user) await applyUser(d.user);
  }, [applyUser]);

  const replaceToken = useCallback(async (next: string) => {
    setAuthToken(next);
    setToken(next);
    await storage.secureSet(STORAGE_KEYS.token, next);
  }, []);

  const saveLanguage = useCallback(
    async (lang: Lang) => {
      setLang(lang);
      if (!token) return;
      const d = await apiFetch<{ language: string }>("/auth/language", {
        method: "PUT",
        body: { language: lang },
      });
      setUser((u) => (u ? { ...u, language: d.language ?? lang } : u));
    },
    [setLang, token],
  );

  const enableBiometrics = useCallback(async () => {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    if (!hardware || !enrolled) throw new BiometricUnavailableError("biometricUnavailable");
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t("biometricEnablePrompt"),
      disableDeviceFallback: true,
    });
    if (!result.success) return false;
    await storage.secureSet(STORAGE_KEYS.biometric, "true");
    setBiometricEnabled(true);
    return true;
  }, [t]);

  const disableBiometrics = useCallback(async () => {
    await storage.secureRemove(STORAGE_KEYS.biometric);
    setBiometricEnabled(false);
  }, []);

  const loginWithBiometrics = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t("biometricPrompt"),
      disableDeviceFallback: true,
    });
    if (!result.success) return false;
    const saved = await storage.secureGet<string>(STORAGE_KEYS.token, "");
    if (!saved) throw new ApiError("noSession", 401);
    setAuthToken(saved);
    try {
      const d = await apiFetch<{ user: AuthUser }>("/mobile/auth/me");
      assertCustomer(d.user);
      setToken(saved);
      await applyUser(d.user);
      return true;
    } catch (e) {
      setAuthToken(null);
      throw e;
    }
  }, [applyUser, t]);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      biometricEnabled,
      signIn,
      verifyTwoFactor,
      signUp,
      forgotPassword,
      signOut,
      refreshUser,
      replaceToken,
      saveLanguage,
      enableBiometrics,
      disableBiometrics,
      loginWithBiometrics,
    }),
    [
      user,
      token,
      ready,
      biometricEnabled,
      signIn,
      verifyTwoFactor,
      signUp,
      forgotPassword,
      signOut,
      refreshUser,
      replaceToken,
      saveLanguage,
      enableBiometrics,
      disableBiometrics,
      loginWithBiometrics,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };

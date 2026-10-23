import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { apiFetch, productPrice } from "./api";

const TOKEN_KEY = "afrimarket_customer_token";
const BIOMETRIC_KEY = "afrimarket_biometric_login";
const CART_KEY = "afrimarket_customer_cart";
const FAVORITES_KEY = "afrimarket_customer_favorites";
const Context = createContext(null);

async function readStorageJson(key, fallback) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState("");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const saveCart = useCallback(async (next) => {
    setCartItems(next);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
  }, []);

  const saveFavorites = useCallback(async (next) => {
    setFavorites(next);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }, []);

  const setSession = useCallback(async (nextToken, nextUser) => {
    await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    setToken(nextToken);
    if (nextUser) setUser(nextUser);
  }, []);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const [savedToken, enabled, cart, favoriteItems] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(BIOMETRIC_KEY),
          readStorageJson(CART_KEY, []),
          readStorageJson(FAVORITES_KEY, []),
        ]);
        if (!active) return;
        setCartItems(Array.isArray(cart) ? cart : []);
        setFavorites(Array.isArray(favoriteItems) ? favoriteItems : []);
        setBiometricEnabled(enabled === "true");
        if (savedToken && enabled !== "true") {
          const data = await apiFetch("/auth/me", {}, savedToken, true);
          if (!active) return;
          if (data.user?.role !== "CLIENT") {
            throw new Error("Cette application est réservée aux comptes clients.");
          }
          setToken(savedToken);
          setUser(data.user);
        }
      } catch (error) {
        if (active) {
          if (error.status === 401 || error.status === 403) {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          }
          setBootstrapError(error.message || "Impossible de restaurer votre session.");
        }
      } finally {
        if (active) setReady(true);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await apiFetch(
      "/auth/login",
      { method: "POST", body: credentials },
      null,
      true
    );
    if (data.require_2fa) return data;
    if (data.user?.role !== "CLIENT") {
      throw new Error("Connectez-vous avec un compte client AfriMarket.");
    }
    await setSession(data.token, data.user);
    return data;
  }, [setSession]);

  const verifyTwoFactor = useCallback(async (challengeId, code) => {
    const data = await apiFetch("/auth/2fa/verify", {
      method: "POST",
      body: { challenge_id: challengeId, code },
    });
    if (data.user?.role !== "CLIENT") {
      throw new Error("Connectez-vous avec un compte client AfriMarket.");
    }
    await setSession(data.token, data.user);
    return data;
  }, [setSession]);

  const register = useCallback(async (details) => {
    const data = await apiFetch(
      "/auth/register",
      { method: "POST", body: { ...details, role: "CLIENT" } },
      null,
      true
    );
    await setSession(data.token, data.user);
    return data;
  }, [setSession]);

  const logout = useCallback(async () => {
    try {
      if (token) await apiFetch("/auth/logout", { method: "POST" }, token, true);
    } finally {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(BIOMETRIC_KEY),
      ]);
      setToken(null);
      setUser(null);
      setBiometricEnabled(false);
    }
  }, [token]);

  const refreshUser = useCallback(async (activeToken = token) => {
    if (!activeToken) return null;
    const data = await apiFetch("/auth/me", {}, activeToken, true);
    setUser(data.user);
    return data.user;
  }, [token]);

  const requestMain = useCallback(
    (path, options) => apiFetch(path, options, token),
    [token]
  );
  const requestMobile = useCallback(
    (path, options) => apiFetch(path, options, token, true),
    [token]
  );

  const addToCart = useCallback(async (product, quantity = 1, variant = null) => {
    const qty = Math.max(1, Number.parseInt(quantity, 10) || 1);
    const key = variant ? `${product.id}:${variant.id}` : String(product.id);
    const line = {
      key,
      product_id: product.id,
      variant_id: variant?.id || null,
      variant_label: variant?.label || "",
      name: product.name,
      image: variant?.image || product.image || "",
      price: productPrice(product, variant),
      currency: product.currency || user?.currency || "",
      shop_id: product.shop_id,
      shop_name: product.shop_name || "",
      qty,
    };
    const current = [...cartItems];
    const index = current.findIndex((item) => item.key === key);
    if (index >= 0) current[index] = { ...current[index], qty: current[index].qty + qty };
    else current.push(line);
    await saveCart(current);
  }, [cartItems, saveCart, user?.currency]);

  const updateCartQty = useCallback(async (key, qty) => {
    const count = Number.parseInt(qty, 10);
    const next = count <= 0
      ? cartItems.filter((item) => item.key !== key)
      : cartItems.map((item) => item.key === key ? { ...item, qty: count } : item);
    await saveCart(next);
  }, [cartItems, saveCart]);

  const clearCart = useCallback(() => saveCart([]), [saveCart]);

  const toggleFavorite = useCallback(async (product) => {
    const exists = favorites.some((item) => item.id === product.id);
    const next = exists
      ? favorites.filter((item) => item.id !== product.id)
      : [{
          id: product.id,
          name: product.name,
          image: product.image || "",
          currency: product.currency || "",
          shop_name: product.shop_name || "",
          display_price: product.display_price,
          promo_price: product.promo_price,
          is_promo: product.is_promo,
        }, ...favorites];
    await saveFavorites(next);
  }, [favorites, saveFavorites]);

  const setLanguage = useCallback(async (language) => {
    const data = await requestMain("/auth/language", {
      method: "PUT",
      body: { language },
    });
    setUser((current) => current ? { ...current, language: data.language } : current);
    return data.language;
  }, [requestMain]);

  const enableBiometrics = useCallback(async () => {
    const [hardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    if (
      !hardware ||
      !enrolled ||
      !types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
    ) {
      throw new Error("Aucune empreinte digitale n’est configurée sur cet appareil.");
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirmez votre empreinte pour activer la connexion",
      cancelLabel: "Annuler",
      disableDeviceFallback: true,
    });
    if (!result.success) return false;
    await SecureStore.setItemAsync(BIOMETRIC_KEY, "true");
    setBiometricEnabled(true);
    return true;
  }, []);

  const disableBiometrics = useCallback(async () => {
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    setBiometricEnabled(false);
  }, []);

  const loginWithBiometrics = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Connectez-vous à AfriMarket",
      cancelLabel: "Annuler",
      disableDeviceFallback: true,
    });
    if (!result.success) return false;
    const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!savedToken) throw new Error("Session absente. Connectez-vous avec votre e-mail.");
    const data = await apiFetch("/auth/me", {}, savedToken, true);
    if (data.user?.role !== "CLIENT") {
      throw new Error("Cette application est réservée aux comptes clients.");
    }
    setToken(savedToken);
    setUser(data.user);
    return true;
  }, []);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [cartItems]
  );
  const value = {
    ready,
    bootstrapError,
    token,
    user,
    isAuthenticated: !!token && !!user,
    biometricEnabled,
    cartItems,
    cartCount,
    favorites,
    login,
    verifyTwoFactor,
    register,
    logout,
    refreshUser,
    setSession,
    requestMain,
    requestMobile,
    addToCart,
    updateCartQty,
    clearCart,
    toggleFavorite,
    setLanguage,
    enableBiometrics,
    disableBiometrics,
    loginWithBiometrics,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error("useApp must be used inside AppProvider.");
  return context;
}

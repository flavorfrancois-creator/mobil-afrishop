import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { apiFetch, productPrice } from "../lib/api";

const TOKEN_KEY = "afrishop_mobile_token";
const BIOMETRIC_KEY = "afrishop_mobile_biometric";
const CART_KEY = "afrishop_mobile_cart";
const FAVORITES_KEY = "afrishop_mobile_favorites";

const AppContext = createContext(null);

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function favoriteSnapshot(product) {
  return {
    id: product.id,
    name: product.name,
    image: product.image || "",
    currency: product.currency || "",
    shop_id: product.shop_id,
    shop_name: product.shop_name || "",
    display_price: Number(product.display_price ?? product.promo_price ?? 0),
    promo_price:
      product.promo_price !== undefined ? Number(product.promo_price) : null,
    is_promo: !!product.is_promo,
  };
}

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState("");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const isAuthenticated = !!token && !!user;

  const persistCart = useCallback(async (nextCart) => {
    setCartItems(nextCart);
    await writeJson(CART_KEY, nextCart);
  }, []);

  const persistFavorites = useCallback(async (nextFavorites) => {
    setFavorites(nextFavorites);
    await writeJson(FAVORITES_KEY, nextFavorites);
  }, []);

  const refreshUser = useCallback(async (activeToken = token) => {
    if (!activeToken) return null;
    const data = await apiFetch("/auth/me", {}, activeToken, "mobile");
    setUser(data.user);
    return data.user;
  }, [token]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const [secureToken, legacyToken, biometricPreference, savedCart, savedFavorites] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          AsyncStorage.getItem(TOKEN_KEY),
          SecureStore.getItemAsync(BIOMETRIC_KEY),
          readJson(CART_KEY, []),
          readJson(FAVORITES_KEY, []),
        ]);
        if (!mounted) return;
        setCartItems(savedCart);
        setFavorites(savedFavorites);
        setBiometricEnabled(biometricPreference === "true");

        const savedToken = secureToken || legacyToken;
        if (savedToken) {
          if (!secureToken) {
            await SecureStore.setItemAsync(TOKEN_KEY, savedToken);
            await AsyncStorage.removeItem(TOKEN_KEY);
          }
          if (biometricPreference === "true") return;
          try {
            const data = await apiFetch("/auth/me", {}, savedToken, "mobile");
            if (!mounted) return;
            setToken(savedToken);
            setUser(data.user);
          } catch {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await AsyncStorage.removeItem(TOKEN_KEY);
          }
        }
      } catch (error) {
        if (mounted) {
          setBootstrapError(error.message || "Unable to load mobile app.");
        }
      } finally {
        if (mounted) setReady(true);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (payload) => {
    const data = await apiFetch(
      "/auth/login",
      { method: "POST", body: payload },
      null,
      "mobile"
    );
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await apiFetch(
      "/auth/register",
      { method: "POST", body: payload },
      null,
      "mobile"
    );
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiFetch("/auth/logout", { method: "POST" }, token, "mobile");
      }
    } catch {
      // ignore remote logout failures
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
      await AsyncStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setBiometricEnabled(false);
    }
  }, [token]);

  const updateSession = useCallback(async (nextToken, nextUser) => {
    await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(nextToken);
    if (nextUser) setUser(nextUser);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const enableBiometricLogin = useCallback(async () => {
    const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    if (
      !hasHardware ||
      !isEnrolled ||
      !supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
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

  const disableBiometricLogin = useCallback(async () => {
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    setBiometricEnabled(false);
  }, []);

  const loginWithBiometrics = useCallback(async () => {
    if (!biometricEnabled) throw new Error("La connexion par empreinte n’est pas activée.");
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Connectez-vous avec votre empreinte digitale",
      cancelLabel: "Annuler",
      disableDeviceFallback: true,
    });
    if (!result.success) return false;
    const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!savedToken) throw new Error("Aucune session enregistrée. Connectez-vous avec votre e-mail.");
    const data = await apiFetch("/auth/me", {}, savedToken, "mobile");
    if (data.user?.role !== "CLIENT") {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
      setBiometricEnabled(false);
      throw new Error("Cette application est réservée aux comptes clients.");
    }
    setToken(savedToken);
    setUser(data.user);
    return true;
  }, [biometricEnabled]);

  const setLanguage = useCallback(async (language) => {
    const result = await apiFetch(
      "/auth/language",
      {
        method: "PUT",
        body: { language },
      },
      token,
      "main"
    );
    setUser((current) => current ? { ...current, language: result.language } : current);
    return result.language;
  }, [token]);

  const requestPasswordReset = useCallback(async (email) => {
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
    } catch {
      // always return generic success message
    }
  }, []);

  const addToCart = useCallback(async (product, qty = 1, variant = null) => {
    const safeQty = Math.max(1, Number(qty || 1));
    const key = variant ? `${product.id}::${variant.id}` : product.id;
    const next = [...cartItems];
    const index = next.findIndex((item) => item.key === key);
    const line = {
      key,
      product_id: product.id,
      variant_id: variant ? variant.id : null,
      variant_label: variant ? variant.label : "",
      name: product.name,
      image: (variant && variant.image) || product.image || "",
      price: productPrice(product, variant),
      currency: product.currency || user?.currency || "",
      shop_id: product.shop_id,
      shop_name: product.shop_name || "",
      qty: safeQty,
    };

    if (index >= 0) {
      next[index] = { ...next[index], qty: next[index].qty + safeQty };
    } else {
      next.push(line);
    }
    await persistCart(next);
  }, [cartItems, persistCart, user?.currency]);

  const updateCartQty = useCallback(async (key, qty) => {
    const next = cartItems.map((item) =>
      item.key === key ? { ...item, qty: Math.max(1, Number(qty || 1)) } : item
    );
    await persistCart(next);
  }, [cartItems, persistCart]);

  const removeFromCart = useCallback(async (key) => {
    await persistCart(cartItems.filter((item) => item.key !== key));
  }, [cartItems, persistCart]);

  const clearCart = useCallback(async () => {
    await persistCart([]);
  }, [persistCart]);

  const toggleFavorite = useCallback(async (product) => {
    const exists = favorites.some((item) => item.id === product.id);
    const next = exists
      ? favorites.filter((item) => item.id !== product.id)
      : [favoriteSnapshot(product), ...favorites];
    await persistFavorites(next);
  }, [favorites, persistFavorites]);

  const removeFavorite = useCallback(async (productId) => {
    await persistFavorites(favorites.filter((item) => item.id !== productId));
  }, [favorites, persistFavorites]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
        0
      ),
    [cartItems]
  );

  const requestMainApi = useCallback(
    (path, options = {}) => apiFetch(path, options, token, "main"),
    [token]
  );

  const requestMobileApi = useCallback(
    (path, options = {}) => apiFetch(path, options, token, "mobile"),
    [token]
  );

  const value = {
    ready,
    bootstrapError,
    token,
    user,
    isAuthenticated,
    biometricEnabled,
    cartItems,
    cartCount,
    cartTotal,
    favorites,
    login,
    register,
    logout,
    refreshUser,
    updateSession,
    updateUser,
    enableBiometricLogin,
    disableBiometricLogin,
    loginWithBiometrics,
    setLanguage,
    requestPasswordReset,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    toggleFavorite,
    removeFavorite,
    requestMainApi,
    requestMobileApi,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

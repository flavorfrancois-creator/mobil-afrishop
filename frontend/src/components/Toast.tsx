import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle, Info, WarningCircle } from "phosphor-react-native";

import { fonts, fontSizes, radius, spacing, useTheme } from "@/src/theme";

type Variant = "success" | "error" | "info";
type ToastState = { message: string; variant: Variant } | null;

type ToastContextValue = { show: (message: string, variant?: Variant) => void };

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, variant: Variant = "info") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, variant });
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
        ]).start(() => setToast(null));
      }, 2600);
    },
    [opacity, translateY],
  );

  const bg =
    toast?.variant === "success"
      ? colors.success
      : toast?.variant === "error"
        ? colors.error
        : colors.surfaceInverse;
  const fg =
    toast?.variant === "success"
      ? colors.onSuccess
      : toast?.variant === "error"
        ? colors.onError
        : colors.onSurfaceInverse;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          testID="app-toast"
          style={[
            styles.wrap,
            { top: insets.top + spacing.sm, opacity, transform: [{ translateY }] },
          ]}
        >
          <View style={[styles.toast, { backgroundColor: bg }]}>
            {toast.variant === "success" ? (
              <CheckCircle size={20} color={fg} weight="fill" />
            ) : toast.variant === "error" ? (
              <WarningCircle size={20} color={fg} weight="fill" />
            ) : (
              <Info size={20} color={fg} weight="fill" />
            )}
            <Animated.Text style={[styles.text, { color: fg }]} numberOfLines={2}>
              {toast.message}
            </Animated.Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    maxWidth: 480,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: fontSizes.base },
});

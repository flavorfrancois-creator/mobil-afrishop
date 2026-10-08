// Design tokens for Afrishop — warm African-inspired, iOS-Native Clean.
// Keys match the "color" block of /app/design_guidelines.json (light + dark).

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FDFBF7",
  onSurface: "#1F1C18",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#1F1C18",
  surfaceTertiary: "#F2EFEB",
  onSurfaceTertiary: "#423B33",
  surfaceInverse: "#26231D",
  onSurfaceInverse: "#FDFBF7",
  brand: "#D45D3C",
  onBrand: "#FFFFFF",
  brandPrimary: "#C24929",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#D98F39",
  onBrandSecondary: "#26231D",
  brandTertiary: "#FCEBE5",
  onBrandTertiary: "#8F381F",
  success: "#4A6B53",
  onSuccess: "#FFFFFF",
  warning: "#D98F39",
  onWarning: "#26231D",
  error: "#B03B3B",
  onError: "#FFFFFF",
  info: "#6E695D",
  onInfo: "#FFFFFF",
  border: "#E8E2D9",
  borderStrong: "#C2B5A3",
  divider: "#E8E2D9",
  muted: "#7A7369",
};

const dark: typeof light = {
  surface: "#12100E",
  onSurface: "#EBE7E0",
  surfaceSecondary: "#1C1916",
  onSurfaceSecondary: "#EBE7E0",
  surfaceTertiary: "#292521",
  onSurfaceTertiary: "#D6CFC4",
  surfaceInverse: "#EBE7E0",
  onSurfaceInverse: "#12100E",
  brand: "#D45D3C",
  onBrand: "#260F07",
  brandPrimary: "#E3775A",
  onBrandPrimary: "#260F07",
  brandSecondary: "#EAB069",
  onBrandSecondary: "#2E1C07",
  brandTertiary: "#452419",
  onBrandTertiary: "#F2B8A7",
  success: "#6EA17D",
  onSuccess: "#0B2614",
  warning: "#EAB069",
  onWarning: "#2E1C07",
  error: "#E36D6D",
  onError: "#330808",
  border: "#36312B",
  borderStrong: "#5C544B",
  divider: "#36312B",
  muted: "#8C8477",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light, dark };

export const fonts = {
  regular: "PlusJakartaSans-Regular",
  medium: "PlusJakartaSans-Medium",
  semibold: "PlusJakartaSans-SemiBold",
  bold: "PlusJakartaSans-Bold",
} as const;

export const fontSizes = {
  xs: 11,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

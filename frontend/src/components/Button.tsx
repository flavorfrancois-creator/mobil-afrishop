import React from "react";
import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

import { fonts, fontSizes, radius, spacing, useTheme } from "@/src/theme";
import { Txt } from "./Txt";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  haptic?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
  testID,
  haptic = true,
}: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? colors.brandPrimary
      : variant === "secondary"
        ? colors.surfaceTertiary
        : "transparent";
  const fg =
    variant === "primary"
      ? colors.onBrandPrimary
      : variant === "secondary"
        ? colors.onSurfaceTertiary
        : colors.brandPrimary;

  return (
    <Pressable
      testID={testID}
      disabled={isDisabled}
      onPress={() => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.md,
          paddingVertical: spacing.md + 2,
          paddingHorizontal: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor: colors.brandPrimary,
          opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Txt weight="semibold" style={{ color: fg, fontSize: fontSizes.lg, fontFamily: fonts.semibold }}>
            {label}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CaretLeft } from "phosphor-react-native";

import { makeStyles, spacing, useTheme } from "@/src/theme";
import { Txt } from "./Txt";

export function ScreenHeader({
  title,
  right,
  onBack,
}: {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        testID="header-back-button"
        hitSlop={12}
        onPress={() => (onBack ? onBack() : router.back())}
        style={styles.back}
      >
        <CaretLeft size={22} color={colors.onSurface} weight="bold" />
      </Pressable>
      <Txt weight="bold" size="lg" numberOfLines={1} style={styles.title}>
        {title}
      </Txt>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { flex: 1 },
  right: { minWidth: 36, alignItems: "flex-end" },
}));

import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Basket, WifiSlash } from "phosphor-react-native";

import { useI18n } from "@/src/i18n";
import { spacing, useTheme } from "@/src/theme";
import { Button } from "./Button";
import { Txt } from "./Txt";

export function LoadingView({ testID }: { testID?: string }) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID ?? "loading-view"}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}
    >
      <ActivityIndicator size="large" color={colors.brandPrimary} />
    </View>
  );
}

export function ErrorView({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View
      testID="error-view"
      style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md }}
    >
      <WifiSlash size={48} color={colors.muted} weight="duotone" />
      <Txt color="muted" size="base" style={{ textAlign: "center" }}>
        {t("errorGeneric")}
      </Txt>
      {onRetry && <Button label={t("retry")} onPress={onRetry} variant="secondary" testID="retry-button" />}
    </View>
  );
}

export function EmptyView({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      testID="empty-view"
      style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm }}
    >
      {icon ?? <Basket size={56} color={colors.muted} weight="duotone" />}
      <Txt weight="semibold" size="lg" style={{ textAlign: "center", marginTop: spacing.sm }}>
        {title}
      </Txt>
      {subtitle && (
        <Txt color="muted" size="base" style={{ textAlign: "center" }}>
          {subtitle}
        </Txt>
      )}
    </View>
  );
}

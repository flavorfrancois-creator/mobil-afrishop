import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useWallet } from "@/src/api/hooks";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { ErrorView, LoadingView } from "@/src/components/StateViews";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { useAuth } from "@/src/store/auth";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { formatAmount } from "@/src/utils/format";

const WALLET_LABELS: Record<string, string> = {
  general: "walletGeneral",
  bonus_promo: "walletBonusPromo",
  earning_partner: "walletEarningPartner",
};

export default function WalletScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const cur = user?.currency ?? "";

  const walletQ = useWallet(!!user);
  const wallet = walletQ.data;

  const buckets = wallet
    ? Object.entries(wallet.wallets).filter(([, v]) => v.available !== 0 || v.pending !== 0)
    : [];
  const shownBuckets = buckets.length > 0 ? buckets : Object.entries(wallet?.wallets ?? {}).slice(0, 3);

  return (
    <View style={styles.root}>
      <ScreenHeader title={t("walletTitle")} />
      {walletQ.isLoading ? (
        <LoadingView />
      ) : walletQ.isError ? (
        <ErrorView onRetry={() => walletQ.refetch()} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}
        >
          <View style={styles.balanceCard}>
            <Txt size="sm" style={{ color: colors.onBrandPrimary, opacity: 0.9 }}>
              {t("totalAvailable")}
            </Txt>
            <Txt weight="bold" size="xxxl" style={{ color: colors.onBrandPrimary }}>
              {formatAmount(wallet?.total_available ?? 0)} {cur}
            </Txt>
            <View style={styles.pendingRow}>
              <Txt size="sm" style={{ color: colors.onBrandPrimary, opacity: 0.85 }}>
                {t("totalPending")}
              </Txt>
              <Txt weight="semibold" size="base" style={{ color: colors.onBrandPrimary }}>
                {formatAmount(wallet?.total_pending ?? 0)} {cur}
              </Txt>
            </View>
          </View>

          <View>
            <Txt weight="bold" size="lg" style={{ marginBottom: spacing.md }}>
              {t("walletsBreakdown")}
            </Txt>
            <View style={styles.group}>
              {shownBuckets.map(([key, v], i) => (
                <View key={key}>
                  {i > 0 && <View style={styles.sep} />}
                  <View style={styles.bucketRow}>
                    <Txt weight="medium" size="base" style={{ flex: 1 }}>
                      {WALLET_LABELS[key] ? t(WALLET_LABELS[key] as any) : key.replace(/_/g, " ")}
                    </Txt>
                    <View style={{ alignItems: "flex-end" }}>
                      <Txt weight="semibold" size="base">
                        {formatAmount(v.available)} {cur}
                      </Txt>
                      {v.pending > 0 && (
                        <Txt size="xs" color="muted">
                          {t("pending")}: {formatAmount(v.pending)} {cur}
                        </Txt>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View>
            <Txt weight="bold" size="lg" style={{ marginBottom: spacing.md }}>
              {t("transactions")}
            </Txt>
            {(wallet?.transactions?.length ?? 0) === 0 ? (
              <Txt color="muted" size="base">
                {t("noTransactions")}
              </Txt>
            ) : (
              <View style={styles.group}>
                {(wallet?.transactions ?? []).slice(0, 20).map((tx: any, i: number) => (
                  <View key={i}>
                    {i > 0 && <View style={styles.sep} />}
                    <View style={styles.bucketRow}>
                      <Txt size="sm" style={{ flex: 1 }} numberOfLines={1}>
                        {tx.label ?? tx.type ?? tx.reason ?? "—"}
                      </Txt>
                      <Txt weight="semibold" size="base">
                        {formatAmount(tx.amount ?? 0)} {cur}
                      </Txt>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  balanceCard: { backgroundColor: colors.brandPrimary, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.xs },
  pendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  group: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  bucketRow: { flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.md },
  sep: { height: 1, backgroundColor: colors.divider },
}));

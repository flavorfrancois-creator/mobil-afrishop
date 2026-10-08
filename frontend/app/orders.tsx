import React from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Receipt } from "phosphor-react-native";

import { useOrders } from "@/src/api/hooks";
import { Order } from "@/src/api/types";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { EmptyView, ErrorView, LoadingView } from "@/src/components/StateViews";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { useAuth } from "@/src/store/auth";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { formatPrice } from "@/src/utils/format";

export default function OrdersScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const ordersQ = useOrders(!!user);

  return (
    <View style={styles.root}>
      <ScreenHeader title={t("ordersTitle")} />
      {ordersQ.isLoading ? (
        <LoadingView />
      ) : ordersQ.isError ? (
        <ErrorView onRetry={() => ordersQ.refetch()} />
      ) : (ordersQ.data?.length ?? 0) === 0 ? (
        <EmptyView
          title={t("emptyOrders")}
          subtitle={t("emptyOrdersSub")}
          icon={<Receipt size={56} color={colors.muted} weight="duotone" />}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}
        >
          {(ordersQ.data ?? []).map((o: Order) => (
            <View key={o.id} style={styles.card} testID={`order-card-${o.ref}`}>
              <View style={styles.cardHead}>
                <View>
                  <Txt size="xs" color="muted">
                    {t("orderRef")}
                  </Txt>
                  <Txt weight="bold" size="base">
                    {o.ref}
                  </Txt>
                </View>
                <View style={styles.statusPill}>
                  <Txt size="xs" weight="semibold" color="onBrandTertiary">
                    {o.status}
                  </Txt>
                </View>
              </View>

              <View style={styles.thumbRow}>
                {o.items.slice(0, 4).map((it, i) => (
                  <Image key={i} source={{ uri: it.image }} style={styles.thumb} contentFit="cover" />
                ))}
                {o.items.length > 4 && (
                  <View style={[styles.thumb, styles.more]}>
                    <Txt size="sm" weight="semibold" color="muted">
                      +{o.items.length - 4}
                    </Txt>
                  </View>
                )}
              </View>

              {!!o.shop_name && (
                <Txt size="sm" color="muted" numberOfLines={1}>
                  {o.shop_name}
                </Txt>
              )}
              {!!o.tracking_number && (
                <Txt size="xs" color="muted">
                  {t("tracking")}: {o.tracking_number}
                </Txt>
              )}

              <View style={styles.totalRow}>
                <Txt weight="medium" size="sm" color="muted">
                  {t("total")}
                </Txt>
                <Txt weight="bold" size="lg" color="brandPrimary">
                  {formatPrice(o.total, o.currency_symbol)}
                </Txt>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  statusPill: {
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  thumbRow: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.xs },
  thumb: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  more: { alignItems: "center", justifyContent: "center" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
}));

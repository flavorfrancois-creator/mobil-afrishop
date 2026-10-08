import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { CheckCircle, ShieldCheck } from "phosphor-react-native";

import { apiFetch } from "@/src/api/client";
import { Button } from "@/src/components/Button";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { useToast } from "@/src/components/Toast";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { useCart } from "@/src/store/cart";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { formatPrice } from "@/src/utils/format";

type OrderResult = { message: string; orders: string[] };

export default function CheckoutScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { lines, groups, clear } = useCart();

  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiFetch<OrderResult>("/orders", {
        method: "POST",
        body: { items: lines.map((l) => ({ product_id: l.id, qty: l.qty })) },
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      clear();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      setSuccess(true);
    },
    onError: () => {
      toast.show(t("errorGeneric"), "error");
    },
  });

  if (success) {
    return (
      <View style={styles.root}>
        <ScreenHeader title={t("checkoutTitle")} onBack={() => router.replace("/(tabs)")} />
        <View style={styles.successWrap}>
          <CheckCircle size={88} color={colors.success} weight="fill" />
          <Txt weight="bold" size="xxl" style={{ textAlign: "center" }}>
            {t("orderSuccess")}
          </Txt>
          <Txt color="muted" size="base" style={{ textAlign: "center" }}>
            {t("orderSuccessSub")}
          </Txt>
          <View style={{ width: "100%", gap: spacing.md, marginTop: spacing.lg }}>
            <Button
              label={t("viewOrders")}
              onPress={() => router.replace("/orders")}
              testID="view-orders-button"
            />
            <Button
              label={t("continueShopping")}
              onPress={() => router.replace("/(tabs)")}
              variant="secondary"
              testID="success-continue-button"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title={t("checkoutTitle")} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
      >
        <Txt weight="bold" size="lg">
          {t("orderSummary")}
        </Txt>

        {lines.map((l) => (
          <View key={l.id} style={styles.row}>
            <Image source={{ uri: l.image }} style={styles.img} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Txt weight="semibold" size="base" numberOfLines={2}>
                {l.name}
              </Txt>
              <Txt size="xs" color="muted">
                {l.shop_name} · x{l.qty}
              </Txt>
            </View>
            <Txt weight="semibold" size="base">
              {formatPrice(l.unit_price * l.qty, l.currency_symbol)}
            </Txt>
          </View>
        ))}

        <View style={styles.totals}>
          {groups.map((g) => (
            <View key={g.symbol} style={styles.totalLine}>
              <Txt size="base" color="muted">
                {t("subtotal")} ({g.symbol})
              </Txt>
              <Txt weight="bold" size="base">
                {formatPrice(g.subtotal, g.symbol)}
              </Txt>
            </View>
          ))}
          <View style={styles.paymentNote}>
            <ShieldCheck size={16} color={colors.success} weight="fill" />
            <Txt size="xs" color="muted" style={{ flex: 1 }}>
              {t("paymentNote")}
            </Txt>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          label={mutation.isPending ? t("placingOrder") : t("placeOrder")}
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          testID="place-order-button"
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  img: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  totals: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));

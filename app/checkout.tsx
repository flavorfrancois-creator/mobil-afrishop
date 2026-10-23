import React, { useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { CheckCircle, CheckSquare, ShieldCheck, Square } from "phosphor-react-native";

import { ApiError, apiFetch } from "@/src/api/client";
import { useOrders, useQuote, useWallet } from "@/src/api/hooks";
import { Button } from "@/src/components/Button";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { useToast } from "@/src/components/Toast";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { useAuth } from "@/src/store/auth";
import { useCart } from "@/src/store/cart";
import { useSavedAddress } from "@/src/store/address";
import { fonts, fontSizes, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { formatPrice } from "@/src/utils/format";

type OrderResult = { message?: string; orders: string[] };
type CustomsMode = "NOW" | "LATER";

export default function CheckoutScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { lines, payload, clear } = useCart();

  const quoteQ = useQuote(payload);
  const walletQ = useWallet(!!user);
  const ordersQ = useOrders(!!user);
  const quote = quoteQ.data;

  const [addressEdit, setAddress] = useState<string | null>(null);
  const [customsMode, setCustomsMode] = useState<CustomsMode>("NOW");
  const [useBalance, setUseBalance] = useState(false);
  const [refs, setRefs] = useState<string[] | null>(null);

  // Prefilled from the saved address (or the most recent order) until the customer edits it.
  const { address: savedAddress } = useSavedAddress();
  const lastAddress = ordersQ.data?.find((o) => !!o.address)?.address;
  const address = addressEdit ?? (savedAddress || lastAddress || "");

  const currency = quote?.buyer_currency || user?.currency || "";
  const payable = Number(customsMode === "NOW" ? quote?.total_with_customs : quote?.total_without_customs) || 0;
  const balance = Number(walletQ.data?.total_available ?? 0);
  const walletApplied = useBalance ? Math.min(balance, payable) : 0;
  const toPay = Math.max(0, payable - walletApplied);

  const fxShops = useMemo(
    () => (quote?.shops ?? []).filter((s) => s.shop_currency && s.shop_currency !== currency),
    [quote, currency],
  );

  const mutation = useMutation({
    mutationFn: async () =>
      apiFetch<OrderResult>("/orders", {
        method: "POST",
        body: {
          items: payload,
          address: address.trim(),
          payment_method: "MOCK",
          use_wallet: useBalance,
          customs_payment: customsMode,
        },
      }),
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      clear();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      setRefs(data?.orders ?? []);
    },
    onError: (e) => {
      toast.show(e instanceof ApiError ? e.message : t("errorGeneric"), "error");
    },
  });

  const submit = () => {
    if (!address.trim()) {
      toast.show(t("addressRequired"), "error");
      return;
    }
    mutation.mutate();
  };

  if (refs) {
    return (
      <View style={styles.root}>
        <ScreenHeader title={t("checkoutTitle")} onBack={() => router.replace("/(tabs)")} />
        <View style={styles.successWrap}>
          <CheckCircle size={88} color={colors.success} weight="fill" />
          <Txt weight="bold" size="xxl" style={{ textAlign: "center" }}>
            {t("orderSuccess")}
          </Txt>
          {refs.length > 0 && (
            <Txt testID="order-refs" weight="semibold" size="base" style={{ textAlign: "center" }}>
              {t("orderRefs")} : {refs.join(", ")}
            </Txt>
          )}
          <Txt color="muted" size="base" style={{ textAlign: "center" }}>
            {t("orderSuccessSub")}
          </Txt>
          <View style={{ width: "100%", gap: spacing.md, marginTop: spacing.lg }}>
            <Button label={t("viewOrders")} onPress={() => router.replace("/orders")} testID="view-orders-button" />
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

  const quoteReady = !!quote && !quoteQ.isFetching && !quoteQ.isError;

  return (
    <View style={styles.root}>
      <ScreenHeader title={t("checkoutTitle")} />
      <KeyboardAwareScrollView
        bottomOffset={24}
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
                {l.shop_name}
                {l.variant_label ? ` · ${l.variant_label}` : ""} · x{l.qty}
              </Txt>
            </View>
            <Txt weight="semibold" size="base">
              {formatPrice(l.unit_price * l.qty, l.currency_symbol)}
            </Txt>
          </View>
        ))}

        {/* Address */}
        <View style={styles.card}>
          <Txt weight="bold" size="base">
            {t("deliveryAddress")}
          </Txt>
          <TextInput
            testID="checkout-address-input"
            value={address}
            onChangeText={setAddress}
            placeholder={t("addressPlaceholder")}
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
          />
        </View>

        {/* Quote */}
        <View style={styles.card} testID="checkout-quote">
          <Txt weight="bold" size="base">
            {t("quoteTitle")}
          </Txt>
          {quoteQ.isLoading ? (
            <Txt color="muted" size="sm">
              {t("quoteLoading")}
            </Txt>
          ) : quoteQ.isError || !quote ? (
            <View style={{ gap: spacing.sm }}>
              <Txt color="error" size="sm">
                {quoteQ.error instanceof ApiError ? quoteQ.error.message : t("quoteError")}
              </Txt>
              <Button label={t("retry")} variant="secondary" onPress={() => quoteQ.refetch()} testID="quote-retry" />
            </View>
          ) : (
            <>
              {fxShops.map((s) => (
                <Txt key={s.shop_id} size="xs" color="muted">
                  {s.shop_name} · 1 {s.shop_currency} = {Number(s.fx_rate || 0).toFixed(4)} {currency}
                </Txt>
              ))}
              <Line label={t("subtotal")} value={formatPrice(quote.subtotal, currency)} />
              <Line label={t("shipping")} value={formatPrice(quote.shipping, currency)} />
              <Line label={t("customs")} value={formatPrice(quote.customs, currency)} />
              {quote.customs > 0 && (
                <>
                  <Txt weight="semibold" size="sm" style={{ marginTop: spacing.sm }}>
                    {t("customsPayment")}
                  </Txt>
                  <View style={styles.segment}>
                    {(["NOW", "LATER"] as CustomsMode[]).map((m) => {
                      const on = customsMode === m;
                      return (
                        <Pressable
                          key={m}
                          testID={`customs-${m.toLowerCase()}`}
                          onPress={() => setCustomsMode(m)}
                          style={[styles.segBtn, on && { backgroundColor: colors.brandPrimary }]}
                        >
                          <Txt size="sm" weight="semibold" style={{ color: on ? colors.onBrandPrimary : colors.onSurface }}>
                            {m === "NOW" ? t("customsNow") : t("customsLater")}
                          </Txt>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}
              <View style={styles.divider} />
              <Line label={t("estimatedTotal")} value={formatPrice(payable, currency)} strong testID="checkout-total" />
            </>
          )}
        </View>

        {/* Wallet */}
        <View style={styles.card}>
          <Txt weight="bold" size="base">
            {t("walletSection")}
          </Txt>
          <Txt size="sm" color="muted">
            {t("totalAvailable")} : {formatPrice(balance, currency)}
          </Txt>
          <Pressable
            testID="use-wallet-toggle"
            disabled={balance <= 0}
            onPress={() => setUseBalance((v) => !v)}
            style={[styles.checkRow, balance <= 0 && { opacity: 0.5 }]}
          >
            {useBalance ? (
              <CheckSquare size={24} color={colors.brandPrimary} weight="fill" />
            ) : (
              <Square size={24} color={colors.muted} />
            )}
            <Txt weight="medium" size="base">
              {t("useWallet")}
            </Txt>
          </Pressable>
          {useBalance && <Line label={t("walletUsed")} value={formatPrice(walletApplied, currency)} />}
        </View>

        <View style={styles.paymentNote}>
          <ShieldCheck size={16} color={colors.success} weight="fill" />
          <Txt size="xs" color="muted" style={{ flex: 1 }}>
            {t("paymentSimulated")}
          </Txt>
        </View>
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Line label={t("remainingToPay")} value={formatPrice(toPay, currency)} strong />
        <Button
          label={mutation.isPending ? t("placingOrder") : t("placeOrder")}
          onPress={submit}
          loading={mutation.isPending}
          disabled={!quoteReady || lines.length === 0}
          testID="place-order-button"
        />
      </View>
    </View>
  );
}

function Line({ label, value, strong, testID }: { label: string; value: string; strong?: boolean; testID?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.line}>
      <Txt size={strong ? "base" : "sm"} color={strong ? "onSurface" : "muted"} weight={strong ? "bold" : "regular"}>
        {label}
      </Txt>
      <Txt testID={testID} size={strong ? "lg" : "sm"} weight={strong ? "bold" : "semibold"} color={strong ? "brandPrimary" : "onSurface"}>
        {value}
      </Txt>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
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
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    minHeight: 72,
    textAlignVertical: "top",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.onSurface,
  },
  line: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.xs },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, borderRadius: radius.pill },
  checkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  paymentNote: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
}));

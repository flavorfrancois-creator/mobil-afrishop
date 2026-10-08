import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Minus, Plus, ShoppingCart, Trash } from "phosphor-react-native";

import { Button } from "@/src/components/Button";
import { EmptyView } from "@/src/components/StateViews";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { usesNativeTabs } from "@/src/navigation";
import { CartLine, useCart } from "@/src/store/cart";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { formatPrice } from "@/src/utils/format";

export default function CartScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lines, groups, count, setQty, remove } = useCart();

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  if (lines.length === 0) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Txt weight="bold" size="xl">
            {t("cartTitle")}
          </Txt>
        </View>
        <EmptyView
          title={t("emptyCart")}
          subtitle={t("emptyCartSub")}
          icon={<ShoppingCart size={56} color={colors.muted} weight="duotone" />}
        />
        <View style={{ padding: spacing.lg, paddingBottom: bottomChrome + spacing.lg }}>
          <Button
            label={t("continueShopping")}
            onPress={() => router.push("/(tabs)")}
            variant="secondary"
            testID="continue-shopping-button"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Txt weight="bold" size="xl">
          {t("cartTitle")}
        </Txt>
        <Txt color="muted" size="sm">
          {count} {count > 1 ? t("items") : t("item")}
        </Txt>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
      >
        {lines.map((l: CartLine) => (
          <View key={l.id} style={styles.row} testID={`cart-line-${l.id}`}>
            <Image source={{ uri: l.image }} style={styles.img} contentFit="cover" />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Txt weight="semibold" size="base" numberOfLines={2}>
                {l.name}
              </Txt>
              <Txt size="xs" color="muted" numberOfLines={1}>
                {l.shop_name}
              </Txt>
              <Txt weight="bold" size="base" color="brandPrimary">
                {formatPrice(l.unit_price, l.currency_symbol)}
              </Txt>
              <View style={styles.stepperRow}>
                <View style={styles.stepper}>
                  <Pressable
                    testID={`cart-dec-${l.id}`}
                    hitSlop={6}
                    onPress={() => setQty(l.id, l.qty - 1)}
                    style={styles.stepBtn}
                  >
                    <Minus size={16} color={colors.onSurface} weight="bold" />
                  </Pressable>
                  <Txt weight="semibold" size="base" style={{ minWidth: 24, textAlign: "center" }}>
                    {l.qty}
                  </Txt>
                  <Pressable
                    testID={`cart-inc-${l.id}`}
                    hitSlop={6}
                    onPress={() => setQty(l.id, l.qty + 1)}
                    style={styles.stepBtn}
                  >
                    <Plus size={16} color={colors.onSurface} weight="bold" />
                  </Pressable>
                </View>
                <Pressable testID={`cart-remove-${l.id}`} hitSlop={8} onPress={() => remove(l.id)}>
                  <Trash size={20} color={colors.error} weight="regular" />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Sticky summary + checkout */}
      <View style={[styles.footer, { paddingBottom: bottomChrome + spacing.lg }]}>
        {groups.map((g) => (
          <View key={g.symbol} style={styles.summaryRow}>
            <Txt color="muted" size="sm">
              {t("subtotal")} ({g.symbol})
            </Txt>
            <Txt weight="bold" size="base">
              {formatPrice(g.subtotal, g.symbol)}
            </Txt>
          </View>
        ))}
        <Txt size="xs" color="muted" style={{ marginBottom: spacing.sm }}>
          {t("shippingAtCheckout")}
        </Txt>
        <Button label={t("checkout")} onPress={() => router.push("/checkout")} testID="cart-checkout-button" />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 2,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  img: { width: 84, height: 84, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
  },
  stepBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
}));

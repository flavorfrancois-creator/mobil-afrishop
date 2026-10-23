import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeft, Heart, Minus, Plus, Storefront } from "phosphor-react-native";

import { useProduct } from "@/src/api/hooks";
import { Button } from "@/src/components/Button";
import { Price } from "@/src/components/Price";
import { EmptyView, ErrorView, LoadingView } from "@/src/components/StateViews";
import { useToast } from "@/src/components/Toast";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { useCart, variantPrice } from "@/src/store/cart";
import { useFavorites } from "@/src/store/favorites";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ProductDetailScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();

  const { id } = useLocalSearchParams<{ id: string }>();
  const productQ = useProduct(id);
  const product = productQ.data;

  const gallery = product?.gallery?.length ? product.gallery : product ? [product.image] : [];
  const [active, setActive] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const variants = product?.variants ?? [];
  const variant = variants.find((v) => v.id === variantId) ?? (variants.length === 1 ? variants[0] : null);
  const needsVariant = variants.length > 1 && !variant;
  const stock = Number(variant?.stock ?? product?.stock ?? 0);
  const fav = !!product && isFavorite(product.id);

  const hasPromo = !variant && !!product?.is_promo && !!product && variantPrice(product) < product.price_simple;
  const outOfStock = stock <= 0;

  const onAdd = () => {
    if (!product) return;
    if (needsVariant) {
      toast.show(t("chooseVariant"), "info");
      return;
    }
    add(product, qty, variant);
    toast.show(t("addedToCart"), "success");
  };

  return (
    <View style={styles.root}>
      {productQ.isLoading ? (
        <LoadingView />
      ) : productQ.isError ? (
        <ErrorView onRetry={() => productQ.refetch()} />
      ) : !product ? (
        <EmptyView title={t("productUnavailable")} />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          >
            <View style={styles.heroWrap}>
              <Image
                source={{ uri: gallery[active] }}
                style={styles.hero}
                contentFit="cover"
                transition={200}
              />
              {hasPromo && (
                <View style={styles.promoBadge}>
                  <Txt size="sm" weight="bold" color="onError">
                    PROMO
                  </Txt>
                </View>
              )}
            </View>

            {gallery.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbs}
              >
                {gallery.map((g, i) => (
                  <Pressable key={i} onPress={() => setActive(i)} testID={`thumb-${i}`}>
                    <Image
                      source={{ uri: g }}
                      style={[styles.thumb, i === active && { borderColor: colors.brandPrimary }]}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <View style={styles.body}>
              <Pressable
                testID="product-shop-link"
                style={styles.shopLink}
                onPress={() => router.push(`/shop/${product.shop_id}`)}
              >
                <Storefront size={16} color={colors.brandPrimary} weight="duotone" />
                <Txt size="sm" weight="medium" color="brandPrimary">
                  {product.shop_name}
                </Txt>
              </Pressable>

              <Txt weight="bold" size="xxl">
                {product.name}
              </Txt>

              <Price
                price={product ? variantPrice(product, variant) : 0}
                symbol={product.currency_symbol}
                originalPrice={hasPromo ? product.price_simple : undefined}
                size="xl"
              />

              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.stockPill,
                    { backgroundColor: outOfStock ? colors.surfaceTertiary : colors.brandTertiary },
                  ]}
                >
                  <Txt size="xs" weight="semibold" color={outOfStock ? "muted" : "onBrandTertiary"}>
                    {outOfStock ? t("outOfStock") : `${stock} ${t("stockLeft")}`}
                  </Txt>
                </View>
                {!!product.sold && (
                  <Txt size="xs" color="muted">
                    {product.sold} {t("sold")}
                  </Txt>
                )}
              </View>

              {variants.length > 0 && (
                <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                  <Txt weight="semibold" size="lg">
                    {t("chooseVariant")}
                  </Txt>
                  <View style={styles.variantRow}>
                    {variants.map((v) => {
                      const on = variant?.id === v.id;
                      return (
                        <Pressable
                          key={v.id}
                          testID={`variant-${v.id}`}
                          onPress={() => setVariantId(v.id)}
                          style={[
                            styles.variantChip,
                            on && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
                          ]}
                        >
                          <Txt size="sm" weight="medium" style={{ color: on ? colors.onBrandPrimary : colors.onSurface }}>
                            {v.label || "—"} · {v.stock ?? 0} {t("inStockShort")}
                          </Txt>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.qtyRow}>
                <Txt weight="semibold" size="lg">
                  {t("quantity")}
                </Txt>
                <View style={styles.stepper}>
                  <Pressable testID="qty-dec" hitSlop={6} style={styles.stepBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                    <Minus size={16} color={colors.onSurface} weight="bold" />
                  </Pressable>
                  <Txt testID="qty-value" weight="semibold" size="base" style={{ minWidth: 28, textAlign: "center" }}>
                    {qty}
                  </Txt>
                  <Pressable
                    testID="qty-inc"
                    hitSlop={6}
                    style={styles.stepBtn}
                    onPress={() => setQty((q) => Math.min(Math.max(1, stock), q + 1))}
                  >
                    <Plus size={16} color={colors.onSurface} weight="bold" />
                  </Pressable>
                </View>
              </View>

              {!!product.description && (
                <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                  <Txt weight="semibold" size="lg">
                    {t("description")}
                  </Txt>
                  <Txt color="onSurfaceTertiary" size="base" style={{ lineHeight: 22 }}>
                    {product.description}
                  </Txt>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Back button over hero */}
          <Pressable
            testID="product-back"
            onPress={() => router.back()}
            style={[styles.backBtn, { left: spacing.lg, top: insets.top + spacing.sm }]}
            hitSlop={8}
          >
            <CaretLeft size={22} color={colors.onSurface} weight="bold" />
          </Pressable>

          <Pressable
            testID="favorite-toggle"
            accessibilityLabel={fav ? t("removeFavorite") : t("addFavorite")}
            onPress={() => {
              toggle(product);
              toast.show(fav ? t("removeFavorite") : t("addFavorite"), "success");
            }}
            style={[styles.backBtn, { right: spacing.lg, top: insets.top + spacing.sm }]}
            hitSlop={8}
          >
            <Heart size={22} color={fav ? colors.error : colors.onSurface} weight={fav ? "fill" : "bold"} />
          </Pressable>

          {/* Sticky add to cart */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <Button
              label={outOfStock ? t("outOfStock") : t("addToCart")}
              onPress={onAdd}
              disabled={outOfStock}
              testID="add-to-cart-button"
            />
          </View>
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  heroWrap: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceTertiary },
  hero: { width: "100%", height: "100%" },
  promoBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  thumbs: { padding: spacing.md, gap: spacing.sm },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  shopLink: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.xs },
  stockPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  backBtn: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  variantRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  variantChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
  },
  stepBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
}));

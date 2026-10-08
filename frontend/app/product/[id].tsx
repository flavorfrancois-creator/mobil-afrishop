import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeft, Storefront } from "phosphor-react-native";

import { useProduct } from "@/src/api/hooks";
import { Button } from "@/src/components/Button";
import { Price } from "@/src/components/Price";
import { EmptyView, ErrorView, LoadingView } from "@/src/components/StateViews";
import { useToast } from "@/src/components/Toast";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { useCart } from "@/src/store/cart";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ProductDetailScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { add } = useCart();

  const { id } = useLocalSearchParams<{ id: string }>();
  const productQ = useProduct(id);
  const product = productQ.data;

  const gallery = product?.gallery?.length ? product.gallery : product ? [product.image] : [];
  const [active, setActive] = useState(0);

  const hasPromo = !!product?.is_promo && (product?.display_price ?? 0) < (product?.price_simple ?? 0);
  const outOfStock = (product?.stock ?? 0) <= 0;

  const onAdd = () => {
    if (!product) return;
    add(product, 1);
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
                price={product.display_price}
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
                    {outOfStock ? t("outOfStock") : `${product.stock} ${t("stockLeft")}`}
                  </Txt>
                </View>
                {!!product.sold && (
                  <Txt size="xs" color="muted">
                    {product.sold} {t("sold")}
                  </Txt>
                )}
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
            style={[styles.backBtn, { top: insets.top + spacing.sm }]}
            hitSlop={8}
          >
            <CaretLeft size={22} color={colors.onSurface} weight="bold" />
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
    left: spacing.lg,
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
}));

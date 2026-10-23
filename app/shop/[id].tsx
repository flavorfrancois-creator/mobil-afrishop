import React, { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin } from "phosphor-react-native";

import { useProducts, useShop } from "@/src/api/hooks";
import { ProductCard } from "@/src/components/ProductCard";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { EmptyView, ErrorView, LoadingView } from "@/src/components/StateViews";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ShopDetailScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const shopQ = useShop(id);
  const productsQ = useProducts({ shop_id: id });

  const products = useMemo(
    () => (productsQ.data ?? []).filter((p) => p.shop_id === id),
    [productsQ.data, id],
  );

  const shop = shopQ.data;

  return (
    <View style={styles.root}>
      <ScreenHeader title={shop?.name ?? t("shops")} />
      {shopQ.isLoading || productsQ.isLoading ? (
        <LoadingView />
      ) : shopQ.isError ? (
        <ErrorView onRetry={() => shopQ.refetch()} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        >
          <View style={styles.shopHead}>
            <Image source={{ uri: shop?.logo }} style={styles.logo} contentFit="cover" />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Txt weight="bold" size="xl" numberOfLines={2}>
                {shop?.name}
              </Txt>
              <View style={styles.locRow}>
                <MapPin size={14} color={colors.muted} weight="fill" />
                <Txt size="sm" color="muted">
                  {shop?.city}, {shop?.country}
                </Txt>
              </View>
            </View>
          </View>

          {!!shop?.description && (
            <Txt color="onSurfaceTertiary" size="base" style={{ marginTop: spacing.md, lineHeight: 21 }}>
              {shop.description}
            </Txt>
          )}

          <Txt weight="bold" size="lg" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
            {t("shopProducts")}
          </Txt>

          {products.length === 0 ? (
            <EmptyView title={t("noProducts")} />
          ) : (
            <View style={styles.grid}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} style={styles.gridCard} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  shopHead: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  logo: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  locRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridCard: { width: "47.8%" },
}));

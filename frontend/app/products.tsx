import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeft, MagnifyingGlass, X } from "phosphor-react-native";

import { useProducts } from "@/src/api/hooks";
import { Product } from "@/src/api/types";
import { ProductCard } from "@/src/components/ProductCard";
import { EmptyView, ErrorView, LoadingView } from "@/src/components/StateViews";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { fonts, fontSizes, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ProductsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{ category?: string; promo?: string }>();
  const category = params.category;
  const promo = params.promo ? Number(params.promo) : undefined;

  const [search, setSearch] = useState("");

  const productsQ = useProducts({ category, promo });

  const filtered = useMemo(() => {
    const list = productsQ.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.shop_name.toLowerCase().includes(q),
    );
  }, [productsQ.data, search]);

  const title = category ? category : promo ? t("promotions") : t("allProducts");

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.titleRow}>
          <Pressable testID="products-back" hitSlop={10} onPress={() => router.back()} style={styles.back}>
            <CaretLeft size={22} color={colors.onSurface} weight="bold" />
          </Pressable>
          <Txt weight="bold" size="lg" numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </Txt>
        </View>
        <View style={styles.search}>
          <MagnifyingGlass size={18} color={colors.muted} />
          <TextInput
            testID="products-search-input"
            value={search}
            onChangeText={setSearch}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setSearch("")} testID="products-search-clear">
              <X size={16} color={colors.muted} weight="bold" />
            </Pressable>
          )}
        </View>
      </View>

      {productsQ.isLoading ? (
        <LoadingView />
      ) : productsQ.isError ? (
        <ErrorView onRetry={() => productsQ.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyView title={t("noProducts")} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        >
          <View style={styles.grid}>
            {filtered.map((p: Product) => (
              <ProductCard key={p.id} product={p} style={styles.gridCard} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  back: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.onSurface,
    paddingVertical: 2,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridCard: { width: "47.8%" },
}));

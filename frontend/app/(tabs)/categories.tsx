import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCategories, useProducts } from "@/src/api/hooks";
import { Category } from "@/src/api/types";
import { categoryIcon } from "@/src/components/categoryIcon";
import { ProductCard } from "@/src/components/ProductCard";
import { EmptyView, ErrorView, LoadingView } from "@/src/components/StateViews";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function CategoriesScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const categoriesQ = useCategories();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);
  const selected = useMemo<Category | undefined>(
    () => categories.find((c) => c.id === selectedId) ?? categories[0],
    [categories, selectedId],
  );

  useEffect(() => {
    if (!selectedId && categories.length > 0) setSelectedId(categories[0].id);
  }, [categories, selectedId]);

  const productsQ = useProducts(selected ? { category: selected.name } : undefined);
  const products = useMemo(
    () => (productsQ.data ?? []).filter((p) => p.category === selected?.name),
    [productsQ.data, selected],
  );

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Txt weight="bold" size="xl">
          {t("tabCategories")}
        </Txt>
      </View>

      {categoriesQ.isLoading ? (
        <LoadingView />
      ) : categoriesQ.isError ? (
        <ErrorView onRetry={() => categoriesQ.refetch()} />
      ) : (
        <View style={styles.pane}>
          {/* Left rail */}
          <ScrollView
            style={styles.rail}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomChrome + spacing.xl }}
          >
            {categories.map((c) => {
              const active = c.id === selected?.id;
              const Icon = categoryIcon(c.name);
              return (
                <Pressable
                  key={c.id}
                  testID={`category-rail-${c.id}`}
                  onPress={() => setSelectedId(c.id)}
                  style={[styles.railItem, active && styles.railItemActive]}
                >
                  {active && <View style={styles.railAccent} />}
                  <Icon
                    size={22}
                    color={active ? colors.brandPrimary : colors.muted}
                    weight={active ? "duotone" : "regular"}
                  />
                  <Txt
                    size="sm"
                    weight={active ? "semibold" : "regular"}
                    color={active ? "brandPrimary" : "onSurfaceTertiary"}
                    numberOfLines={2}
                    style={styles.railLabel}
                  >
                    {c.name}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Right content */}
          <View style={styles.content}>
            <View style={styles.contentHead}>
              <Txt weight="bold" size="lg" numberOfLines={1} style={{ flex: 1 }}>
                {selected?.name}
              </Txt>
              {products.length > 0 && (
                <Pressable
                  testID="category-see-all"
                  hitSlop={8}
                  onPress={() =>
                    selected && router.push(`/products?category=${encodeURIComponent(selected.name)}`)
                  }
                >
                  <Txt size="sm" weight="semibold" color="brandPrimary">
                    {t("seeAll")}
                  </Txt>
                </Pressable>
              )}
            </View>

            {productsQ.isLoading ? (
              <LoadingView />
            ) : productsQ.isError ? (
              <ErrorView onRetry={() => productsQ.refetch()} />
            ) : products.length === 0 ? (
              <EmptyView title={t("noProducts")} />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  padding: spacing.md,
                  paddingBottom: bottomChrome + spacing.xl,
                  gap: spacing.md,
                }}
              >
                <View style={styles.grid}>
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} style={styles.gridCard} />
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      )}
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
  },
  pane: { flex: 1, flexDirection: "row" },
  rail: {
    width: 104,
    flexGrow: 0,
    backgroundColor: colors.surfaceTertiary,
    borderRightWidth: 1,
    borderRightColor: colors.divider,
  },
  railItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  railItemActive: { backgroundColor: colors.surface },
  railAccent: {
    position: "absolute",
    left: 0,
    top: spacing.sm,
    bottom: spacing.sm,
    width: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.brandPrimary,
  },
  railLabel: { textAlign: "center" },
  content: { flex: 1 },
  contentHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridCard: { width: "47%" },
}));

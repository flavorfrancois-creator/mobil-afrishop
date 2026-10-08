import React from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretRight, MagnifyingGlass, ShoppingCart } from "phosphor-react-native";

import { useCategories, useProducts, useShops } from "@/src/api/hooks";
import { Category, Product, Shop } from "@/src/api/types";
import { categoryIcon } from "@/src/components/categoryIcon";
import { ProductCard } from "@/src/components/ProductCard";
import { ErrorView, LoadingView } from "@/src/components/StateViews";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { usesNativeTabs } from "@/src/navigation";
import { useCart } from "@/src/store/cart";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1601330862030-1e08c703ac04?crop=entropy&cs=srgb&fm=jpg&w=1000&q=80";

export default function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { count } = useCart();

  const categoriesQ = useCategories();
  const productsQ = useProducts();
  const promosQ = useProducts({ promo: 1 });
  const shopsQ = useShops();

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const loading = productsQ.isLoading || categoriesQ.isLoading;
  const error = productsQ.isError;

  const refreshing =
    productsQ.isFetching || categoriesQ.isFetching || promosQ.isFetching || shopsQ.isFetching;
  const onRefresh = () => {
    productsQ.refetch();
    categoriesQ.refetch();
    promosQ.refetch();
    shopsQ.refetch();
  };

  return (
    <View style={styles.root}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Txt weight="bold" size="xl" color="brandPrimary">
          {t("appName")}
        </Txt>
        <Pressable
          testID="home-search-bar"
          style={styles.search}
          onPress={() => router.push("/products")}
        >
          <MagnifyingGlass size={18} color={colors.muted} />
          <Txt color="muted" size="base" numberOfLines={1} style={{ flex: 1 }}>
            {t("searchPlaceholder")}
          </Txt>
        </Pressable>
        <Pressable testID="home-cart-button" hitSlop={10} onPress={() => router.push("/(tabs)/cart")}>
          <ShoppingCart size={26} color={colors.onSurface} weight="regular" />
          {count > 0 && (
            <View style={styles.cartBadge}>
              <Txt size="xs" weight="bold" color="onBrandPrimary">
                {count}
              </Txt>
            </View>
          )}
        </Pressable>
      </View>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView onRetry={onRefresh} />
      ) : (
        <ScrollView
          testID="home-scroll"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomChrome + spacing.xl }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
          }
        >
          {/* Hero */}
          <View style={styles.hero}>
            <Image source={{ uri: HERO }} style={styles.heroImg} contentFit="cover" transition={250} />
            <LinearGradient
              colors={["rgba(31,28,24,0.1)", "rgba(31,28,24,0.78)"]}
              style={styles.heroScrim}
            />
            <View style={styles.heroText}>
              <Txt weight="bold" size="xxl" style={{ color: "#FFFFFF" }}>
                {t("heroTitle")}
              </Txt>
              <Txt size="base" style={{ color: "#FFFFFF", opacity: 0.9, marginTop: spacing.xs }}>
                {t("heroSubtitle")}
              </Txt>
            </View>
          </View>

          {/* Categories */}
          <Section title={t("categories")} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {(categoriesQ.data ?? []).map((c: Category) => {
              const Icon = categoryIcon(c.name);
              return (
                <Pressable
                  key={c.id}
                  testID={`category-chip-${c.id}`}
                  style={styles.chip}
                  onPress={() => router.push(`/products?category=${encodeURIComponent(c.name)}`)}
                >
                  <Icon size={18} color={colors.brandPrimary} weight="duotone" />
                  <Txt size="sm" weight="medium" numberOfLines={1}>
                    {c.name}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Promotions */}
          {(promosQ.data?.length ?? 0) > 0 && (
            <>
              <Section
                title={t("promotions")}
                onSeeAll={() => router.push("/products?promo=1")}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hRow}
              >
                {(promosQ.data ?? []).map((p: Product) => (
                  <ProductCard key={p.id} product={p} style={styles.hCard} />
                ))}
              </ScrollView>
            </>
          )}

          {/* Trending shops */}
          {(shopsQ.data?.length ?? 0) > 0 && (
            <>
              <Section title={t("trendingShops")} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hRow}
              >
                {(shopsQ.data ?? []).map((s: Shop) => (
                  <Pressable
                    key={s.id}
                    testID={`shop-card-${s.id}`}
                    style={styles.shopCard}
                    onPress={() => router.push(`/shop/${s.id}`)}
                  >
                    <Image source={{ uri: s.logo }} style={styles.shopLogo} contentFit="cover" />
                    <Txt weight="semibold" size="base" numberOfLines={1}>
                      {s.name}
                    </Txt>
                    <Txt size="xs" color="muted" numberOfLines={1}>
                      {s.city}, {s.country}
                    </Txt>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          {/* Products grid */}
          <Section title={t("products")} onSeeAll={() => router.push("/products")} />
          <View style={styles.grid}>
            {(productsQ.data ?? []).map((p: Product) => (
              <ProductCard key={p.id} product={p} style={styles.gridCard} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={styles.section}>
      <Txt weight="bold" size="xl">
        {title}
      </Txt>
      {onSeeAll && (
        <Pressable style={styles.seeAll} hitSlop={8} onPress={onSeeAll} testID={`see-all-${title}`}>
          <Txt size="sm" weight="semibold" color="brandPrimary">
            {t("seeAll")}
          </Txt>
          <CaretRight size={14} color={colors.brandPrimary} weight="bold" />
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: colors.brandPrimary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  hero: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    height: 190,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceTertiary,
  },
  heroImg: { width: "100%", height: "100%" },
  heroScrim: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  heroText: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  section: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingRight: spacing.xl },
  chip: {
    flexShrink: 0,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  hRow: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingRight: spacing.xl },
  hCard: { width: 160 },
  shopCard: {
    width: 150,
    gap: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  shopLogo: {
    width: "100%",
    height: 90,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  gridCard: { width: "47.8%" },
}));

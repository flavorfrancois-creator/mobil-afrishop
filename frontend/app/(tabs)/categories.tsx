import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretRight } from "phosphor-react-native";

import { useCategories, useShops } from "@/src/api/hooks";
import { Category, Shop } from "@/src/api/types";
import { categoryIcon } from "@/src/components/categoryIcon";
import { ErrorView, LoadingView } from "@/src/components/StateViews";
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
  const shopsQ = useShops();
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + spacing.xl }}
        >
          <View style={styles.grid}>
            {(categoriesQ.data ?? []).map((c: Category) => {
              const Icon = categoryIcon(c.name);
              return (
                <Pressable
                  key={c.id}
                  testID={`category-card-${c.id}`}
                  style={styles.catCard}
                  onPress={() => router.push(`/products?category=${encodeURIComponent(c.name)}`)}
                >
                  <View style={styles.catIcon}>
                    <Icon size={28} color={colors.brandPrimary} weight="duotone" />
                  </View>
                  <Txt weight="semibold" size="base" numberOfLines={2} style={{ textAlign: "center" }}>
                    {c.name}
                  </Txt>
                </Pressable>
              );
            })}
          </View>

          <Txt weight="bold" size="xl" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
            {t("shops")}
          </Txt>
          <View style={{ gap: spacing.md }}>
            {(shopsQ.data ?? []).map((s: Shop) => (
              <Pressable
                key={s.id}
                testID={`shop-row-${s.id}`}
                style={styles.shopRow}
                onPress={() => router.push(`/shop/${s.id}`)}
              >
                <Image source={{ uri: s.logo }} style={styles.shopLogo} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Txt weight="semibold" size="base" numberOfLines={1}>
                    {s.name}
                  </Txt>
                  <Txt size="sm" color="muted" numberOfLines={1}>
                    {s.city}, {s.country}
                  </Txt>
                </View>
                <CaretRight size={18} color={colors.muted} weight="bold" />
              </Pressable>
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
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  catCard: {
    width: "47.8%",
    aspectRatio: 1.3,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  catIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  shopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  shopLogo: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
}));

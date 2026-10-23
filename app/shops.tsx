import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MagnifyingGlass, Storefront } from "phosphor-react-native";

import { useShops } from "@/src/api/hooks";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { EmptyView, ErrorView, LoadingView } from "@/src/components/StateViews";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { fonts, fontSizes, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ShopsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const shopsQ = useShops();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (shopsQ.data ?? []).filter((s) =>
      [s.name, s.city, s.country].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [shopsQ.data, query]);

  return (
    <View style={styles.root}>
      <ScreenHeader title={t("allShops")} />
      <View style={styles.searchWrap}>
        <MagnifyingGlass size={18} color={colors.muted} />
        <TextInput
          testID="shops-search-input"
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchShops")}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>
      {shopsQ.isLoading ? (
        <LoadingView />
      ) : shopsQ.isError ? (
        <ErrorView onRetry={() => shopsQ.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyView title={t("noShops")} icon={<Storefront size={56} color={colors.muted} weight="duotone" />} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }}>
          {filtered.map((s) => (
            <Pressable
              key={s.id}
              testID={`shops-item-${s.id}`}
              style={styles.card}
              onPress={() => router.push(`/shop/${s.id}`)}
            >
              <Image source={{ uri: s.logo }} style={styles.logo} contentFit="cover" />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt weight="bold" size="base" numberOfLines={1}>
                  {s.name}
                </Txt>
                <Txt size="sm" color="muted" numberOfLines={1}>
                  {[s.city, s.country].filter(Boolean).join(", ")}
                  {s.currency ? ` · ${s.currency}` : ""}
                </Txt>
                {!!s.description && (
                  <Txt size="xs" color="muted" numberOfLines={2}>
                    {s.description}
                  </Txt>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.onSurface,
  },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  logo: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
}));

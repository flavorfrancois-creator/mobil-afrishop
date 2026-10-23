import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heart } from "phosphor-react-native";

import { ProductCard } from "@/src/components/ProductCard";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { EmptyView } from "@/src/components/StateViews";
import { useI18n } from "@/src/i18n";
import { useFavorites } from "@/src/store/favorites";
import { makeStyles, spacing, useTheme } from "@/src/theme";

export default function FavoritesScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { favorites } = useFavorites();

  return (
    <View style={styles.root}>
      <ScreenHeader title={t("favoritesTitle")} />
      {favorites.length === 0 ? (
        <EmptyView
          title={t("emptyFavorites")}
          subtitle={t("emptyFavoritesSub")}
          icon={<Heart size={56} color={colors.muted} weight="duotone" />}
        />
      ) : (
        <ScrollView contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + spacing.xl }]}>
          {favorites.map((p) => (
            <ProductCard key={p.id} product={p} style={styles.card} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: spacing.lg, gap: spacing.md },
  card: { width: "47.8%" },
}));

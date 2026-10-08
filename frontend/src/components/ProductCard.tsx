import React from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { Product } from "@/src/api/types";
import { makeStyles, radius, spacing } from "@/src/theme";
import { Price } from "./Price";
import { Txt } from "./Txt";

const BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export function ProductCard({ product, style }: { product: Product; style?: any }) {
  const router = useRouter();
  const styles = useStyles();
  const hasPromo = product.is_promo && product.display_price < product.price_simple;

  return (
    <Pressable
      testID={`product-card-${product.id}`}
      style={[styles.card, style]}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: BLUR }}
          transition={200}
        />
        {hasPromo && (
          <View style={styles.promoBadge}>
            <Txt size="xs" weight="bold" color="onError">
              PROMO
            </Txt>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Txt size="xs" color="muted" numberOfLines={1}>
          {product.shop_name}
        </Txt>
        <Txt weight="semibold" size="base" numberOfLines={2} style={styles.name}>
          {product.name}
        </Txt>
        <Price
          price={product.display_price}
          symbol={product.currency_symbol}
          originalPrice={hasPromo ? product.price_simple : undefined}
          size="base"
        />
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  imageWrap: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceTertiary },
  image: { width: "100%", height: "100%" },
  promoBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  body: { padding: spacing.md, gap: spacing.xs },
  name: { minHeight: 38 },
}));

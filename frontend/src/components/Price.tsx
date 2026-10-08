import React from "react";
import { View } from "react-native";

import { fontSizes, spacing } from "@/src/theme";
import { formatPrice } from "@/src/utils/format";
import { Txt } from "./Txt";

type Props = {
  price: number;
  symbol: string;
  originalPrice?: number;
  size?: keyof typeof fontSizes;
};

export function Price({ price, symbol, originalPrice, size = "lg" }: Props) {
  const hasPromo = originalPrice !== undefined && originalPrice > price;
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm, flexWrap: "wrap" }}>
      <Txt weight="bold" size={size} color={hasPromo ? "brandPrimary" : "onSurface"}>
        {formatPrice(price, symbol)}
      </Txt>
      {hasPromo && (
        <Txt
          size="sm"
          color="muted"
          style={{ textDecorationLine: "line-through" }}
        >
          {formatPrice(originalPrice as number, symbol)}
        </Txt>
      )}
    </View>
  );
}

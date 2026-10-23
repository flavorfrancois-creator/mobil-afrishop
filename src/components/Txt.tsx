import React from "react";
import { Text, TextProps } from "react-native";

import { fonts, fontSizes, ThemeColors, useTheme } from "@/src/theme";

type Weight = "regular" | "medium" | "semibold" | "bold";

type Props = TextProps & {
  weight?: Weight;
  size?: keyof typeof fontSizes | number;
  color?: keyof ThemeColors;
};

export function Txt({ weight = "regular", size = "base", color = "onSurface", style, ...rest }: Props) {
  const { colors } = useTheme();
  const fontSize = typeof size === "number" ? size : fontSizes[size];
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts[weight], fontSize, color: colors[color] },
        style,
      ]}
    />
  );
}

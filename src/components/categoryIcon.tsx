import React from "react";
import {
  Basket,
  DeviceMobile,
  ForkKnife,
  IconProps,
  Palette,
  Sparkle,
  Storefront,
  TShirt,
} from "phosphor-react-native";

type IconComponent = React.ComponentType<IconProps>;

const MAP: Record<string, IconComponent> = {
  "Mode & Vêtements": TShirt,
  Électronique: DeviceMobile,
  "Maison & Cuisine": ForkKnife,
  Alimentation: Basket,
  "Beauté & Cosmétiques": Sparkle,
  Artisanat: Palette,
};

export function categoryIcon(name: string): IconComponent {
  return MAP[name] ?? Storefront;
}

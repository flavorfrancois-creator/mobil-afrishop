import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";
import { House, ShoppingCart, SquaresFour, User } from "phosphor-react-native";

import { useI18n } from "@/src/i18n";
import { usesNativeTabs } from "@/src/navigation";
import { useCart } from "@/src/store/cart";
import { fonts, useTheme } from "@/src/theme";

export default function TabsLayout() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { count } = useCart();

  if (usesNativeTabs) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="house.fill" />
          <NativeTabs.Trigger.Label>{t("tabHome")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="categories">
          <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" />
          <NativeTabs.Trigger.Label>{t("tabCategories")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="cart">
          <NativeTabs.Trigger.Icon sf="cart.fill" />
          <NativeTabs.Trigger.Label>{t("tabCart")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="account">
          <NativeTabs.Trigger.Icon sf="person.fill" />
          <NativeTabs.Trigger.Label>{t("tabAccount")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabHome"),
          tabBarIcon: ({ color, focused }) => (
            <House size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t("tabCategories"),
          tabBarIcon: ({ color, focused }) => (
            <SquaresFour size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("tabCart"),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.brandPrimary, color: colors.onBrandPrimary },
          tabBarIcon: ({ color, focused }) => (
            <ShoppingCart size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t("tabAccount"),
          tabBarIcon: ({ color, focused }) => (
            <User size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
    </Tabs>
  );
}

import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import {
  CaretDown,
  CaretRight,
  Heart,
  PencilSimple,
  Receipt,
  ShoppingCart,
  SignOut,
  Storefront,
  User,
  Wallet as WalletIcon,
} from "phosphor-react-native";

import { ApiError, apiFetch } from "@/src/api/client";
import { useDeletionRequest, useOrders, useWallet } from "@/src/api/hooks";
import { AccountAction, AccountActionSheet } from "@/src/components/AccountActionSheet";
import { ProfileMenu } from "@/src/components/ProfileMenu";
import { useToast } from "@/src/components/Toast";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { Lang } from "@/src/i18n/translations";
import { usesNativeTabs } from "@/src/navigation";
import { useSavedAddress } from "@/src/store/address";
import { BiometricUnavailableError, useAuth } from "@/src/store/auth";
import { useCart } from "@/src/store/cart";
import { useFavorites } from "@/src/store/favorites";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { formatAmount } from "@/src/utils/format";

const ACTIVE_DELETION = ["PENDING", "AWAITING_USER"];

export default function AccountScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, signOut, saveLanguage, biometricEnabled, enableBiometrics, disableBiometrics } = useAuth();
  const { favorites } = useFavorites();
  const { count } = useCart();
  const { address: savedAddress } = useSavedAddress();

  const walletQ = useWallet(!!user);
  const ordersQ = useOrders(!!user);
  const deletionQ = useDeletionRequest(!!user);
  const [action, setAction] = useState<AccountAction>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const deliveryAddress = savedAddress || ordersQ.data?.find((o) => !!o.address)?.address || "";
  const deletion = deletionQ.data;
  const deletionActive = !!deletion && ACTIVE_DELETION.includes(deletion.status);

  const errorToast = (e: unknown) =>
    toast.show(
      e instanceof BiometricUnavailableError
        ? t("biometricUnavailable")
        : e instanceof ApiError
          ? e.message
          : t("errorGeneric"),
      "error",
    );

  const chooseLang = (code: Lang) => saveLanguage(code).catch(errorToast);

  const toggleBiometric = async () => {
    try {
      if (biometricEnabled) {
        await disableBiometrics();
        toast.show(t("biometricOff"), "info");
      } else if (await enableBiometrics()) {
        toast.show(t("biometricOn"), "success");
      }
    } catch (e) {
      errorToast(e);
    }
  };

  const cancelDeletion = async () => {
    try {
      const d = await apiFetch<{ message?: string }>("/account/deletion", { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["deletion"] });
      toast.show(d?.message || t("saved"), "success");
    } catch (e) {
      errorToast(e);
    }
  };

  const logout = async () => {
    await signOut();
    queryClient.clear();
    router.replace("/login");
  };

  return (
    <View style={styles.root}>
      {/* Top bar: logo menu (left) + app name, cart (right) */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          testID="account-menu-button"
          accessibilityLabel={t("editProfile")}
          onPress={() => setMenuOpen(true)}
          style={styles.logoBtn}
          hitSlop={6}
        >
          <Image
            testID="account-app-logo"
            source={require("@/assets/images/afrimarket-logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <CaretDown size={12} color={colors.muted} weight="bold" />
        </Pressable>
        <Txt weight="bold" size="lg" color="brandPrimary" style={{ flex: 1 }} testID="account-app-name">
          {t("appName")}
        </Txt>
        <Pressable testID="account-cart-button" hitSlop={10} onPress={() => router.push("/(tabs)/cart")}>
          <ShoppingCart size={26} color={colors.onSurface} />
          {count > 0 && (
            <View style={styles.badge}>
              <Txt size="xs" weight="bold" color="onBrandPrimary">
                {count}
              </Txt>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + spacing.xl, gap: spacing.lg }}
      >
        {/* Customer area */}
        <View style={styles.clientCard} testID="account-client-zone">
          <View style={styles.clientHead}>
            <View style={styles.avatar}>
              <User size={26} color={colors.onBrandPrimary} weight="fill" />
            </View>
            <Txt weight="bold" size="lg" style={{ flex: 1 }}>
              {t("clientZone")}
            </Txt>
          </View>
          <Info label={t("nameLabel")} value={user?.name || "—"} testID="client-name" />
          <Info label={t("email")} value={user?.email || "—"} testID="client-email" />
          <Info label={t("phoneLabel")} value={user?.phone || "—"} testID="client-phone" />
          <Info label={t("deliveryAddress")} value={deliveryAddress || t("noAddress")} testID="client-address" />
          <Info label={t("country")} value={user?.country || "—"} testID="client-country" />
          {!!deletion && <Info label={t("deletionStatus")} value={deletion.status} />}
          <Pressable testID="account-edit-profile-button" style={styles.editBtn} onPress={() => setMenuOpen(true)}>
            <PencilSimple size={18} color={colors.brandPrimary} weight="bold" />
            <Txt weight="semibold" size="base" color="brandPrimary">
              {t("editProfile")}
            </Txt>
            <CaretDown size={14} color={colors.brandPrimary} weight="bold" />
          </Pressable>
        </View>

        <Pressable testID="account-wallet-card" style={styles.walletCard} onPress={() => router.push("/wallet")}>
          <View style={styles.walletHead}>
            <WalletIcon size={20} color={colors.onBrandPrimary} weight="fill" />
            <Txt size="sm" style={{ color: colors.onBrandPrimary, opacity: 0.9 }}>
              {t("totalAvailable")}
            </Txt>
          </View>
          <Txt weight="bold" size="xxl" style={{ color: colors.onBrandPrimary }}>
            {formatAmount(walletQ.data?.total_available ?? 0)} {user?.currency ?? ""}
          </Txt>
          <Txt size="xs" style={{ color: colors.onBrandPrimary, opacity: 0.8 }}>
            {t("pending")}: {formatAmount(walletQ.data?.total_pending ?? 0)} {user?.currency ?? ""}
          </Txt>
        </Pressable>

        <View style={styles.group}>
          <Row icon={<Receipt size={22} color={colors.brandPrimary} weight="duotone" />} label={t("myOrders")} onPress={() => router.push("/orders")} testID="account-orders-link" />
          <View style={styles.sep} />
          <Row icon={<WalletIcon size={22} color={colors.brandPrimary} weight="duotone" />} label={t("myWallet")} onPress={() => router.push("/wallet")} testID="account-wallet-link" />
          <View style={styles.sep} />
          <Row icon={<Heart size={22} color={colors.brandPrimary} weight="duotone" />} label={`${t("favoritesTitle")} · ${favorites.length}`} onPress={() => router.push("/favorites")} testID="account-favorites-link" />
          <View style={styles.sep} />
          <Row icon={<Storefront size={22} color={colors.brandPrimary} weight="duotone" />} label={t("allShops")} onPress={() => router.push("/shops")} testID="account-shops-link" />
        </View>

        <Pressable testID="account-logout-button" style={styles.logout} onPress={logout}>
          <SignOut size={20} color={colors.error} weight="bold" />
          <Txt weight="semibold" size="base" color="error">
            {t("logout")}
          </Txt>
        </Pressable>
      </ScrollView>

      <ProfileMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAction={setAction}
        onLanguage={chooseLang}
        biometricEnabled={biometricEnabled}
        onToggleBiometric={toggleBiometric}
        deletionActive={deletionActive}
        onCancelDeletion={cancelDeletion}
      />
      <AccountActionSheet
        key={action ?? "none"}
        action={action}
        initialAddress={deliveryAddress}
        onClose={() => setAction(null)}
      />
    </View>
  );
}

function Info({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
      <Txt size="sm" color="muted">
        {label}
      </Txt>
      <Txt testID={testID} size="sm" weight="semibold" style={{ flex: 1, textAlign: "right" }} numberOfLines={2}>
        {value}
      </Txt>
    </View>
  );
}

function Row({ icon, label, onPress, testID }: { icon: React.ReactNode; label: string; onPress: () => void; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} style={styles.row} onPress={onPress}>
      {icon}
      <Txt weight="medium" size="base" style={{ flex: 1 }}>
        {label}
      </Txt>
      <CaretRight size={18} color={colors.muted} weight="bold" />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  logoBtn: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 44 },
  logo: { width: 40, height: 36 },
  badge: {
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
  clientCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  clientHead: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xs },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  walletCard: { backgroundColor: colors.brandPrimary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  walletHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  group: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  sep: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.lg },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));

import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CaretRight,
  Globe,
  Receipt,
  SignOut,
  User,
  Wallet as WalletIcon,
} from "phosphor-react-native";

import { useWallet } from "@/src/api/hooks";
import { Txt } from "@/src/components/Txt";
import { useI18n } from "@/src/i18n";
import { Lang } from "@/src/i18n/translations";
import { usesNativeTabs } from "@/src/navigation";
import { useAuth } from "@/src/store/auth";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { formatAmount } from "@/src/utils/format";

export default function AccountScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const walletQ = useWallet(!!user);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const langs: { code: Lang; label: string }[] = [
    { code: "fr", label: t("french") },
    { code: "en", label: t("english") },
    { code: "es", label: t("spanish") },
  ];

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Txt weight="bold" size="xl">
          {t("accountTitle")}
        </Txt>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + spacing.xl, gap: spacing.lg }}
      >
        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={28} color={colors.onBrandPrimary} weight="fill" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size="lg" numberOfLines={1}>
              {user?.name}
            </Txt>
            <Txt color="muted" size="sm" numberOfLines={1}>
              {user?.email}
            </Txt>
            {!!user?.country && (
              <Txt color="muted" size="xs" numberOfLines={1}>
                {user.country} · {user.currency}
              </Txt>
            )}
          </View>
        </View>

        {/* Wallet summary */}
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

        {/* Links */}
        <View style={styles.group}>
          <Row
            icon={<Receipt size={22} color={colors.brandPrimary} weight="duotone" />}
            label={t("myOrders")}
            onPress={() => router.push("/orders")}
            testID="account-orders-link"
          />
          <View style={styles.sep} />
          <Row
            icon={<WalletIcon size={22} color={colors.brandPrimary} weight="duotone" />}
            label={t("myWallet")}
            onPress={() => router.push("/wallet")}
            testID="account-wallet-link"
          />
        </View>

        {/* Language */}
        <View>
          <View style={styles.langHead}>
            <Globe size={18} color={colors.muted} weight="regular" />
            <Txt weight="semibold" size="base" color="muted">
              {t("language")}
            </Txt>
          </View>
          <View style={styles.langRow}>
            {langs.map((l) => {
              const active = lang === l.code;
              return (
                <Pressable
                  key={l.code}
                  testID={`lang-${l.code}`}
                  onPress={() => setLang(l.code)}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
                      borderColor: active ? colors.brandPrimary : colors.border,
                    },
                  ]}
                >
                  <Txt
                    weight={active ? "semibold" : "regular"}
                    size="base"
                    style={{ color: active ? colors.onBrandPrimary : colors.onSurface }}
                  >
                    {l.label}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Logout */}
        <Pressable testID="account-logout-button" style={styles.logout} onPress={logout}>
          <SignOut size={20} color={colors.error} weight="bold" />
          <Txt weight="semibold" size="base" color="error">
            {t("logout")}
          </Txt>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  walletCard: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
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
  langHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  langRow: { flexDirection: "row", gap: spacing.sm },
  langChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
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

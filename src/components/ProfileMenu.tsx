import React from "react";
import { Modal, Platform, Pressable, ScrollView, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Envelope, Fingerprint, Globe, Key, MapPin, Phone, Trash } from "phosphor-react-native";

import { useI18n } from "@/src/i18n";
import { Lang } from "@/src/i18n/translations";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { AccountAction } from "./AccountActionSheet";
import { Txt } from "./Txt";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAction: (a: Exclude<AccountAction, null>) => void;
  onLanguage: (l: Lang) => void;
  biometricEnabled: boolean;
  onToggleBiometric: () => void;
  deletionActive: boolean;
  onCancelDeletion: () => void;
};

/** Dropdown anchored top-left (under the logo) with every profile edit action. */
export function ProfileMenu({
  visible,
  onClose,
  onAction,
  onLanguage,
  biometricEnabled,
  onToggleBiometric,
  deletionActive,
  onCancelDeletion,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();

  const pick = (fn: () => void) => () => {
    onClose();
    fn();
  };

  const item = (
    testID: string,
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    danger = false,
  ) => (
    <Pressable testID={testID} style={styles.item} onPress={pick(onPress)}>
      {icon}
      <Txt size="base" weight="medium" color={danger ? "error" : "onSurface"} style={{ flex: 1 }}>
        {label}
      </Txt>
    </Pressable>
  );

  const ic = (I: any, danger = false) => (
    <I size={20} color={danger ? colors.error : colors.brandPrimary} weight="duotone" />
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable testID="profile-menu-backdrop" style={styles.backdrop} onPress={onClose}>
        <Pressable
          testID="profile-menu"
          style={[styles.menu, { top: insets.top + 52 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView bounces={false}>
            <Txt size="xs" weight="semibold" color="muted" style={styles.head}>
              {t("editProfile").toUpperCase()}
            </Txt>
            {item("menu-edit-address", ic(MapPin), t("editAddress"), () => onAction("address"))}
            {item("menu-change-password", ic(Key), t("changePassword"), () => onAction("password"))}
            {item("menu-change-email", ic(Envelope), t("changeEmail"), () => onAction("email"))}
            {item("menu-change-phone", ic(Phone), t("changePhone"), () => onAction("phone"))}

            <View style={styles.sep} />
            <View style={[styles.item, { paddingBottom: spacing.xs }]}>
              {ic(Globe)}
              <Txt size="base" weight="medium">
                {t("appLanguage")}
              </Txt>
            </View>
            <View style={styles.langRow}>
              {(["fr", "en", "es"] as Lang[]).map((l) => {
                const on = lang === l;
                return (
                  <Pressable
                    key={l}
                    testID={`menu-lang-${l}`}
                    onPress={() => onLanguage(l)}
                    style={[styles.langChip, on && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}
                  >
                    <Txt size="sm" weight="semibold" style={{ color: on ? colors.onBrandPrimary : colors.onSurface }}>
                      {l.toUpperCase()}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>

            {Platform.OS !== "web" && (
              <View style={styles.item}>
                {ic(Fingerprint)}
                <Txt size="base" weight="medium" style={{ flex: 1 }}>
                  {t("biometricLabel")}
                </Txt>
                <Switch
                  testID="menu-biometric-switch"
                  value={biometricEnabled}
                  onValueChange={onToggleBiometric}
                  trackColor={{ true: colors.brandPrimary, false: colors.border }}
                />
              </View>
            )}

            <View style={styles.sep} />
            {deletionActive
              ? item("menu-cancel-deletion", ic(Trash, true), t("cancelDeletion"), onCancelDeletion, true)
              : item("menu-delete-account", ic(Trash, true), t("deleteAccount"), () => onAction("deletion"), true)}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
  menu: {
    position: "absolute",
    left: spacing.md,
    width: 290,
    maxHeight: "75%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  head: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  sep: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.xs },
  langRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, paddingLeft: spacing.lg + 20 + spacing.md },
  langChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));

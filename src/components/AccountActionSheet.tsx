import React, { useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "phosphor-react-native";

import { ApiError, apiFetch } from "@/src/api/client";
import { useI18n } from "@/src/i18n";
import { useAuth } from "@/src/store/auth";
import { useSavedAddress } from "@/src/store/address";
import { fonts, fontSizes, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { Txt } from "./Txt";

export type AccountAction = "password" | "email" | "phone" | "deletion" | "address" | null;

export function AccountActionSheet({
  action,
  onClose,
  initialAddress = "",
}: {
  action: AccountAction;
  onClose: () => void;
  initialAddress?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { replaceToken, refreshUser } = useAuth();
  const { setAddress } = useSavedAddress();
  const [addr, setAddr] = useState(initialAddress);

  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [devCode, setDevCode] = useState("");
  const [code, setCode] = useState("");

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : t("errorGeneric"), "error");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = () =>
    run(async () => {
      if (next.length < 6) throw new ApiError(t("passwordMin"), 400);
      if (next !== confirm) throw new ApiError(t("passwordMismatch"), 400);
      const d = await apiFetch<{ message?: string; token?: string }>("/account/password", {
        method: "POST",
        body: { current_password: current, new_password: next },
      });
      if (d.token) await replaceToken(d.token);
      toast.show(d.message || t("saved"), "success");
      onClose();
    });

  const requestCode = () =>
    run(async () => {
      const d = await apiFetch<{ challenge_id: string; dev_code?: string; message?: string }>(
        "/account/contact/request",
        { method: "POST", body: { kind: action, value: next.trim(), current_password: current } },
      );
      setChallengeId(d.challenge_id);
      setDevCode(d.dev_code || "");
      toast.show(d.message || t("sendCode"), "info");
    });

  const confirmContact = () =>
    run(async () => {
      const d = await apiFetch<{ message?: string; token?: string }>("/account/contact/confirm", {
        method: "POST",
        body: { challenge_id: challengeId, code: code.trim() },
      });
      if (d.token) await replaceToken(d.token);
      await refreshUser();
      toast.show(d.message || t("saved"), "success");
      onClose();
    });

  const requestDeletion = () =>
    run(async () => {
      const d = await apiFetch<{ message?: string }>("/account/deletion", {
        method: "POST",
        body: { current_password: current, reason: "" },
      });
      queryClient.invalidateQueries({ queryKey: ["deletion"] });
      toast.show(d.message || t("saved"), "success");
      onClose();
    });

  const title =
    action === "address"
      ? t("editAddress")
      : action === "password"
      ? t("changePassword")
      : action === "email"
        ? t("changeEmail")
        : action === "phone"
          ? t("changePhone")
          : t("deleteAccount");

  const field = (label: string, value: string, onChange: (v: string) => void, testID: string, extra?: object) => (
    <View style={styles.field}>
      <Txt size="sm" weight="medium" color="onSurfaceTertiary">
        {label}
      </Txt>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...extra}
      />
    </View>
  );

  return (
    <Modal visible={!!action} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.head}>
            <Txt weight="bold" size="lg" style={{ flex: 1 }}>
              {title}
            </Txt>
            <Pressable testID="action-sheet-close" hitSlop={12} onPress={onClose}>
              <X size={24} color={colors.muted} weight="bold" />
            </Pressable>
          </View>
          <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.sm }}>
            {action === "address" && (
              <>
                {field(t("deliveryAddress"), addr, setAddr, "input-delivery-address", {
                  multiline: true,
                  autoCapitalize: "sentences",
                  placeholder: t("addressPlaceholder"),
                  style: [styles.input, { minHeight: 80, textAlignVertical: "top" }],
                })}
                <Button
                  label={t("saveAddress")}
                  onPress={() => {
                    setAddress(addr.trim());
                    toast.show(t("saved"), "success");
                    onClose();
                  }}
                  disabled={!addr.trim()}
                  testID="submit-address"
                />
              </>
            )}

            {action === "password" && (
              <>
                {field(t("currentPassword"), current, setCurrent, "input-current-password", { secureTextEntry: true })}
                {field(t("newPassword"), next, setNext, "input-new-password", { secureTextEntry: true })}
                {field(t("confirmNewPassword"), confirm, setConfirm, "input-confirm-new-password", { secureTextEntry: true })}
                <Button label={t("changePassword")} onPress={changePassword} loading={busy} testID="submit-password-change" />
              </>
            )}

            {(action === "email" || action === "phone") &&
              (!challengeId ? (
                <>
                  {field(action === "email" ? t("newEmail") : t("newPhone"), next, setNext, "input-new-contact", {
                    keyboardType: action === "email" ? "email-address" : "phone-pad",
                  })}
                  {field(t("currentPassword"), current, setCurrent, "input-contact-password", { secureTextEntry: true })}
                  <Button label={t("sendCode")} onPress={requestCode} loading={busy} testID="submit-contact-request" />
                </>
              ) : (
                <>
                  <Txt color="muted" size="sm">
                    {t("codeSentTo")} {next}.
                  </Txt>
                  {!!devCode && (
                    <Txt weight="bold" size="base" color="brandPrimary">
                      {t("testCode")} : {devCode}
                    </Txt>
                  )}
                  {field(t("verificationCode"), code, setCode, "input-contact-code", { keyboardType: "number-pad" })}
                  <Button label={t("confirmChange")} onPress={confirmContact} loading={busy} testID="submit-contact-confirm" />
                </>
              ))}

            {action === "deletion" && (
              <>
                <Txt color="muted" size="sm" style={{ lineHeight: 20 }}>
                  {t("deletionInfo")}
                </Txt>
                {field(t("currentPassword"), current, setCurrent, "input-deletion-password", { secureTextEntry: true })}
                <Button label={t("requestDeletion")} onPress={requestDeletion} loading={busy} testID="submit-deletion-request" />
              </>
            )}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  head: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  field: { gap: spacing.xs, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.onSurface,
  },
}));

import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fingerprint, Storefront } from "phosphor-react-native";

import { Button } from "@/src/components/Button";
import { Txt } from "@/src/components/Txt";
import { useToast } from "@/src/components/Toast";
import { useI18n } from "@/src/i18n";
import { ApiError, CustomerOnlyError, TwoFactorChallenge, useAuth } from "@/src/store/auth";
import { fonts, fontSizes, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1709809081557-78f803ce93a0?crop=entropy&cs=srgb&fm=jpg&w=1000&q=80";

export default function LoginScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, forgotPassword, verifyTwoFactor, biometricEnabled, loginWithBiometrics } =
    useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [code, setCode] = useState("");

  const isLogin = mode === "login";

  const showError = (e: unknown) => {
    if (e instanceof CustomerOnlyError) toast.show(t("customerOnlyNote"), "error");
    else if (e instanceof ApiError && e.message === "noSession") toast.show(t("noSession"), "error");
    else if (e instanceof ApiError) toast.show(e.message, "error");
    else toast.show(t("errorGeneric"), "error");
  };

  const submitCode = async () => {
    if (!challenge || !code.trim()) return;
    setBusy(true);
    try {
      await verifyTwoFactor(challenge.challenge_id, code);
      router.replace("/(tabs)");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const biometricSignIn = async () => {
    setBusy(true);
    try {
      if (await loginWithBiometrics()) router.replace("/(tabs)");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const onForgotPassword = async () => {
    if (!email.trim()) {
      toast.show(t("enterEmailFirst"), "info");
      return;
    }
    setForgotBusy(true);
    try {
      await forgotPassword(email);
      toast.show(t("forgotPasswordSent"), "success");
    } catch {
      toast.show(t("forgotPasswordSent"), "success");
    } finally {
      setForgotBusy(false);
    }
  };

  const submit = async () => {
    if (!email.trim() || !password || (!isLogin && !name.trim())) {
      toast.show(t("fillAllFields"), "error");
      return;
    }
    if (!isLogin && password.length < 6) {
      toast.show(t("passwordMin"), "error");
      return;
    }
    if (!isLogin && password !== confirm) {
      toast.show(t("passwordMismatch"), "error");
      return;
    }
    setBusy(true);
    try {
      if (isLogin) {
        const c = await signIn(email, password);
        if (c) {
          setChallenge(c);
          setCode("");
          return;
        }
      } else {
        await signUp(name, email, password, phone, country);
      }
      router.replace("/(tabs)");
    } catch (e) {
      if (e instanceof CustomerOnlyError) {
        toast.show(t("customerOnlyNote"), "error");
      } else if (e instanceof ApiError) {
        toast.show(e.status === 401 || e.status === 400 ? t("invalidCredentials") : e.message, "error");
      } else {
        toast.show(t("errorGeneric"), "error");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image source={{ uri: HERO }} style={styles.heroImg} contentFit="cover" transition={250} />
          <LinearGradient
            colors={["transparent", "rgba(31,28,24,0.35)", colors.surface]}
            style={styles.scrim}
          />
          <View style={[styles.brandBadge, { top: insets.top + spacing.lg }]}>
            <Storefront size={22} color={colors.onBrandPrimary} weight="fill" />
            <Txt weight="bold" size="lg" style={{ color: colors.onBrandPrimary }}>
              {t("appName")}
            </Txt>
          </View>
        </View>

        {challenge ? (
          <View style={styles.form}>
            <Txt weight="bold" size="xxl">
              {t("twoFactorTitle")}
            </Txt>
            <Txt color="muted" size="base" style={{ marginBottom: spacing.md }}>
              {t("twoFactorSub")} {challenge.channel || t("twoFactorChannel")}.
              {challenge.dev_code ? ` ${t("testCode")} : ${challenge.dev_code}` : ""}
            </Txt>
            <Field
              label={t("verificationCode")}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="123456"
              testID="input-2fa-code"
            />
            <Button label={t("verify")} onPress={submitCode} loading={busy} testID="verify-2fa-button" />
            <Button
              label={t("backToLogin")}
              variant="secondary"
              onPress={() => setChallenge(null)}
              testID="back-to-login-button"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ) : (
        <View style={styles.form}>
          <Txt weight="bold" size="xxl">
            {isLogin ? t("welcomeBack") : t("createAccount")}
          </Txt>
          <Txt color="muted" size="base" style={{ marginBottom: spacing.sm }}>
            {isLogin ? t("signInSubtitle") : t("signUpSubtitle")}
          </Txt>

          <View style={styles.customerPill}>
            <Txt size="xs" weight="semibold" color="onBrandTertiary">
              {t("customerOnly")}
            </Txt>
          </View>

          {!isLogin && (
            <Field
              label={t("fullName")}
              value={name}
              onChangeText={setName}
              placeholder="Awa Diop"
              testID="input-name"
            />
          )}
          <Field
            label={t("email")}
            value={email}
            onChangeText={setEmail}
            placeholder="client@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            testID="input-email"
          />
          {!isLogin && (
            <Field
              label={t("phone")}
              value={phone}
              onChangeText={setPhone}
              placeholder="+221 77 000 00 00"
              keyboardType="phone-pad"
              testID="input-phone"
            />
          )}
          {!isLogin && (
            <Field
              label={t("countryField")}
              value={country}
              onChangeText={setCountry}
              placeholder="Sénégal"
              testID="input-country"
            />
          )}
          <Field
            label={t("password")}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            testID="input-password"
          />
          {!isLogin && (
            <Field
              label={t("confirmPassword")}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              secureTextEntry
              testID="input-confirm-password"
            />
          )}

          {isLogin && (
            <Pressable
              testID="forgot-password-link"
              onPress={onForgotPassword}
              disabled={forgotBusy}
              hitSlop={8}
              style={styles.forgot}
            >
              <Txt size="sm" weight="semibold" color="brandPrimary">
                {forgotBusy ? t("loading") : t("forgotPassword")}
              </Txt>
            </Pressable>
          )}

          <Button
            label={isLogin ? t("login") : t("register")}
            onPress={submit}
            loading={busy}
            testID="auth-submit-button"
            style={{ marginTop: spacing.md }}
          />

          {isLogin && biometricEnabled && (
            <Button
              label={t("biometricLogin")}
              variant="secondary"
              onPress={biometricSignIn}
              icon={<Fingerprint size={20} color={colors.brandPrimary} weight="bold" />}
              testID="biometric-login-button"
              style={{ marginTop: spacing.sm }}
            />
          )}

          <Pressable
            testID="toggle-auth-mode"
            onPress={() => setMode(isLogin ? "register" : "login")}
            style={styles.toggle}
            hitSlop={8}
          >
            <Txt color="muted" size="base">
              {isLogin ? t("noAccount") : t("haveAccount")}{" "}
              <Txt color="brandPrimary" weight="semibold" size="base">
                {isLogin ? t("signUpLink") : t("signInLink")}
              </Txt>
            </Txt>
          </Pressable>
        </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

function Field({
  label,
  testID,
  ...rest
}: { label: string; testID?: string } & React.ComponentProps<typeof TextInput>) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Txt size="sm" weight="medium" color="onSurfaceTertiary">
        {label}
      </Txt>
      <TextInput
        testID={testID}
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...rest}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 260, width: "100%", backgroundColor: colors.surfaceTertiary },
  heroImg: { width: "100%", height: "100%" },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0 },
  brandBadge: {
    position: "absolute",
    left: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  form: { paddingHorizontal: spacing.lg, marginTop: -spacing.xl, gap: spacing.xs },
  customerPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  field: { gap: spacing.xs, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
  },
  toggle: { alignItems: "center", marginTop: spacing.lg, paddingVertical: spacing.sm },
  forgot: { alignSelf: "flex-end", paddingVertical: spacing.xs, marginTop: -spacing.xs, marginBottom: spacing.xs },
}));

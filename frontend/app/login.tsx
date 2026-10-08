import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Storefront } from "phosphor-react-native";

import { Button } from "@/src/components/Button";
import { Txt } from "@/src/components/Txt";
import { useToast } from "@/src/components/Toast";
import { useI18n } from "@/src/i18n";
import { ApiError, CustomerOnlyError, useAuth } from "@/src/store/auth";
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
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  const submit = async () => {
    if (!email.trim() || !password || (!isLogin && !name.trim())) {
      toast.show(t("fillAllFields"), "error");
      return;
    }
    setBusy(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(name, email, password, phone);
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
          <Field
            label={t("password")}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            testID="input-password"
          />

          <Button
            label={isLogin ? t("login") : t("register")}
            onPress={submit}
            loading={busy}
            testID="auth-submit-button"
            style={{ marginTop: spacing.md }}
          />

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
}));

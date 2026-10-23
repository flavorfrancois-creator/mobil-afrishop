import React, { useState } from "react";
import { Alert, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { Card, FormField, PrimaryButton, palette } from "../components/UI";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80";

export function AuthScreen() {
  const {
    login,
    register,
    requestPasswordReset,
    biometricEnabled,
    loginWithBiometrics,
  } = useApp();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirm: "",
    invite_code: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");

  const updateLogin = (key, value) =>
    setLoginForm((prev) => ({ ...prev, [key]: value }));
  const updateRegister = (key, value) =>
    setRegisterForm((prev) => ({ ...prev, [key]: value }));

  async function submitLogin() {
    setLoading(true);
    try {
      await login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
    } catch (error) {
      Alert.alert("Connexion impossible", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitBiometricLogin() {
    setLoading(true);
    try {
      await loginWithBiometrics();
    } catch (error) {
      Alert.alert("Connexion biométrique impossible", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister() {
    if (registerForm.password !== registerForm.confirm) {
      Alert.alert("AfriMarket", "Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
        country: registerForm.country.trim(),
        password: registerForm.password,
        invite_code: registerForm.invite_code.trim() || undefined,
        role: "CLIENT",
      });
    } catch (error) {
      Alert.alert("Creation impossible", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitForgot() {
    setLoading(true);
    try {
      await requestPasswordReset(forgotEmail.trim());
      Alert.alert(
        "AfriMarket",
        "Si cet e-mail existe, un lien de reinitialisation a ete envoye."
      );
      setMode("login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.hero}>
        <View style={styles.overlay} />
        <View style={styles.heroContent}>
          <Image source={require("../../assets/afrimarket-logo.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>AfriMarket</Text>
          <Text style={styles.tagline}>
            Une vraie marketplace mobile pour vos clients: produits, boutiques,
            commandes, portefeuille et retraits.
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.body}>
        <View style={styles.switcher}>
          {[
            ["login", "Connexion"],
            ["register", "Compte"],
            ["forgot", "Mot de passe"],
          ].map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[styles.switchPill, mode === value && styles.switchPillActive]}
              onPress={() => setMode(value)}
            >
              <Text
                style={[
                  styles.switchPillText,
                  mode === value && styles.switchPillTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === "login" ? (
          <Card>
            <Text style={styles.title}>Bon retour</Text>
            <Text style={styles.subtitle}>
              Connectez-vous et arrivez directement sur la marketplace.
            </Text>
            <FormField
              label="E-mail"
              keyboardType="email-address"
              value={loginForm.email}
              onChangeText={(value) => updateLogin("email", value)}
            />
            <FormField
              label="Mot de passe"
              secureTextEntry
              value={loginForm.password}
              onChangeText={(value) => updateLogin("password", value)}
            />
            <PrimaryButton
              title={loading ? "Connexion..." : "Se connecter"}
              onPress={submitLogin}
              disabled={loading}
            />
            {biometricEnabled ? (
              <PrimaryButton
                title="Se connecter avec mon empreinte"
                onPress={submitBiometricLogin}
                disabled={loading}
                tone="muted"
              />
            ) : null}
          </Card>
        ) : null}

        {mode === "register" ? (
          <Card>
            <Text style={styles.title}>Creer un compte client</Text>
            <Text style={styles.subtitle}>
              Rejoignez AfriMarket et achetez depuis vos boutiques preferees.
            </Text>
            <FormField
              label="Nom complet"
              autoCapitalize="words"
              value={registerForm.name}
              onChangeText={(value) => updateRegister("name", value)}
            />
            <FormField
              label="E-mail"
              keyboardType="email-address"
              value={registerForm.email}
              onChangeText={(value) => updateRegister("email", value)}
            />
            <FormField
              label="Telephone"
              keyboardType="phone-pad"
              value={registerForm.phone}
              onChangeText={(value) => updateRegister("phone", value)}
            />
            <FormField
              label="Pays"
              autoCapitalize="words"
              value={registerForm.country}
              onChangeText={(value) => updateRegister("country", value)}
            />
            <FormField
              label="Mot de passe"
              secureTextEntry
              value={registerForm.password}
              onChangeText={(value) => updateRegister("password", value)}
            />
            <FormField
              label="Confirmer"
              secureTextEntry
              value={registerForm.confirm}
              onChangeText={(value) => updateRegister("confirm", value)}
            />
            <FormField
              label="Code invitation (optionnel)"
              autoCapitalize="characters"
              value={registerForm.invite_code}
              onChangeText={(value) => updateRegister("invite_code", value)}
            />
            <PrimaryButton
              title={loading ? "Creation..." : "Creer mon compte"}
              onPress={submitRegister}
              disabled={loading}
            />
          </Card>
        ) : null}

        {mode === "forgot" ? (
          <Card>
            <Text style={styles.title}>Mot de passe oublie</Text>
            <Text style={styles.subtitle}>
              Nous envoyons un lien de reinitialisation a votre adresse e-mail.
            </Text>
            <FormField
              label="E-mail"
              keyboardType="email-address"
              value={forgotEmail}
              onChangeText={setForgotEmail}
            />
            <PrimaryButton
              title={loading ? "Envoi..." : "Envoyer le lien"}
              onPress={submitForgot}
              disabled={loading}
            />
          </Card>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.background,
  },
  hero: {
    height: 240,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  heroContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  brand: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900",
  },
  logo: {
    width: 84,
    height: 70,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    marginBottom: 10,
  },
  tagline: {
    color: "#e2e8f0",
    marginTop: 8,
    lineHeight: 20,
    fontSize: 14,
    maxWidth: 320,
  },
  body: {
    flex: 1,
    marginTop: -20,
    paddingHorizontal: 16,
  },
  switcher: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  switchPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  switchPillActive: {
    backgroundColor: "#ffffff",
  },
  switchPillText: {
    color: palette.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  switchPillTextActive: {
    color: palette.text,
  },
  title: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: palette.muted,
    marginBottom: 14,
    lineHeight: 19,
  },
});

import React, { useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "./api";
import { useApp } from "./AppContext";
import { Button, Card, Field, Screen, colors } from "./ui";

export function AuthScreen() {
  const {
    login,
    verifyTwoFactor,
    register,
    biometricEnabled,
    loginWithBiometrics,
  } = useApp();
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [twoFactor, setTwoFactor] = useState(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    country: "",
    code: "",
    confirm: "",
  });
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function submitLogin() {
    setBusy(true);
    try {
      const data = await login({ email: form.email.trim(), password: form.password });
      if (data.require_2fa) setTwoFactor(data);
    } catch (error) {
      Alert.alert("Connexion impossible", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitTwoFactor() {
    setBusy(true);
    try {
      await verifyTwoFactor(twoFactor.challenge_id, form.code.trim());
    } catch (error) {
      Alert.alert("Vérification impossible", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitRegister() {
    if (form.password.length < 6) {
      Alert.alert("Inscription", "Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert("Inscription", "Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const data = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        password: form.password,
      });
      Alert.alert("Bienvenue sur AfriMarket", data.message || "Votre compte est créé.");
    } catch (error) {
      Alert.alert("Inscription impossible", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitForgotPassword() {
    setBusy(true);
    try {
      const data = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: { email: form.email.trim() },
      });
      Alert.alert("Réinitialisation", data.message);
      setMode("login");
    } catch (error) {
      Alert.alert("Réinitialisation impossible", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function biometricLogin() {
    setBusy(true);
    try {
      await loginWithBiometrics();
    } catch (error) {
      Alert.alert("Connexion par empreinte", error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Screen>
        <View style={{ alignItems: "center", paddingVertical: 18 }}>
          <Image
            source={require("../assets/afrimarket-logo.png")}
            style={{ width: 130, height: 108 }}
            resizeMode="contain"
          />
          <Text style={{ color: colors.primaryDark, fontWeight: "900", fontSize: 28 }}>
            AfriMarket
          </Text>
          <Text style={{ color: colors.muted, textAlign: "center", marginTop: 6 }}>
            Les produits et boutiques d'Afrique, dans votre poche.
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          {[
            ["login", "Connexion"],
            ["register", "Créer un compte"],
            ["forgot", "Mot de passe oublié"],
          ].map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => {
                setMode(value);
                setTwoFactor(null);
              }}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 10,
                borderBottomWidth: mode === value ? 3 : 1,
                borderBottomColor: mode === value ? colors.primary : colors.line,
              }}
            >
              <Text style={{ color: mode === value ? colors.primary : colors.muted, fontWeight: "800", fontSize: 12 }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {mode === "login" ? (
          <Card>
            <Text style={{ fontSize: 21, fontWeight: "900", color: colors.ink, marginBottom: 6 }}>
              {twoFactor ? "Vérification de sécurité" : "Bon retour"}
            </Text>
            {twoFactor ? (
              <>
                <Text style={{ color: colors.muted, marginBottom: 16 }}>
                  Saisissez le code envoyé par {twoFactor.channel || "votre méthode de sécurité"}.
                  {twoFactor.dev_code ? ` Code de test : ${twoFactor.dev_code}` : ""}
                </Text>
                <Field label="Code de vérification" value={form.code} onChangeText={(value) => set("code", value)} keyboardType="number-pad" />
                <Button title={busy ? "Vérification..." : "Confirmer"} onPress={submitTwoFactor} disabled={busy} />
                <Button title="Retour à la connexion" variant="secondary" onPress={() => setTwoFactor(null)} />
              </>
            ) : (
              <>
                <Field label="Adresse e-mail" value={form.email} onChangeText={(value) => set("email", value)} keyboardType="email-address" autoComplete="email" />
                <Field label="Mot de passe" value={form.password} onChangeText={(value) => set("password", value)} secureTextEntry autoComplete="current-password" />
                <Button title={busy ? "Connexion..." : "Se connecter"} onPress={submitLogin} disabled={busy} />
                {biometricEnabled ? (
                  <Button title="Connexion avec empreinte" variant="secondary" onPress={biometricLogin} disabled={busy} />
                ) : null}
              </>
            )}
          </Card>
        ) : null}
        {mode === "register" ? (
          <Card>
            <Text style={{ fontSize: 21, fontWeight: "900", color: colors.ink, marginBottom: 12 }}>
              Créer un compte client
            </Text>
            <Field label="Nom complet" value={form.name} onChangeText={(value) => set("name", value)} autoCapitalize="words" />
            <Field label="Adresse e-mail" value={form.email} onChangeText={(value) => set("email", value)} keyboardType="email-address" />
            <Field label="Téléphone" value={form.phone} onChangeText={(value) => set("phone", value)} keyboardType="phone-pad" />
            <Field label="Pays" value={form.country} onChangeText={(value) => set("country", value)} autoCapitalize="words" />
            <Field label="Mot de passe (6 caractères minimum)" value={form.password} onChangeText={(value) => set("password", value)} secureTextEntry />
            <Field label="Confirmer le mot de passe" value={form.confirm} onChangeText={(value) => set("confirm", value)} secureTextEntry />
            <Button title={busy ? "Création..." : "Créer mon compte"} onPress={submitRegister} disabled={busy} />
          </Card>
        ) : null}
        {mode === "forgot" ? (
          <Card>
            <Text style={{ fontSize: 21, fontWeight: "900", color: colors.ink, marginBottom: 6 }}>
              Réinitialiser le mot de passe
            </Text>
            <Text style={{ color: colors.muted, marginBottom: 14 }}>
              Nous vous enverrons un lien à l'adresse e-mail associée au compte.
            </Text>
            <Field label="Adresse e-mail" value={form.email} onChangeText={(value) => set("email", value)} keyboardType="email-address" />
            <Button title={busy ? "Envoi..." : "Envoyer le lien"} onPress={submitForgotPassword} disabled={busy} />
          </Card>
        ) : null}
      </Screen>
    </SafeAreaView>
  );
}

import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "./AppContext";
import { Button, Card, Field, Heading, Row, Screen, colors } from "./ui";

const ACTIVE_DELETION_STATUSES = ["PENDING", "AWAITING_USER"];

export function AccountScreen({ navigation }) {
  const {
    user,
    requestMain,
    refreshUser,
    setSession,
    setLanguage,
    biometricEnabled,
    enableBiometrics,
    disableBiometrics,
    logout,
    favorites,
  } = useApp();
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [latestOrder, setLatestOrder] = useState(null);
  const [deletion, setDeletion] = useState(null);
  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [contact, setContact] = useState({
    value: "",
    currentPassword: "",
    challengeId: "",
    code: "",
    devCode: "",
  });
  const [deletionPassword, setDeletionPassword] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      requestMain("/orders/mine"),
      requestMain("/account/deletion"),
    ]).then(([ordersResult, deletionResult]) => {
      if (!active) return;
      if (ordersResult.status === "fulfilled") {
        setLatestOrder(ordersResult.value.orders?.[0] || null);
      } else {
        Alert.alert("Adresse de livraison", ordersResult.reason.message);
      }
      if (deletionResult.status === "fulfilled") {
        setDeletion(deletionResult.value.request || null);
      } else {
        Alert.alert("Demande de suppression", deletionResult.reason.message);
      }
    });
    return () => { active = false; };
  }, [requestMain]);

  function openAction(nextAction) {
    setAction(nextAction);
    setPassword({ current: "", next: "", confirm: "" });
    setContact({ value: "", currentPassword: "", challengeId: "", code: "", devCode: "" });
    setDeletionPassword("");
  }

  async function changePassword() {
    if (password.next.length < 6) {
      Alert.alert("Mot de passe", "Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password.next !== password.confirm) {
      Alert.alert("Mot de passe", "Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const data = await requestMain("/account/password", {
        method: "POST",
        body: { current_password: password.current, new_password: password.next },
      });
      if (data.token) await setSession(data.token, user);
      setAction("");
      Alert.alert("AfriMarket", data.message || "Mot de passe modifié.");
    } catch (error) {
      Alert.alert("Modification impossible", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function requestContactCode() {
    setBusy(true);
    try {
      const data = await requestMain("/account/contact/request", {
        method: "POST",
        body: {
          kind: action,
          value: contact.value.trim(),
          current_password: contact.currentPassword,
        },
      });
      setContact((current) => ({
        ...current,
        challengeId: data.challenge_id,
        devCode: data.dev_code || "",
      }));
      Alert.alert("Code envoyé", data.message || "Saisissez le code de confirmation.");
    } catch (error) {
      Alert.alert("Coordonnées", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmContact() {
    setBusy(true);
    try {
      const data = await requestMain("/account/contact/confirm", {
        method: "POST",
        body: { challenge_id: contact.challengeId, code: contact.code.trim() },
      });
      if (data.token) await setSession(data.token, user);
      await refreshUser(data.token);
      setAction("");
      Alert.alert("AfriMarket", data.message || "Coordonnées modifiées.");
    } catch (error) {
      Alert.alert("Confirmation impossible", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function requestDeletion() {
    setBusy(true);
    try {
      const data = await requestMain("/account/deletion", {
        method: "POST",
        body: { current_password: deletionPassword, reason: "" },
      });
      setDeletion(data.request || null);
      setAction("");
      Alert.alert("Demande envoyée", data.message);
    } catch (error) {
      Alert.alert("Demande impossible", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelDeletion() {
    setBusy(true);
    try {
      const data = await requestMain("/account/deletion", { method: "DELETE" });
      setDeletion(null);
      Alert.alert("AfriMarket", data.message || "Demande annulée.");
    } catch (error) {
      Alert.alert("Annulation impossible", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function chooseLanguage(language) {
    setBusy(true);
    try {
      await setLanguage(language);
      setAction("");
    } catch (error) {
      Alert.alert("Langue", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleBiometrics() {
    setBusy(true);
    try {
      if (biometricEnabled) {
        await disableBiometrics();
        Alert.alert("AfriMarket", "Connexion par empreinte désactivée.");
      } else if (await enableBiometrics()) {
        Alert.alert("AfriMarket", "Connexion par empreinte activée sur cet appareil.");
      }
    } catch (error) {
      Alert.alert("Empreinte digitale", error.message);
    } finally {
      setBusy(false);
    }
  }

  const actions = [
    ["password", "Mot de passe"],
    ["email", "E-mail"],
    ["phone", "Téléphone"],
    ["language", "Langue"],
    ["biometric", biometricEnabled ? "Empreinte active" : "Empreinte"],
    [
      "deletion",
      ACTIVE_DELETION_STATUSES.includes(deletion?.status)
        ? "Suppression en cours"
        : "Supprimer le compte",
    ],
  ];

  return (
    <Screen>
      <Card style={{ backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }}>
        <Text style={{ color: "#cce7d8", fontWeight: "700" }}>MON COMPTE</Text>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 6 }}>
          {user?.name || "Client AfriMarket"}
        </Text>
        <Text style={{ color: "#dbece1", marginTop: 5 }}>{user?.email || ""}</Text>
      </Card>

      <Card>
        <Heading
          title="Gérer mon compte"
          subtitle="Faites défiler pour voir les options."
          right={
            <ScrollView horizontal style={{ width: 150, flexGrow: 0 }} showsHorizontalScrollIndicator={false}>
              {actions.map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => key === "biometric" ? toggleBiometrics() : openAction(key)}
                  disabled={busy}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: colors.mint,
                    borderRadius: 99,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: colors.primaryDark, fontWeight: "800", fontSize: 12 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          }
        />
      </Card>

      <Card>
        <Heading title="Mes informations" subtitle="Coordonnées et livraison" />
        <Row label="Nom" value={user?.name || "—"} />
        <Row label="E-mail" value={user?.email || "—"} />
        <Row label="Téléphone" value={user?.phone || "—"} />
        <Row
          label="Dernière adresse de livraison"
          value={latestOrder?.address || "Aucune adresse enregistrée"}
        />
        <Row label="Pays" value={user?.country || "—"} />
        <Row label="Devise" value={user?.currency || "—"} />
        <Row label="Langue" value={(user?.language || "fr").toUpperCase()} />
        {deletion ? <Row label="Suppression du compte" value={deletion.status} /> : null}
        {ACTIVE_DELETION_STATUSES.includes(deletion?.status) ? (
          <Button title="Annuler la demande de suppression" variant="secondary" onPress={cancelDeletion} disabled={busy} />
        ) : null}
      </Card>

      <Card>
        <Heading title="Espace client" />
        <Button title={`Mes favoris · ${favorites.length}`} variant="secondary" onPress={() => navigation.getParent()?.navigate("Favoris")} />
        <Button title="Mon portefeuille" variant="secondary" onPress={() => navigation.getParent()?.navigate("Portefeuille")} />
        <Button title="Se déconnecter" variant="danger" onPress={() => logout().catch((error) => Alert.alert("Déconnexion", error.message))} />
      </Card>

      <Modal visible={!!action} animationType="slide" onRequestClose={() => setAction("")}>
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <View style={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: colors.ink, fontSize: 20, fontWeight: "900", flex: 1 }}>
              {action === "password" ? "Changer le mot de passe"
                : action === "email" ? "Changer l'adresse e-mail"
                  : action === "phone" ? "Changer le téléphone"
                    : action === "language" ? "Langue de l'application"
                      : "Supprimer mon compte"}
            </Text>
            <TouchableOpacity onPress={() => setAction("")} accessibilityLabel="Fermer">
              <Ionicons name="close-circle-outline" size={28} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
            {action === "password" ? (
              <Card>
                <Field label="Mot de passe actuel" value={password.current} onChangeText={(value) => setPassword((current) => ({ ...current, current: value }))} secureTextEntry />
                <Field label="Nouveau mot de passe" value={password.next} onChangeText={(value) => setPassword((current) => ({ ...current, next: value }))} secureTextEntry />
                <Field label="Confirmer le nouveau mot de passe" value={password.confirm} onChangeText={(value) => setPassword((current) => ({ ...current, confirm: value }))} secureTextEntry />
                <Button title={busy ? "Enregistrement..." : "Modifier le mot de passe"} onPress={changePassword} disabled={busy} />
              </Card>
            ) : null}
            {action === "email" || action === "phone" ? (
              <Card>
                {!contact.challengeId ? (
                  <>
                    <Field
                      label={action === "email" ? "Nouvelle adresse e-mail" : "Nouveau numéro"}
                      value={contact.value}
                      onChangeText={(value) => setContact((current) => ({ ...current, value }))}
                      keyboardType={action === "email" ? "email-address" : "phone-pad"}
                    />
                    <Field label="Mot de passe actuel" value={contact.currentPassword} onChangeText={(value) => setContact((current) => ({ ...current, currentPassword: value }))} secureTextEntry />
                    <Button title={busy ? "Envoi..." : "Envoyer le code de confirmation"} onPress={requestContactCode} disabled={busy} />
                  </>
                ) : (
                  <>
                    <Text style={{ color: colors.muted, marginBottom: 12 }}>
                      Saisissez le code reçu sur {contact.value}.
                    </Text>
                    {contact.devCode ? (
                      <Text style={{ color: colors.primary, fontWeight: "900", marginBottom: 12 }}>
                        Code de test : {contact.devCode}
                      </Text>
                    ) : null}
                    <Field label="Code de confirmation" value={contact.code} onChangeText={(value) => setContact((current) => ({ ...current, code: value }))} keyboardType="number-pad" />
                    <Button title={busy ? "Vérification..." : "Confirmer le changement"} onPress={confirmContact} disabled={busy} />
                  </>
                )}
              </Card>
            ) : null}
            {action === "language" ? (
              <Card>
                <Text style={{ color: colors.muted, marginBottom: 12 }}>
                  Votre choix est enregistré sur votre compte AfriMarket.
                </Text>
                {[
                  ["fr", "Français"],
                  ["en", "English"],
                  ["es", "Español"],
                ].map(([language, label]) => (
                  <Button
                    key={language}
                    title={`${(user?.language || "fr") === language ? "✓ " : ""}${label}`}
                    variant={(user?.language || "fr") === language ? "primary" : "secondary"}
                    onPress={() => chooseLanguage(language)}
                    disabled={busy}
                  />
                ))}
              </Card>
            ) : null}
            {action === "deletion" ? (
              <Card>
                <Text style={{ color: colors.muted, lineHeight: 21 }}>
                  La suppression est soumise à l'approbation de deux administrateurs et à une confirmation par e-mail. Votre compte ne sera pas supprimé immédiatement.
                </Text>
                <Field label="Mot de passe actuel" value={deletionPassword} onChangeText={setDeletionPassword} secureTextEntry />
                <Button title={busy ? "Envoi..." : "Demander la suppression"} variant="danger" onPress={requestDeletion} disabled={busy} />
              </Card>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

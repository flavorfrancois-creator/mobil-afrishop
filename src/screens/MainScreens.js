import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { formatMoney } from "../lib/api";
import {
  Card,
  Chip,
  EmptyState,
  FormField,
  HeroCard,
  KeyValue,
  ListCard,
  LoadingState,
  PrimaryButton,
  Screen,
  SectionHeader,
  SecondaryButton,
  StatsRow,
  palette,
} from "../components/UI";

function ProductRow({ product, onOpen, onAdd, onToggleFavorite, favorite }) {
  return (
    <TouchableOpacity onPress={onOpen} activeOpacity={0.88}>
      <ListCard
        title={product.name}
        subtitle={product.shop_name || "AfriMarket"}
        extra={formatMoney(
          product.is_promo ? product.promo_price : product.display_price,
          product.currency
        )}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
          <Text style={{ color: palette.muted, flex: 1 }}>
            {product.distance_km !== undefined &&
            product.distance_km !== null &&
            isFinite(product.distance_km)
              ? `${Number(product.distance_km).toFixed(1)} km • `
              : ""}
            {product.category || "Marketplace"}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={onToggleFavorite}>
              <Ionicons
                name={favorite ? "heart" : "heart-outline"}
                size={22}
                color={favorite ? palette.danger : palette.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onAdd}>
              <Ionicons name="add-circle" size={24} color={palette.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ListCard>
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation }) {
  const { user, cartCount, favorites, requestMobileApi, addToCart, toggleFavorite } = useApp();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [productData, shopData] = await Promise.all([
        requestMobileApi("/products"),
        requestMobileApi("/shops"),
      ]);
      setProducts(productData.products || []);
      setShops(shopData.shops || []);
    } catch (error) {
      Alert.alert("AfriMarket", error.message);
    } finally {
      setLoading(false);
    }
  }, [requestMobileApi]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <HeroCard
        title={`Bonjour ${user?.name?.split(" ")[0] || "Client"}`}
        subtitle="Vous arrivez directement sur la marketplace apres connexion."
        footer={`Pays: ${user?.country || "Non renseigne"} • Monnaie: ${user?.currency || "N/A"}`}
      />

      <StatsRow
        items={[
          { label: "Produits", value: products.length },
          { label: "Boutiques", value: shops.length },
          { label: "Panier", value: cartCount },
          { label: "Favoris", value: favorites.length },
        ]}
      />

      <Card>
        <SectionHeader title="Actions rapides" />
        <PrimaryButton
          title="Explorer les produits"
          onPress={() => navigation.navigate("Products")}
        />
        <PrimaryButton
          title="Voir mes commandes"
          onPress={() => navigation.navigate("Orders")}
          tone="muted"
        />
        <SecondaryButton
          title="Mes verifications"
          onPress={() => navigation.getParent().navigate("Verify")}
        />
      </Card>

      {loading ? <LoadingState label="Chargement de la marketplace..." /> : null}

      {!loading ? (
        <>
          <Card>
            <SectionHeader
              title="Produits a la une"
              right={
                <TouchableOpacity onPress={() => navigation.navigate("Products")}>
                  <Text style={{ color: palette.primary, fontWeight: "700" }}>Tout voir</Text>
                </TouchableOpacity>
              }
            />
            {!products.length ? (
              <EmptyState title="Aucun produit disponible" />
            ) : (
              products.slice(0, 4).map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  favorite={favorites.some((item) => item.id === product.id)}
                  onOpen={() =>
                    navigation.getParent().navigate("ProductDetail", {
                      productId: product.id,
                    })
                  }
                  onAdd={async () => {
                    await addToCart(product);
                    Alert.alert("AfriMarket", "Produit ajoute au panier.");
                  }}
                  onToggleFavorite={async () => {
                    await toggleFavorite(product);
                  }}
                />
              ))
            )}
          </Card>

          <Card>
            <SectionHeader
              title="Boutiques proches"
              right={
                <TouchableOpacity onPress={() => navigation.navigate("Shops")}>
                  <Text style={{ color: palette.primary, fontWeight: "700" }}>Tout voir</Text>
                </TouchableOpacity>
              }
            />
            {!shops.length ? (
              <EmptyState title="Aucune boutique disponible" />
            ) : (
              shops.slice(0, 4).map((shop) => (
                <ListCard
                  key={shop.id}
                  title={shop.name}
                  subtitle={[shop.city, shop.country].filter(Boolean).join(", ")}
                  extra={
                    shop.distance_km !== undefined &&
                    shop.distance_km !== null &&
                    isFinite(shop.distance_km)
                      ? `${Number(shop.distance_km).toFixed(1)} km`
                      : ""
                  }
                  onPress={() =>
                    navigation.getParent().navigate("ShopDetail", {
                      shopId: shop.id,
                    })
                  }
                />
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

export function ProductsScreen({ navigation }) {
  const { requestMainApi, addToCart, favorites, toggleFavorite } = useApp();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [promoOnly, setPromoOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = [];
      if (query.trim()) params.push(`q=${encodeURIComponent(query.trim())}`);
      if (category.trim()) {
        params.push(`category=${encodeURIComponent(category.trim())}`);
      }
      if (promoOnly) params.push("promo=true");
      const data = await requestMainApi(`/products${params.length ? `?${params.join("&")}` : ""}`);
      setProducts(data.products || []);
    } catch (error) {
      Alert.alert("Produits", error.message);
    } finally {
      setLoading(false);
    }
  }, [category, promoOnly, query, requestMainApi]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const values = products.map((item) => item.category).filter(Boolean);
    return [...new Set(values)].slice(0, 8);
  }, [products]);

  return (
    <Screen>
      <Card>
        <SectionHeader title="Recherche produits" subtitle="Marketplace AfriMarket" />
        <FormField
          label="Recherche"
          value={query}
          onChangeText={setQuery}
          placeholder="Nom du produit..."
        />
        <FormField
          label="Categorie"
          value={category}
          onChangeText={setCategory}
          placeholder="Categorie"
        />
        <PrimaryButton title="Rafraichir" onPress={load} tone="muted" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
          {categories.map((item) => (
            <Chip
              key={item}
              label={item}
              active={item === category}
              onPress={() => setCategory(item === category ? "" : item)}
            />
          ))}
          <Chip
            label="Promotions"
            active={promoOnly}
            onPress={() => setPromoOnly((value) => !value)}
          />
        </View>
      </Card>

      {loading ? <LoadingState label="Chargement des produits..." /> : null}

      {!loading && !products.length ? (
        <EmptyState title="Aucun produit trouve" description="Essayez une autre recherche ou categorie." />
      ) : null}

      {!loading
        ? products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              favorite={favorites.some((item) => item.id === product.id)}
              onOpen={() =>
                navigation.getParent().navigate("ProductDetail", {
                  productId: product.id,
                })
              }
              onAdd={async () => {
                await addToCart(product);
                Alert.alert("AfriMarket", "Produit ajoute au panier.");
              }}
              onToggleFavorite={async () => {
                await toggleFavorite(product);
              }}
            />
          ))
        : null}
    </Screen>
  );
}

export function ShopsScreen({ navigation }) {
  const { requestMainApi } = useApp();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestMainApi("/shops");
      setShops(data.shops || []);
    } catch (error) {
      Alert.alert("Boutiques", error.message);
    } finally {
      setLoading(false);
    }
  }, [requestMainApi]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredShops = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((shop) =>
      [shop.name, shop.city, shop.country]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [query, shops]);

  return (
    <Screen>
      <Card>
        <SectionHeader title="Boutiques" subtitle="Choisissez une boutique proche de vous." />
        <FormField
          label="Recherche"
          value={query}
          onChangeText={setQuery}
          placeholder="Nom ou ville"
        />
        <PrimaryButton title="Rafraichir" onPress={load} tone="muted" />
      </Card>

      {loading ? <LoadingState label="Chargement des boutiques..." /> : null}

      {!loading && !filteredShops.length ? (
        <EmptyState title="Aucune boutique disponible" />
      ) : null}

      {!loading
        ? filteredShops.map((shop) => (
            <ListCard
              key={shop.id}
              title={shop.name}
              subtitle={[shop.city, shop.country].filter(Boolean).join(", ")}
              extra={
                shop.distance_km !== undefined &&
                shop.distance_km !== null &&
                isFinite(shop.distance_km)
                  ? `${Number(shop.distance_km).toFixed(1)} km`
                  : shop.currency || ""
              }
              onPress={() =>
                navigation.getParent().navigate("ShopDetail", { shopId: shop.id })
              }
            />
          ))
        : null}
    </Screen>
  );
}

export function OrdersScreen() {
  const { requestMainApi } = useApp();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestMainApi("/orders/mine");
      setOrders(data.orders || []);
    } catch (error) {
      Alert.alert("Commandes", error.message);
    } finally {
      setLoading(false);
    }
  }, [requestMainApi]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmReceipt(code) {
    setSubmitting(true);
    try {
      const data = await requestMainApi("/orders/confirm-by-tracking", {
        method: "POST",
        body: { code },
      });
      Alert.alert("AfriMarket", `${data.message}${data.ref ? ` (${data.ref})` : ""}`);
      load();
    } catch (error) {
      Alert.alert("Reception", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Card>
        <SectionHeader title="Mes commandes" subtitle="Suivi, references et reception." />
        <PrimaryButton title="Rafraichir" onPress={load} tone="muted" />
      </Card>

      {loading ? <LoadingState label="Chargement des commandes..." /> : null}

      {!loading && !orders.length ? (
        <EmptyState title="Aucune commande pour le moment" />
      ) : null}

      {!loading
        ? orders.map((order) => (
            <ListCard
              key={order.id}
              title={order.ref}
              subtitle={`${order.shop_name} • ${order.created_at?.slice(0, 10)}`}
              extra={formatMoney(order.total, order.currency)}
            >
              <KeyValue label="Statut" value={order.status} />
              <KeyValue
                label="Reception"
                value={order.delivered_confirmed ? "Confirmee" : "En attente"}
                tone={order.delivered_confirmed ? "success" : "default"}
              />
              {order.tracking_number ? (
                <SecondaryButton
                  title={submitting ? "Confirmation..." : `Confirmer ${order.tracking_number}`}
                  onPress={() => confirmReceipt(order.tracking_number)}
                  disabled={submitting}
                />
              ) : null}
            </ListCard>
          ))
        : null}
    </Screen>
  );
}

export function ProfileScreen({ navigation, user, onLogout }) {
  const {
    requestMainApi,
    updateSession,
    refreshUser,
    setLanguage,
    biometricEnabled,
    enableBiometricLogin,
    disableBiometricLogin,
  } = useApp();
  const [accountAction, setAccountAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [latestOrder, setLatestOrder] = useState(null);
  const [deletionRequest, setDeletionRequest] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [contactForm, setContactForm] = useState({
    value: "",
    current_password: "",
    challenge_id: "",
    code: "",
    dev_code: "",
  });
  const [deletionPassword, setDeletionPassword] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      requestMainApi("/orders/mine"),
      requestMainApi("/account/deletion"),
    ]).then(([ordersResult, deletionResult]) => {
      if (!mounted) return;
      if (ordersResult.status === "fulfilled") {
        setLatestOrder(ordersResult.value.orders?.[0] || null);
      } else {
        Alert.alert("Adresse", ordersResult.reason.message);
      }
      if (deletionResult.status === "fulfilled") {
        setDeletionRequest(deletionResult.value.request || null);
      } else {
        Alert.alert("Suppression du compte", deletionResult.reason.message);
      }
    });
    return () => {
      mounted = false;
    };
  }, [requestMainApi]);

  async function shareInvite() {
    try {
      await Share.share({
        message: `Mon code invitation AfriMarket: ${user?.invite_code || ""}`,
      });
    } catch {
      // ignore share failures
    }
  }

  function openAccountAction(action) {
    setAccountAction(action);
    setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    setContactForm({ value: "", current_password: "", challenge_id: "", code: "", dev_code: "" });
    setDeletionPassword("");
  }

  async function changePassword() {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      Alert.alert("Mot de passe", "Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const data = await requestMainApi("/account/password", {
        method: "POST",
        body: {
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        },
      });
      if (data.token) await updateSession(data.token, user);
      setAccountAction(null);
      Alert.alert("AfriMarket", data.message || "Mot de passe modifié.");
    } catch (error) {
      Alert.alert("Mot de passe", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function requestContactCode() {
    setBusy(true);
    try {
      const data = await requestMainApi("/account/contact/request", {
        method: "POST",
        body: {
          kind: accountAction,
          value: contactForm.value.trim(),
          current_password: contactForm.current_password,
        },
      });
      setContactForm((current) => ({
        ...current,
        challenge_id: data.challenge_id,
        dev_code: data.dev_code || "",
      }));
      Alert.alert("Code de confirmation", data.message || "Un code a été envoyé.");
    } catch (error) {
      Alert.alert("Coordonnées", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmContactChange() {
    setBusy(true);
    try {
      const data = await requestMainApi("/account/contact/confirm", {
        method: "POST",
        body: {
          challenge_id: contactForm.challenge_id,
          code: contactForm.code.trim(),
        },
      });
      if (data.token) await updateSession(data.token, user);
      await refreshUser(data.token || undefined);
      setAccountAction(null);
      Alert.alert("AfriMarket", data.message || "Coordonnées mises à jour.");
    } catch (error) {
      Alert.alert("Coordonnées", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitDeletionRequest() {
    setBusy(true);
    try {
      const data = await requestMainApi("/account/deletion", {
        method: "POST",
        body: { current_password: deletionPassword, reason: "" },
      });
      setDeletionRequest(data.request || null);
      setAccountAction(null);
      Alert.alert("Demande envoyée", data.message);
    } catch (error) {
      Alert.alert("Suppression du compte", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelDeletionRequest() {
    setBusy(true);
    try {
      const data = await requestMainApi("/account/deletion", { method: "DELETE" });
      setDeletionRequest(null);
      Alert.alert("AfriMarket", data.message || "Demande annulée.");
    } catch (error) {
      Alert.alert("Suppression du compte", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function chooseLanguage(language) {
    setBusy(true);
    try {
      await setLanguage(language);
      setAccountAction(null);
      Alert.alert("AfriMarket", "Préférence de langue enregistrée.");
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
        await disableBiometricLogin();
      } else {
        const enabled = await enableBiometricLogin();
        if (!enabled) return;
      }
      setAccountAction(null);
      Alert.alert(
        "AfriMarket",
        biometricEnabled
          ? "La connexion par empreinte a été désactivée."
          : "La connexion par empreinte a été activée."
      );
    } catch (error) {
      Alert.alert("Empreinte digitale", error.message);
    } finally {
      setBusy(false);
    }
  }

  const accountActions = [
    ["password", "Mot de passe"],
    ["email", "E-mail"],
    ["phone", "Téléphone"],
    ["language", "Langue"],
    ["biometric", biometricEnabled ? "Empreinte activée" : "Empreinte"],
    [
      "deletion",
      ["PENDING", "AWAITING_USER"].includes(deletionRequest?.status)
        ? "Suppression en cours"
        : "Supprimer le compte",
    ],
  ];

  return (
    <Screen>
      <HeroCard
        title={user?.name || "Mon compte"}
        subtitle={user?.email || "Compte client"}
        footer={`Telephone: ${user?.phone || "Non renseigne"}`}
      />

      <Card>
        <SectionHeader
          title="Mon compte"
          right={
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ width: 180, flexGrow: 0 }}
            >
              {accountActions.map(([action, label]) => (
                <TouchableOpacity
                  key={action}
                  onPress={() => action === "biometric" ? toggleBiometrics() : openAccountAction(action)}
                  disabled={busy}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: palette.border,
                    backgroundColor: "#ffffff",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: palette.primary, fontWeight: "700", fontSize: 13 }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          }
        />
      </Card>

      <Card>
        <SectionHeader title="Profil" subtitle="Informations principales" />
        <KeyValue label="Nom" value={user?.name || "-"} />
        <KeyValue label="E-mail" value={user?.email || "-"} />
        <KeyValue label="Telephone" value={user?.phone || "-"} />
        <KeyValue
          label="Adresse (dernière commande)"
          value={latestOrder?.address || "Aucune adresse de livraison enregistrée"}
        />
        <KeyValue label="Pays" value={user?.country || "-"} />
        <KeyValue label="Monnaie" value={user?.currency || "-"} />
        <KeyValue label="Langue" value={(user?.language || "fr").toUpperCase()} />
        <KeyValue
          label="Telephone verifie"
          value={user?.phone_verified ? "Oui" : "Non"}
          tone={user?.phone_verified ? "success" : "default"}
        />
        <KeyValue
          label="E-mail verifie"
          value={user?.email_verified ? "Oui" : "Non"}
          tone={user?.email_verified ? "success" : "default"}
        />
        {deletionRequest ? (
          <>
            <KeyValue label="Demande de suppression" value={deletionRequest.status} tone="danger" />
            {["PENDING", "AWAITING_USER"].includes(deletionRequest.status) ? (
              <SecondaryButton
                title={busy ? "Annulation..." : "Annuler la demande"}
                onPress={cancelDeletionRequest}
                disabled={busy}
              />
            ) : null}
          </>
        ) : null}
      </Card>

      <Card>
        <SectionHeader title="Espace client" subtitle="Fonctions avancees" />
        <PrimaryButton title="Portefeuille" onPress={() => navigation.getParent().navigate("Wallet")} />
        <PrimaryButton title="Retraits" onPress={() => navigation.getParent().navigate("Withdrawals")} tone="muted" />
        <SecondaryButton title="Mes favoris" onPress={() => navigation.getParent().navigate("Favorites")} />
        <SecondaryButton title="Mes verifications" onPress={() => navigation.getParent().navigate("Verify")} />
        <SecondaryButton title="Mon code invitation" onPress={() => navigation.getParent().navigate("Invite")} />
        <SecondaryButton title="Partager mon code" onPress={shareInvite} />
        <PrimaryButton title="Se deconnecter" onPress={onLogout} tone="danger" />
      </Card>

      <Modal
        visible={!!accountAction}
        animationType="slide"
        onRequestClose={() => setAccountAction(null)}
      >
        <View style={{ flex: 1, backgroundColor: palette.background, paddingTop: 20 }}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: palette.text }}>
              {accountAction === "password" ? "Changer le mot de passe"
                : accountAction === "email" ? "Changer l'e-mail"
                  : accountAction === "phone" ? "Changer le téléphone"
                    : accountAction === "language" ? "Choisir la langue"
                      : "Supprimer le compte"}
            </Text>
            <TouchableOpacity onPress={() => setAccountAction(null)} accessibilityLabel="Fermer">
              <Ionicons name="close-circle-outline" size={28} color={palette.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            {accountAction === "password" ? (
              <Card>
                <FormField
                  label="Mot de passe actuel"
                  secureTextEntry
                  value={passwordForm.current_password}
                  onChangeText={(value) => setPasswordForm((current) => ({ ...current, current_password: value }))}
                />
                <FormField
                  label="Nouveau mot de passe (6 caractères minimum)"
                  secureTextEntry
                  value={passwordForm.new_password}
                  onChangeText={(value) => setPasswordForm((current) => ({ ...current, new_password: value }))}
                />
                <FormField
                  label="Confirmer le nouveau mot de passe"
                  secureTextEntry
                  value={passwordForm.confirm_password}
                  onChangeText={(value) => setPasswordForm((current) => ({ ...current, confirm_password: value }))}
                />
                <PrimaryButton title={busy ? "Enregistrement..." : "Modifier le mot de passe"} onPress={changePassword} disabled={busy} />
              </Card>
            ) : null}
            {["email", "phone"].includes(accountAction) ? (
              <Card>
                {!contactForm.challenge_id ? (
                  <>
                    <FormField
                      label={accountAction === "email" ? "Nouvelle adresse e-mail" : "Nouveau numéro de téléphone"}
                      keyboardType={accountAction === "email" ? "email-address" : "phone-pad"}
                      value={contactForm.value}
                      onChangeText={(value) => setContactForm((current) => ({ ...current, value }))}
                    />
                    <FormField
                      label="Mot de passe actuel"
                      secureTextEntry
                      value={contactForm.current_password}
                      onChangeText={(value) => setContactForm((current) => ({ ...current, current_password: value }))}
                    />
                    <PrimaryButton title={busy ? "Envoi..." : "Envoyer le code"} onPress={requestContactCode} disabled={busy} />
                  </>
                ) : (
                  <>
                    <Text style={{ color: palette.muted, marginBottom: 12 }}>
                      Entrez le code envoyé à {contactForm.value}.
                    </Text>
                    {contactForm.dev_code ? (
                      <Text style={{ color: palette.primary, fontWeight: "800", marginBottom: 12 }}>
                        Code de test : {contactForm.dev_code}
                      </Text>
                    ) : null}
                    <FormField
                      label="Code de confirmation"
                      keyboardType="number-pad"
                      value={contactForm.code}
                      onChangeText={(value) => setContactForm((current) => ({ ...current, code: value }))}
                    />
                    <PrimaryButton title={busy ? "Vérification..." : "Confirmer"} onPress={confirmContactChange} disabled={busy} />
                  </>
                )}
              </Card>
            ) : null}
            {accountAction === "language" ? (
              <Card>
                <SectionHeader title="Langue de votre compte" subtitle="Cette préférence est enregistrée sur AfriMarket." />
                {[
                  ["fr", "Français"],
                  ["en", "English"],
                  ["es", "Español"],
                ].map(([language, label]) => (
                  <PrimaryButton
                    key={language}
                    title={`${(user?.language || "fr") === language ? "✓ " : ""}${label}`}
                    onPress={() => chooseLanguage(language)}
                    disabled={busy}
                    tone={(user?.language || "fr") === language ? "primary" : "muted"}
                  />
                ))}
              </Card>
            ) : null}
            {accountAction === "deletion" ? (
              <Card>
                <Text style={{ color: palette.muted, lineHeight: 21 }}>
                  La suppression nécessite l’approbation de deux administrateurs, puis une confirmation par e-mail. Votre compte n’est pas supprimé immédiatement.
                </Text>
                <FormField
                  label="Mot de passe actuel"
                  secureTextEntry
                  value={deletionPassword}
                  onChangeText={setDeletionPassword}
                />
                <PrimaryButton title={busy ? "Envoi..." : "Envoyer la demande"} onPress={submitDeletionRequest} disabled={busy} tone="danger" />
              </Card>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { formatMoney, productPrice } from "../lib/api";
import {
  Card,
  Chip,
  EmptyState,
  FormField,
  KeyValue,
  ListCard,
  LoadingState,
  PrimaryButton,
  Screen,
  SectionHeader,
  SecondaryButton,
  ToggleRow,
  palette,
} from "../components/UI";

const REPORT_REASONS = [
  "Contrefacon",
  "Produit interdit / illegal",
  "Description trompeuse",
  "Prix abusif",
  "Contenu inapproprie",
  "Autre",
];

export function ProductDetailScreen({ route }) {
  const { productId } = route.params;
  const { requestMainApi, addToCart, favorites, toggleFavorite } = useApp();
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [comment, setComment] = useState("");
  const [qty, setQty] = useState("1");
  const [variantId, setVariantId] = useState("");
  const [product, setProduct] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestMainApi(`/products/${productId}`);
      setProduct(data.product || null);
      if ((data.product?.variants || []).length === 1) {
        setVariantId(data.product.variants[0].id);
      }
    } catch (error) {
      Alert.alert("Produit", error.message);
    } finally {
      setLoading(false);
    }
  }, [productId, requestMainApi]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedVariant = useMemo(() => {
    return (product?.variants || []).find((item) => item.id === variantId) || null;
  }, [product, variantId]);

  const favorite = favorites.some((item) => item.id === productId);

  async function submitReport() {
    setSubmitting(true);
    try {
      await requestMainApi(`/products/${productId}/report`, {
        method: "POST",
        body: { reason, comment },
      });
      Alert.alert("AfriMarket", "Le signalement a ete envoye.");
      setComment("");
      setReporting(false);
    } catch (error) {
      Alert.alert("Signalement", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Screen><LoadingState label="Chargement du produit..." /></Screen>;
  if (!product) return <Screen><EmptyState title="Produit introuvable" /></Screen>;

  return (
    <Screen>
      <Card>
        <SectionHeader title={product.name} subtitle={product.shop_name || "AfriMarket"} />
        <Text style={{ color: palette.primary, fontSize: 24, fontWeight: "900", marginBottom: 8 }}>
          {formatMoney(productPrice(product, selectedVariant), product.currency)}
        </Text>
        {product.short_description ? (
          <Text style={{ color: palette.muted, lineHeight: 20 }}>{product.short_description}</Text>
        ) : null}
        <KeyValue label="Stock" value={`${selectedVariant ? selectedVariant.stock : product.stock ?? 0}`} />
        {product.distance_km !== undefined &&
        product.distance_km !== null &&
        isFinite(product.distance_km) ? (
          <KeyValue label="Distance" value={`${Number(product.distance_km).toFixed(1)} km`} />
        ) : null}

        {(product.variants || []).length ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: palette.text, fontWeight: "700", marginBottom: 8 }}>
              Variantes
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {product.variants.map((item) => (
                <Chip
                  key={item.id}
                  label={`${item.label || "Variante"} ${item.stock < 1 ? "(rupture)" : ""}`}
                  active={variantId === item.id}
                  onPress={() => setVariantId(item.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <FormField
          label="Quantite"
          keyboardType="number-pad"
          value={qty}
          onChangeText={setQty}
        />
        <PrimaryButton
          title="Ajouter au panier"
          onPress={async () => {
            await addToCart(product, qty, selectedVariant);
            Alert.alert("AfriMarket", "Produit ajoute au panier.");
          }}
        />
        <SecondaryButton
          title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          onPress={async () => {
            await toggleFavorite(product);
          }}
        />
      </Card>

      {product.description ? (
        <Card>
          <SectionHeader title="Description" />
          <Text style={{ color: palette.muted, lineHeight: 22 }}>{product.description}</Text>
        </Card>
      ) : null}

      <Card>
        <SectionHeader title="Signaler ce produit" subtitle="Fonction issue du site web" />
        <SecondaryButton
          title={reporting ? "Masquer le formulaire" : "Ouvrir le formulaire"}
          onPress={() => setReporting((value) => !value)}
        />
        {reporting ? (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
              {REPORT_REASONS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  active={item === reason}
                  onPress={() => setReason(item)}
                />
              ))}
            </View>
            <FormField
              label="Commentaire"
              multiline
              value={comment}
              onChangeText={setComment}
            />
            <PrimaryButton
              title={submitting ? "Envoi..." : "Envoyer le signalement"}
              onPress={submitReport}
              disabled={submitting}
            />
          </>
        ) : null}
      </Card>
    </Screen>
  );
}

export function ShopDetailScreen({ route, navigation }) {
  const { shopId } = route.params;
  const { requestMainApi, addToCart } = useApp();
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [shopData, productData] = await Promise.all([
        requestMainApi(`/shops/${shopId}`),
        requestMainApi(`/products?shop_id=${encodeURIComponent(shopId)}`),
      ]);
      setShop(shopData.shop || null);
      setProducts(productData.products || []);
    } catch (error) {
      Alert.alert("Boutique", error.message);
    } finally {
      setLoading(false);
    }
  }, [requestMainApi, shopId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Screen><LoadingState label="Chargement de la boutique..." /></Screen>;
  if (!shop) return <Screen><EmptyState title="Boutique introuvable" /></Screen>;

  return (
    <Screen>
      <Card>
        <SectionHeader title={shop.name} subtitle={[shop.city, shop.country].filter(Boolean).join(", ")} />
        {shop.description ? (
          <Text style={{ color: palette.muted, lineHeight: 20 }}>{shop.description}</Text>
        ) : null}
        <KeyValue label="Monnaie" value={shop.currency || "-"} />
      </Card>

      <Card>
        <SectionHeader title={`Produits (${products.length})`} />
        {!products.length ? (
          <EmptyState title="Aucun produit pour cette boutique" />
        ) : (
          products.map((product) => (
            <ListCard
              key={product.id}
              title={product.name}
              subtitle={product.category || "Marketplace"}
              extra={formatMoney(
                product.is_promo ? product.promo_price : product.display_price,
                product.currency
              )}
              onPress={() =>
                navigation.navigate("ProductDetail", { productId: product.id })
              }
            >
              <SecondaryButton
                title="Ajouter au panier"
                onPress={async () => {
                  await addToCart(product);
                  Alert.alert("AfriMarket", "Produit ajoute au panier.");
                }}
              />
            </ListCard>
          ))
        )}
      </Card>
    </Screen>
  );
}

export function CartScreen({ navigation }) {
  const { cartItems, cartTotal, requestMainApi, updateCartQty, removeFromCart, clearCart } = useApp();
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!cartItems.length) {
      setQuote(null);
      return () => {
        mounted = false;
      };
    }
    requestMainApi("/cart/quote", {
      method: "POST",
      body: {
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          variant_id: item.variant_id || null,
        })),
      },
    })
      .then((data) => {
        if (mounted) setQuote(data);
      })
      .catch(() => {
        if (mounted) setQuote(null);
      });
    return () => {
      mounted = false;
    };
  }, [cartItems, requestMainApi]);

  const displayCurrency = quote?.customer_currency || cartItems[0]?.currency || "";
  const displaySubtotal = quote?.summary?.converted_subtotal ?? cartTotal;
  const displayShipping = quote?.summary?.converted_shipping ?? 0;
  const displayGrandTotal = quote?.summary?.converted_grand_total ?? cartTotal;

  return (
    <Screen>
      <Card>
        <SectionHeader
          title="Mon panier"
          subtitle={`${cartItems.length} ligne(s)`}
          right={
            <View style={{ alignItems: "flex-end" }}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Tabs", { screen: "Orders" })}
                accessibilityRole="button"
              >
                <Text style={{ color: palette.primary, fontWeight: "700" }}>Mes commandes</Text>
              </TouchableOpacity>
              {cartItems.length ? (
                <TouchableOpacity onPress={clearCart} style={{ marginTop: 8 }}>
                  <Text style={{ color: palette.danger, fontWeight: "700" }}>Vider</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
        {!cartItems.length ? (
          <EmptyState title="Votre panier est vide" />
        ) : (
          cartItems.map((item) => (
            <ListCard
              key={item.key}
              title={item.name}
              subtitle={`${item.shop_name}${item.variant_label ? ` • ${item.variant_label}` : ""}`}
              extra={formatMoney(item.price * item.qty, item.currency)}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 10 }}>
                <SecondaryButton title="-" onPress={() => updateCartQty(item.key, item.qty - 1)} />
                <View style={{ justifyContent: "center" }}>
                  <Text style={{ fontWeight: "800", color: palette.text }}>Qté: {item.qty}</Text>
                </View>
                <SecondaryButton title="+" onPress={() => updateCartQty(item.key, item.qty + 1)} />
              </View>
              <SecondaryButton title="Retirer" onPress={() => removeFromCart(item.key)} />
            </ListCard>
          ))
        )}
      </Card>

      {cartItems.length ? (
        <Card>
          <SectionHeader title="Total estime" />
          <Text style={{ color: palette.primary, fontWeight: "900", fontSize: 26 }}>
            {formatMoney(displayGrandTotal, displayCurrency)}
          </Text>
          {quote ? (
            <>
              <KeyValue label="Sous-total converti" value={formatMoney(displaySubtotal, displayCurrency)} />
              <KeyValue label="Livraison estimee" value={formatMoney(displayShipping, displayCurrency)} />
              <KeyValue
                label="Frais conversion admin"
                value={`${((quote.conversion_fee_rate || 0) * 100).toFixed(2)}%`}
              />
            </>
          ) : null}
          <PrimaryButton
            title="Passer a la commande"
            onPress={() => navigation.navigate("Checkout")}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

export function CheckoutScreen({ navigation }) {
  const { cartItems, cartTotal, requestMainApi, clearCart } = useApp();
  const [address, setAddress] = useState("");
  const [wallet, setWallet] = useState(null);
  const [useWallet, setUseWallet] = useState(false);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestMainApi("/wallet");
      setWallet(data);
    } catch {
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [requestMainApi]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let mounted = true;
    if (!cartItems.length) {
      setQuote(null);
      return () => {
        mounted = false;
      };
    }
    requestMainApi("/cart/quote", {
      method: "POST",
      body: {
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          variant_id: item.variant_id || null,
        })),
      },
    })
      .then((data) => {
        if (mounted) setQuote(data);
      })
      .catch(() => {
        if (mounted) setQuote(null);
      });
    return () => {
      mounted = false;
    };
  }, [cartItems, requestMainApi]);

  const displayCurrency = quote?.customer_currency || cartItems[0]?.currency || "";
  const displaySubtotal = quote?.summary?.converted_subtotal ?? cartTotal;
  const displayShipping = quote?.summary?.converted_shipping ?? 0;
  const payableTotal = quote?.summary?.converted_grand_total ?? cartTotal;
  const walletApplied = useWallet
    ? Math.min(Number(wallet?.total_available || 0), payableTotal)
    : 0;

  async function submitOrder() {
    setSubmitting(true);
    try {
      const data = await requestMainApi("/orders", {
        method: "POST",
        body: {
          items: cartItems.map((item) => ({
            product_id: item.product_id,
            qty: item.qty,
            variant_id: item.variant_id || null,
          })),
          address: address.trim(),
          payment_method: "MOCK",
          use_wallet: useWallet,
        },
      });
      await clearCart();
      Alert.alert(
        "AfriMarket",
        `Commande creee: ${(data.orders || []).join(", ")}`
      );
      navigation.reset({
        index: 0,
        routes: [{ name: "Tabs", state: { routes: [{ name: "Orders" }] } }],
      });
    } catch (error) {
      Alert.alert("Commande", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!cartItems.length) {
    return (
      <Screen>
        <EmptyState title="Votre panier est vide" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <SectionHeader title="Livraison" />
        <FormField
          label="Adresse de livraison"
          multiline
          value={address}
          onChangeText={setAddress}
          placeholder="Quartier, ville, repere..."
        />
      </Card>

      <Card>
        <SectionHeader title="Recapitulatif" />
        {cartItems.map((item) => (
          <KeyValue
            key={item.key}
            label={`${item.name} x ${item.qty}`}
            value={formatMoney(item.price * item.qty, item.currency)}
          />
        ))}
        <KeyValue
          label="Sous-total converti"
          value={formatMoney(displaySubtotal, displayCurrency)}
        />
        {quote ? (
          <>
            <KeyValue
              label="Livraison estimee"
              value={formatMoney(displayShipping, displayCurrency)}
            />
            <KeyValue
              label="Frais conversion admin"
              value={`${((quote.conversion_fee_rate || 0) * 100).toFixed(2)}%`}
            />
            <KeyValue
              label="Total client"
              value={formatMoney(payableTotal, displayCurrency)}
            />
          </>
        ) : null}
      </Card>

      <Card>
        <SectionHeader title="Portefeuille" />
        {loading ? <LoadingState label="Chargement du solde..." /> : null}
        {!loading ? (
          <>
            <ToggleRow
              label="Utiliser mon solde"
              helper={`Disponible: ${formatMoney(wallet?.total_available || 0, displayCurrency)}`}
              value={useWallet}
              onValueChange={setUseWallet}
            />
            {useWallet ? (
              <>
                <KeyValue
                  label="Paye avec le solde"
                  value={formatMoney(walletApplied, displayCurrency)}
                  tone="success"
                />
                <KeyValue
                  label="Reste a payer"
                  value={formatMoney(payableTotal - walletApplied, displayCurrency)}
                />
              </>
            ) : null}
          </>
        ) : null}
      </Card>

      <PrimaryButton
        title={submitting ? "Traitement..." : "Confirmer la commande"}
        onPress={submitOrder}
        disabled={submitting}
      />
    </Screen>
  );
}

export function WalletScreen() {
  const { user, requestMainApi } = useApp();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestMainApi("/wallet");
      setWallet(data);
    } catch (error) {
      Alert.alert("Portefeuille", error.message);
    } finally {
      setLoading(false);
    }
  }, [requestMainApi]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      {loading ? <LoadingState label="Chargement du portefeuille..." /> : null}

      {!loading && wallet ? (
        <>
          <Card>
            <SectionHeader title="Soldes" />
            <KeyValue
              label="Disponible"
              value={formatMoney(wallet.total_available, user?.currency)}
              tone="success"
            />
            <KeyValue
              label="En attente"
              value={formatMoney(wallet.total_pending, user?.currency)}
            />
          </Card>

          <Card>
            <SectionHeader title="Portefeuilles" />
            {Object.entries(wallet.wallets || {}).map(([key, value]) => (
              <KeyValue
                key={key}
                label={key}
                value={formatMoney(value.available, user?.currency)}
              />
            ))}
          </Card>

          <Card>
            <SectionHeader title="Historique" />
            {(wallet.transactions || []).length ? (
              wallet.transactions.map((tx) => (
                <ListCard
                  key={tx.id}
                  title={tx.description}
                  subtitle={`${tx.created_at?.slice(0, 10)} • ${tx.status}`}
                  extra={`${tx.kind === "WITHDRAWAL" ? "-" : "+"}${formatMoney(tx.amount, tx.currency || user?.currency)}`}
                />
              ))
            ) : (
              <EmptyState title="Aucune transaction" />
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

export function WithdrawalsScreen() {
  const { user, requestMainApi } = useApp();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [list, setList] = useState([]);
  const [method, setMethod] = useState("MOBILE_MONEY");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [walletData, withdrawalsData] = await Promise.all([
        requestMainApi("/wallet"),
        requestMainApi("/withdrawals/mine"),
      ]);
      setWallet(walletData);
      setList(withdrawalsData.withdrawals || []);
    } catch (error) {
      Alert.alert("Retraits", error.message);
    } finally {
      setLoading(false);
    }
  }, [requestMainApi]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitWithdrawal() {
    setSubmitting(true);
    try {
      await requestMainApi("/withdrawals", {
        method: "POST",
        body: {
          amount: Number(amount || 0),
          method,
          destination: destination.trim(),
          bank_name: bankName.trim(),
          account_name: accountName.trim(),
        },
      });
      Alert.alert("AfriMarket", "Demande de retrait enregistree.");
      setAmount("");
      setDestination("");
      setBankName("");
      setAccountName("");
      load();
    } catch (error) {
      Alert.alert("Retraits", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Card>
        <SectionHeader title="Demander un retrait" subtitle={`Solde disponible: ${formatMoney(wallet?.total_available || 0, user?.currency)}`} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
          <Chip
            label="Mobile Money"
            active={method === "MOBILE_MONEY"}
            onPress={() => setMethod("MOBILE_MONEY")}
          />
          <Chip
            label="Banque"
            active={method === "BANK"}
            onPress={() => setMethod("BANK")}
          />
        </View>
        <FormField
          label="Montant"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        {method === "BANK" ? (
          <>
            <FormField label="Banque" value={bankName} onChangeText={setBankName} />
            <FormField label="Titulaire du compte" value={accountName} onChangeText={setAccountName} />
            <FormField label="Compte / IBAN" value={destination} onChangeText={setDestination} />
          </>
        ) : (
          <FormField
            label="Numero Mobile Money"
            keyboardType="phone-pad"
            value={destination}
            onChangeText={setDestination}
          />
        )}
        <PrimaryButton
          title={submitting ? "Envoi..." : "Confirmer le retrait"}
          onPress={submitWithdrawal}
          disabled={submitting}
        />
      </Card>

      <Card>
        <SectionHeader title="Mes demandes" />
        {loading ? <LoadingState label="Chargement des retraits..." /> : null}
        {!loading && !list.length ? <EmptyState title="Aucune demande de retrait" /> : null}
        {!loading
          ? list.map((item) => (
              <ListCard
                key={item.id}
                title={formatMoney(item.amount, item.currency)}
                subtitle={`${item.method} • ${item.created_at?.slice(0, 10)}`}
                extra={item.status}
              />
            ))
          : null}
      </Card>
    </Screen>
  );
}

export function FavoritesScreen({ navigation }) {
  const { favorites, removeFavorite } = useApp();

  return (
    <Screen>
      <Card>
        <SectionHeader title="Mes favoris" />
        {!favorites.length ? (
          <EmptyState title="Aucun favori pour le moment" />
        ) : (
          favorites.map((product) => (
            <ListCard
              key={product.id}
              title={product.name}
              subtitle={product.shop_name}
              extra={formatMoney(
                product.is_promo && product.promo_price !== null
                  ? product.promo_price
                  : product.display_price,
                product.currency
              )}
              onPress={() =>
                navigation.navigate("ProductDetail", { productId: product.id })
              }
            >
              <SecondaryButton
                title="Retirer des favoris"
                onPress={() => removeFavorite(product.id)}
              />
            </ListCard>
          ))
        )}
      </Card>
    </Screen>
  );
}

export function InviteScreen() {
  const { user } = useApp();

  return (
    <Screen>
      <Card>
        <SectionHeader title="Mon code invitation" subtitle="Partagez ce code avec vos proches." />
        <Text
          style={{
            fontSize: 30,
            fontWeight: "900",
            color: palette.text,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {user?.invite_code || "N/A"}
        </Text>
        <KeyValue
          label="Statut partenaire"
          value={user?.is_partner ? "Oui" : "Non"}
          tone={user?.is_partner ? "success" : "default"}
        />
      </Card>
    </Screen>
  );
}

export function VerifyScreen() {
  const { user, requestMainApi, refreshUser } = useApp();
  const [phoneCode, setPhoneCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  async function sendPhoneOtp() {
    setLoadingPhone(true);
    try {
      const data = await requestMainApi("/auth/send-phone-otp", {
        method: "POST",
      });
      Alert.alert("OTP telephone", `Code demo: ${data.demo_otp || "envoye"}`);
    } catch (error) {
      Alert.alert("Telephone", error.message);
    } finally {
      setLoadingPhone(false);
    }
  }

  async function verifyPhone() {
    setLoadingPhone(true);
    try {
      await requestMainApi("/auth/verify-phone", {
        method: "POST",
        body: { code: phoneCode.trim() },
      });
      await refreshUser();
      setPhoneCode("");
      Alert.alert("Telephone", "Telephone verifie.");
    } catch (error) {
      Alert.alert("Telephone", error.message);
    } finally {
      setLoadingPhone(false);
    }
  }

  async function sendEmailCode() {
    setLoadingEmail(true);
    try {
      await requestMainApi("/auth/resend-email", { method: "POST" });
      Alert.alert("E-mail", "Code de verification envoye.");
    } catch (error) {
      Alert.alert("E-mail", error.message);
    } finally {
      setLoadingEmail(false);
    }
  }

  async function verifyEmail() {
    setLoadingEmail(true);
    try {
      await requestMainApi("/auth/verify-email", {
        method: "POST",
        body: { code: emailCode.trim() },
      });
      await refreshUser();
      setEmailCode("");
      Alert.alert("E-mail", "E-mail verifie.");
    } catch (error) {
      Alert.alert("E-mail", error.message);
    } finally {
      setLoadingEmail(false);
    }
  }

  return (
    <Screen>
      <Card>
        <SectionHeader title="Etat actuel" />
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
      </Card>

      <Card>
        <SectionHeader title="Verification telephone" />
        <PrimaryButton
          title={loadingPhone ? "Envoi..." : "Envoyer OTP"}
          onPress={sendPhoneOtp}
          disabled={loadingPhone}
        />
        <FormField
          label="Code OTP"
          keyboardType="number-pad"
          value={phoneCode}
          onChangeText={setPhoneCode}
        />
        <SecondaryButton
          title="Verifier le telephone"
          onPress={verifyPhone}
          disabled={loadingPhone}
        />
      </Card>

      <Card>
        <SectionHeader title="Verification e-mail" />
        <PrimaryButton
          title={loadingEmail ? "Envoi..." : "Renvoyer le code"}
          onPress={sendEmailCode}
          disabled={loadingEmail}
        />
        <FormField
          label="Code e-mail"
          keyboardType="number-pad"
          value={emailCode}
          onChangeText={setEmailCode}
        />
        <SecondaryButton
          title="Verifier l'e-mail"
          onPress={verifyEmail}
          disabled={loadingEmail}
        />
      </Card>
    </Screen>
  );
}

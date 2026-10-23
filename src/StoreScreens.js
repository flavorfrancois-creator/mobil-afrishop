import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "./AppContext";
import { money } from "./api";
import {
  Button,
  Card,
  Empty,
  Field,
  Heading,
  HorizontalPills,
  Loading,
  ProductCard,
  Row,
  Screen,
  colors,
} from "./ui";

function productRoute(navigation, product) {
  const parent = navigation.getParent();
  if (parent) parent.navigate("Produit", { productId: product.id });
  else navigation.navigate("Produit", { productId: product.id });
}

function ProductGrid({ products, navigation, addToCart, favorites = [], toggleFavorite }) {
  if (!products.length) {
    return <Empty title="Aucun produit trouvé" text="Essayez une autre recherche." />;
  }
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onPress={() => productRoute(navigation, product)}
          onAdd={() => addToCart(product).then(() => Alert.alert("Ajouté", `${product.name} est dans votre panier.`))}
          favorited={favorites.some((item) => item.id === product.id)}
          onToggleFavorite={toggleFavorite ? () => toggleFavorite(product) : undefined}
        />
      ))}
    </View>
  );
}

export function HomeScreen({ navigation }) {
  const {
    user,
    requestMobile,
    addToCart,
    cartCount,
    favorites,
    toggleFavorite,
  } = useApp();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productData, shopData] = await Promise.all([
        requestMobile("/products"),
        requestMobile("/shops"),
      ]);
      setProducts(productData.products || []);
      setShops(shopData.shops || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [requestMobile]);

  useEffect(() => { load(); }, [load]);

  return (
    <Screen>
      <View style={{ backgroundColor: colors.primaryDark, borderRadius: 24, padding: 22, marginBottom: 16 }}>
        <Text style={{ color: "#cce7d8", fontWeight: "700" }}>Bienvenue sur AfriMarket</Text>
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 6 }}>
          Bonjour {user?.name?.split(" ")[0] || "Client"} !
        </Text>
        <Text style={{ color: "#dbece1", marginTop: 8, lineHeight: 20 }}>
          Découvrez des produits et boutiques près de chez vous.
        </Text>
        <View style={{ flexDirection: "row", gap: 18, marginTop: 18 }}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>{cartCount} article(s) dans le panier</Text>
          <Text style={{ color: "#fff", fontWeight: "800" }}>{favorites.length} favori(s)</Text>
        </View>
      </View>
      {error ? (
        <Card>
          <Text style={{ color: colors.coral }}>{error}</Text>
          <Button title="Réessayer" onPress={load} variant="secondary" />
        </Card>
      ) : null}
      {loading ? <Loading label="Chargement de la marketplace..." /> : null}
      {!loading && !error ? (
        <>
          <Heading
            title="À découvrir"
            subtitle="Les produits disponibles sur la marketplace"
            right={
              <TouchableOpacity onPress={() => navigation.navigate("Produits")}>
                <Text style={{ color: colors.primary, fontWeight: "800" }}>Tout voir</Text>
              </TouchableOpacity>
            }
          />
          <ProductGrid
            products={products.slice(0, 6)}
            navigation={navigation}
            addToCart={addToCart}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
          <Heading
            title="Boutiques"
            subtitle={`${shops.length} boutique(s) à découvrir`}
          />
          {shops.slice(0, 5).map((shop) => (
            <Card key={shop.id}>
              <Text style={{ color: colors.ink, fontWeight: "900", fontSize: 17 }}>{shop.name}</Text>
              <Text style={{ color: colors.muted, marginTop: 5 }}>
                {[shop.city, shop.country].filter(Boolean).join(", ")}{shop.currency ? ` · ${shop.currency}` : ""}
              </Text>
              {shop.description ? (
                <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 19 }}>{shop.description}</Text>
              ) : null}
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

export function ProductsScreen({ navigation }) {
  const { requestMain, addToCart, favorites, toggleFavorite } = useApp();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [promo, setPromo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (category) params.set("category", category);
      if (promo) params.set("promo", "true");
      const suffix = params.toString();
      const data = await requestMain(`/products${suffix ? `?${suffix}` : ""}`);
      setProducts(data.products || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category, promo, query, requestMain]);

  useEffect(() => { load(); }, [load]);
  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].slice(0, 10),
    [products]
  );

  return (
    <Screen>
      <Heading title="Produits" subtitle="Recherchez des articles sur AfriMarket." />
      <Card>
        <Field label="Rechercher" value={query} onChangeText={setQuery} placeholder="Nom du produit" />
        <HorizontalPills
          items={[
            { value: "", label: "Tout" },
            ...categories.map((value) => ({ value, label: value })),
            { value: "__promos", label: "Promotions" },
          ]}
          selected={promo ? "__promos" : category}
          onSelect={(value) => {
            setPromo(value === "__promos");
            setCategory(value === "__promos" ? "" : value);
          }}
        />
        <Button title="Actualiser les résultats" variant="secondary" onPress={load} />
      </Card>
      {error ? <Card><Text style={{ color: colors.coral }}>{error}</Text></Card> : null}
      {loading ? <Loading label="Recherche des produits..." /> : null}
      {!loading && !error ? (
        <ProductGrid
          products={products}
          navigation={navigation}
          addToCart={addToCart}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      ) : null}
    </Screen>
  );
}

export function ShopsScreen({ navigation }) {
  const { requestMain, addToCart } = useApp();
  const [shops, setShops] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopProducts, setShopProducts] = useState([]);
  const [shopLoading, setShopLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestMain("/shops");
      setShops(data.shops || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [requestMain]);
  useEffect(() => { load(); }, [load]);

  const filtered = shops.filter((shop) =>
    [shop.name, shop.city, shop.country].filter(Boolean)
      .some((value) => value.toLowerCase().includes(query.trim().toLowerCase()))
  );

  async function openShop(shop) {
    setSelectedShop(shop);
    setShopLoading(true);
    try {
      const data = await requestMain(`/products?shop_id=${encodeURIComponent(shop.id)}`);
      setShopProducts(data.products || []);
    } catch (e) {
      Alert.alert("Boutique", e.message);
    } finally {
      setShopLoading(false);
    }
  }

  if (selectedShop) {
    return (
      <Screen>
        <Button title="← Toutes les boutiques" variant="secondary" onPress={() => setSelectedShop(null)} />
        <Card>
          <Heading
            title={selectedShop.name}
            subtitle={[selectedShop.city, selectedShop.country, selectedShop.currency].filter(Boolean).join(" · ")}
          />
          {selectedShop.description ? <Text style={{ color: colors.muted, lineHeight: 20 }}>{selectedShop.description}</Text> : null}
        </Card>
        <Heading title={`Produits (${shopProducts.length})`} />
        {shopLoading ? <Loading label="Chargement des produits de la boutique..." /> : null}
        {!shopLoading ? (
          <ProductGrid products={shopProducts} navigation={navigation} addToCart={addToCart} />
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <Heading title="Boutiques" subtitle="Trouvez une boutique et ses produits." />
      <Field label="Boutique ou ville" value={query} onChangeText={setQuery} placeholder="Ex. Dakar" />
      {error ? <Card><Text style={{ color: colors.coral }}>{error}</Text></Card> : null}
      {loading ? <Loading label="Chargement des boutiques..." /> : null}
      {!loading && !filtered.length ? <Empty title="Aucune boutique" /> : null}
      {!loading ? filtered.map((shop) => (
        <TouchableOpacity key={shop.id} activeOpacity={0.85} onPress={() => openShop(shop)}>
          <Card>
            <Text style={{ color: colors.ink, fontWeight: "900", fontSize: 18 }}>{shop.name}</Text>
            <Text style={{ color: colors.muted, marginTop: 5 }}>
              {[shop.city, shop.country].filter(Boolean).join(", ")}
            </Text>
            {shop.currency ? <Text style={{ color: colors.primary, marginTop: 4, fontWeight: "700" }}>{shop.currency}</Text> : null}
            {shop.description ? <Text style={{ color: colors.muted, marginTop: 8 }}>{shop.description}</Text> : null}
          </Card>
        </TouchableOpacity>
      )) : null}
    </Screen>
  );
}

export function ProductScreen({ route }) {
  const { productId } = route.params;
  const { requestMain, addToCart, toggleFavorite, favorites } = useApp();
  const [product, setProduct] = useState(null);
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    requestMain(`/products/${productId}`)
      .then((data) => {
        if (!active) return;
        setProduct(data.product || null);
        if (data.product?.variants?.length === 1) setVariantId(data.product.variants[0].id);
      })
      .catch((error) => Alert.alert("Produit", error.message))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId, requestMain]);

  const variant = product?.variants?.find((item) => item.id === variantId) || null;
  const favorite = favorites.some((item) => item.id === productId);
  if (loading) return <Screen><Loading label="Chargement du produit..." /></Screen>;
  if (!product) return <Screen><Empty title="Produit introuvable" /></Screen>;

  return (
    <Screen>
      <Card>
        <Heading title={product.name} subtitle={product.shop_name || "AfriMarket"} />
        <Text style={{ color: colors.primary, fontSize: 24, fontWeight: "900", marginVertical: 8 }}>
          {money(variant?.price_simple ?? variant?.price ?? (product.is_promo ? product.promo_price : product.display_price), product.currency)}
        </Text>
        {product.description ? <Text style={{ color: colors.muted, lineHeight: 21 }}>{product.description}</Text> : null}
        <Row label="Disponibilité" value={String(variant?.stock ?? product.stock ?? 0)} />
        {(product.variants || []).length ? (
          <>
            <Text style={{ color: colors.ink, fontWeight: "800", marginTop: 14, marginBottom: 8 }}>Choisir une variante</Text>
            <HorizontalPills
              items={product.variants.map((item) => ({
                value: item.id,
                label: `${item.label || "Variante"} · ${item.stock ?? 0} en stock`,
              }))}
              selected={variantId}
              onSelect={setVariantId}
            />
          </>
        ) : null}
        <Field label="Quantité" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
        <Button
          title="Ajouter au panier"
          onPress={() => addToCart(product, quantity, variant).then(() => Alert.alert("Ajouté au panier", product.name))}
        />
        <Button
          title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          variant="secondary"
          onPress={() => toggleFavorite(product)}
        />
      </Card>
    </Screen>
  );
}

function cartPayload(items) {
  return items.map((item) => ({
    product_id: item.product_id,
    qty: item.qty,
    variant_id: item.variant_id || null,
  }));
}

function useOrderQuote(items, requestMain) {
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(cartPayload(items));
  useEffect(() => {
    let active = true;
    if (!items.length) {
      setQuote(null);
      setQuoteError("");
      return () => { active = false; };
    }
    setLoading(true);
    setQuoteError("");
    requestMain("/orders/quote", {
      method: "POST",
      body: { items: cartPayload(items) },
    })
      .then((data) => { if (active) setQuote(data); })
      .catch((error) => { if (active) { setQuote(null); setQuoteError(error.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, requestMain]);
  return { quote, quoteError, quoteLoading: loading };
}

function QuoteDetails({ quote, customsMode, setCustomsMode }) {
  if (!quote) return null;
  const currency = quote.buyer_currency || "";
  const total = customsMode === "NOW" ? quote.total_with_customs : quote.total_without_customs;
  return (
    <Card>
      <Heading title="Transport, douane et conversion" />
      {(quote.shops || []).map((shop) => (
        <View key={shop.shop_id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <Text style={{ color: colors.ink, fontWeight: "800" }}>{shop.shop_name}</Text>
          {shop.shop_currency && shop.shop_currency !== currency ? (
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              1 {shop.shop_currency} = {Number(shop.fx_rate || 0).toFixed(4)} {currency}
            </Text>
          ) : null}
        </View>
      ))}
      <Row label="Sous-total" value={money(quote.subtotal, currency)} />
      {quote.shipping_total !== undefined ? <Row label="Transport" value={money(quote.shipping_total, currency)} /> : null}
      {quote.customs_total !== undefined ? <Row label="Douane estimée" value={money(quote.customs_total, currency)} /> : null}
      {quote.conversion_fee !== undefined ? <Row label="Frais de conversion" value={money(quote.conversion_fee, currency)} /> : null}
      <Text style={{ color: colors.ink, fontWeight: "800", marginTop: 14, marginBottom: 8 }}>
        Paiement des frais de douane
      </Text>
      <HorizontalPills
        items={[
          { value: "NOW", label: "Maintenant" },
          { value: "LATER", label: "À la livraison" },
        ]}
        selected={customsMode}
        onSelect={setCustomsMode}
      />
      <Row label="Total estimé" value={money(total, currency)} strong />
    </Card>
  );
}

export function CartScreen({ navigation }) {
  const { cartItems, updateCartQty, clearCart, requestMain } = useApp();
  const { quote, quoteError, quoteLoading } = useOrderQuote(cartItems, requestMain);
  return (
    <Screen>
      <Heading
        title="Mon panier"
        subtitle={`${cartItems.reduce((sum, item) => sum + item.qty, 0)} article(s)`}
        right={
          <TouchableOpacity onPress={() => navigation.navigate("Marketplace", { screen: "Commandes" })}>
            <Text style={{ color: colors.primary, fontWeight: "800" }}>Mes commandes</Text>
          </TouchableOpacity>
        }
      />
      {!cartItems.length ? <Empty title="Votre panier est vide" text="Explorez les produits AfriMarket pour commencer." /> : null}
      {cartItems.map((item) => (
        <Card key={item.key}>
          <Text style={{ color: colors.ink, fontWeight: "900", fontSize: 16 }}>{item.name}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>
            {item.shop_name}{item.variant_label ? ` · ${item.variant_label}` : ""}
          </Text>
          <Row label="Prix unitaire" value={money(item.price, item.currency)} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <TouchableOpacity onPress={() => updateCartQty(item.key, item.qty - 1)} accessibilityLabel="Diminuer">
                <Ionicons name="remove-circle-outline" size={30} color={colors.primary} />
              </TouchableOpacity>
              <Text style={{ color: colors.ink, fontWeight: "900" }}>{item.qty}</Text>
              <TouchableOpacity onPress={() => updateCartQty(item.key, item.qty + 1)} accessibilityLabel="Augmenter">
                <Ionicons name="add-circle-outline" size={30} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => updateCartQty(item.key, 0)}>
              <Text style={{ color: colors.coral, fontWeight: "800" }}>Retirer</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}
      {quoteLoading ? <Loading label="Calcul du total, du transport et de la conversion..." /> : null}
      {quoteError ? (
        <Card>
          <Text style={{ color: colors.coral, fontWeight: "700" }}>{quoteError}</Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>Impossible de confirmer un total fiable. Réessayez avant de commander.</Text>
        </Card>
      ) : null}
      {quote ? (
        <Card>
          <Row label="Total converti" value={money(quote.total_with_customs, quote.buyer_currency)} strong />
          <Button title="Passer commande" onPress={() => navigation.navigate("Checkout")} />
          <Button title="Vider le panier" variant="secondary" onPress={clearCart} />
        </Card>
      ) : null}
    </Screen>
  );
}

export function CheckoutScreen({ navigation }) {
  const { cartItems, requestMain, clearCart, user } = useApp();
  const { quote, quoteError, quoteLoading } = useOrderQuote(cartItems, requestMain);
  const [address, setAddress] = useState("");
  const [wallet, setWallet] = useState(null);
  const [useWallet, setUseWallet] = useState(false);
  const [customsMode, setCustomsMode] = useState("NOW");
  const [submitting, setSubmitting] = useState(false);
  const currency = quote?.buyer_currency || user?.currency || "";
  const payable = customsMode === "NOW"
    ? Number(quote?.total_with_customs || 0)
    : Number(quote?.total_without_customs || 0);
  const walletApplied = useWallet
    ? Math.min(Number(wallet?.total_available || 0), payable)
    : 0;

  useEffect(() => {
    requestMain("/wallet")
      .then(setWallet)
      .catch((error) => Alert.alert("Portefeuille", error.message));
  }, [requestMain]);

  async function submit() {
    if (!address.trim()) {
      Alert.alert("Adresse de livraison", "Saisissez votre adresse de livraison.");
      return;
    }
    if (!quote || quoteError || quoteLoading) return;
    setSubmitting(true);
    try {
      const data = await requestMain("/orders", {
        method: "POST",
        body: {
          items: cartPayload(cartItems),
          address: address.trim(),
          payment_method: "MOCK",
          use_wallet: useWallet,
          customs_payment: customsMode,
        },
      });
      await clearCart();
      Alert.alert("Commande confirmée", `Référence(s) : ${(data.orders || []).join(", ")}`);
      navigation.navigate("Marketplace", { screen: "Commandes" });
    } catch (error) {
      Alert.alert("Commande non finalisée", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!cartItems.length) return <Screen><Empty title="Votre panier est vide" /></Screen>;
  return (
    <Screen>
      <Heading title="Finaliser la commande" subtitle="Les tarifs sont recalculés par le serveur avant confirmation." />
      <Card>
        <Field
          label="Adresse de livraison"
          value={address}
          onChangeText={setAddress}
          placeholder="Quartier, ville, repère..."
          multiline
          autoCapitalize="sentences"
        />
      </Card>
      {quoteLoading ? <Loading label="Calcul des tarifs AfriMarket..." /> : null}
      {quoteError ? <Card><Text style={{ color: colors.coral }}>{quoteError}</Text></Card> : null}
      <QuoteDetails quote={quote} customsMode={customsMode} setCustomsMode={setCustomsMode} />
      <Card>
        <Heading title="Portefeuille" subtitle={`Solde disponible : ${money(wallet?.total_available || 0, currency)}`} />
        <TouchableOpacity
          onPress={() => setUseWallet((value) => !value)}
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          disabled={Number(wallet?.total_available || 0) <= 0}
        >
          <Ionicons
            name={useWallet ? "checkbox" : "square-outline"}
            size={24}
            color={colors.primary}
          />
          <Text style={{ color: colors.ink, fontWeight: "700" }}>Utiliser mon solde</Text>
        </TouchableOpacity>
        {useWallet ? <Row label="Solde utilisé" value={money(walletApplied, currency)} /> : null}
        {useWallet ? <Row label="Reste à payer" value={money(Math.max(0, payable - walletApplied), currency)} strong /> : null}
      </Card>
      <Card>
        <Heading title="Paiement" subtitle="Paiement simulé — aucun débit réel." />
        <Button
          title={submitting ? "Traitement..." : `Confirmer la commande · ${money(Math.max(0, payable - walletApplied), currency)}`}
          onPress={submit}
          disabled={submitting || quoteLoading || !quote || !!quoteError}
        />
      </Card>
    </Screen>
  );
}

export function OrdersScreen() {
  const { requestMain } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestMain("/orders/mine");
      setOrders(data.orders || []);
    } catch (error) {
      Alert.alert("Commandes", error.message);
    } finally {
      setLoading(false);
    }
  }, [requestMain]);
  useEffect(() => { load(); }, [load]);

  async function confirmReceipt(code) {
    try {
      const data = await requestMain("/orders/confirm-by-tracking", {
        method: "POST",
        body: { code },
      });
      Alert.alert("AfriMarket", data.message);
      await load();
    } catch (error) {
      Alert.alert("Réception", error.message);
    }
  }

  return (
    <Screen>
      <Heading title="Mes commandes" subtitle="Suivez vos achats et confirmez la réception." />
      <Button title="Actualiser" variant="secondary" onPress={load} />
      {loading ? <Loading label="Chargement de vos commandes..." /> : null}
      {!loading && !orders.length ? <Empty title="Pas encore de commande" text="Vos commandes confirmées apparaîtront ici." /> : null}
      {!loading ? orders.map((order) => (
        <Card key={order.id}>
          <Heading
            title={order.ref || "Commande"}
            subtitle={`${order.shop_name || "AfriMarket"} · ${(order.created_at || "").slice(0, 10)}`}
          />
          <Row label="Statut" value={order.status || "—"} />
          <Row label="Montant" value={money(order.total, order.currency)} strong />
          {order.address ? <Row label="Livraison" value={order.address} /> : null}
          {order.tracking_number && !order.delivered_confirmed ? (
            <Button
              title={`Confirmer la réception · ${order.tracking_number}`}
              variant="secondary"
              onPress={() => confirmReceipt(order.tracking_number)}
            />
          ) : null}
        </Card>
      )) : null}
    </Screen>
  );
}

export function WalletScreen() {
  const { requestMain } = useApp();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    requestMain("/wallet")
      .then(setWallet)
      .catch((error) => Alert.alert("Portefeuille", error.message))
      .finally(() => setLoading(false));
  }, [requestMain]);
  return (
    <Screen>
      <Heading title="Mon portefeuille" subtitle="Consultez votre solde disponible." />
      {loading ? <Loading /> : wallet ? (
        <Card>
          <Text style={{ color: colors.muted }}>Solde disponible</Text>
          <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 30, marginTop: 8 }}>
            {money(wallet.total_available || 0, wallet.currency || "")}
          </Text>
        </Card>
      ) : <Empty title="Solde indisponible" />}
    </Screen>
  );
}

export function FavoritesScreen({ navigation }) {
  const { favorites, toggleFavorite, addToCart } = useApp();
  return (
    <Screen>
      <Heading title="Mes favoris" subtitle="Vos produits enregistrés sur cet appareil." />
      {!favorites.length ? <Empty title="Aucun favori" /> : (
        <ProductGrid
          products={favorites}
          navigation={navigation}
          addToCart={addToCart}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
    </Screen>
  );
}

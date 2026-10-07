import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://africashop.win/api/mobile";
const TOKEN_KEY = "afrishop_mobile_token";

async function apiFetch(path, options = {}, token) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || "Request failed");
  }
  return data;
}

function Field({ label, value, onChangeText, secureTextEntry = false, autoCapitalize = "none", keyboardType = "default" }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={styles.input}
        placeholder={label}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}

function AuthScreen({ mode, setMode, onLogin, onRegister, busy }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  return (
    <ScrollView contentContainerStyle={styles.authContainer}>
      <Text style={styles.brand}>Mobil AfriShop</Text>
      <Text style={styles.subtitle}>Application client légère connectée à africashop.win</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, mode === "login" && styles.tabActive]} onPress={() => setMode("login")}>
          <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Connexion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, mode === "register" && styles.tabActive]} onPress={() => setMode("register")}>
          <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>Créer un compte</Text>
        </TouchableOpacity>
      </View>

      {mode === "login" ? (
        <View style={styles.card}>
          <Field label="E-mail" value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" />
          <Field label="Mot de passe" value={loginPassword} onChangeText={setLoginPassword} secureTextEntry />
          <TouchableOpacity
            style={styles.primaryButton}
            disabled={busy}
            onPress={() => onLogin({ email: loginEmail, password: loginPassword })}
          >
            <Text style={styles.primaryButtonText}>{busy ? "Connexion..." : "Se connecter"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Field label="Nom complet" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
          <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Pays" value={country} onChangeText={setCountry} autoCapitalize="words" />
          <TouchableOpacity
            style={styles.primaryButton}
            disabled={busy}
            onPress={() => onRegister({ name, email, password, phone, country, role: "CLIENT" })}
          >
            <Text style={styles.primaryButtonText}>{busy ? "Création..." : "Créer mon compte client"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function HomeScreen({ user, token, onLogout }) {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [shopsData, productsData] = await Promise.all([
          apiFetch("/shops", {}, token),
          apiFetch("/products", {}, token),
        ]);
        if (!mounted) return;
        setShops(shopsData.shops || []);
        setProducts(productsData.products || []);
      } catch (error) {
        Alert.alert("Erreur", error.message);
      } finally {
        if (mounted) setLoadingData(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const headerText = useMemo(() => {
    const locationBits = [user.city, user.country].filter(Boolean);
    return locationBits.length ? locationBits.join(", ") : user.country || "Client AfriShop";
  }, [user]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.homeContainer}>
        <View style={styles.headerCard}>
          <Text style={styles.welcome}>Bonjour {user.name || "Client"}</Text>
          <Text style={styles.helperText}>Connecté à africashop.win</Text>
          <Text style={styles.helperText}>Zone proposée: {headerText}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>

        {loadingData ? (
          <ActivityIndicator size="large" color="#0f766e" style={styles.loader} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Boutiques proches</Text>
              <FlatList
                data={shops.slice(0, 8)}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.listCard}>
                    <Text style={styles.listTitle}>{item.name}</Text>
                    <Text style={styles.listMeta}>
                      {item.city}, {item.country}
                      {typeof item.distance_km === "number" ? ` • ${item.distance_km.toFixed(1)} km` : ""}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Aucune boutique disponible.</Text>}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Articles proposés</Text>
              <FlatList
                data={products.slice(0, 10)}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.listCard}>
                    <Text style={styles.listTitle}>{item.name}</Text>
                    <Text style={styles.listMeta}>
                      {item.shop_name}
                      {typeof item.distance_km === "number" ? ` • ${item.distance_km.toFixed(1)} km` : ""}
                    </Text>
                    <Text style={styles.priceText}>
                      {item.display_price} {item.currency}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Aucun article disponible.</Text>}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("login");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (!savedToken) return;
        const data = await apiFetch("/auth/me", {}, savedToken);
        if (!mounted) return;
        setToken(savedToken);
        setUser(data.user);
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        if (mounted) setBooting(false);
      }
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  async function persistSession(nextToken, nextUser) {
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  async function handleLogin(payload) {
    setBusy(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await persistSession(data.token, data.user);
    } catch (error) {
      Alert.alert("Connexion impossible", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(payload) {
    setBusy(true);
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await persistSession(data.token, data.user);
    } catch (error) {
      Alert.alert("Création impossible", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      if (token) {
        await apiFetch("/auth/logout", { method: "POST" }, token);
      }
    } catch {
      // Ignore remote logout failures and clear local session anyway.
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setMode("login");
    }
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.bootScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.bootText}>Chargement de votre session...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      {token && user ? (
        <HomeScreen user={user} token={token} onLogout={handleLogout} />
      ) : (
        <AuthScreen
          mode={mode}
          setMode={setMode}
          onLogin={handleLogin}
          onRegister={handleRegister}
          busy={busy}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  bootScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  bootText: {
    marginTop: 12,
    color: "#334155",
    fontSize: 15,
  },
  authContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  brand: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
    color: "#475569",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#ffffff",
  },
  tabText: {
    color: "#475569",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    color: "#334155",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: "#0f766e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  homeContainer: {
    padding: 18,
  },
  headerCard: {
    backgroundColor: "#0f766e",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  welcome: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  helperText: {
    marginTop: 6,
    color: "#ccfbf1",
  },
  logoutButton: {
    alignSelf: "flex-end",
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  logoutButtonText: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  loader: {
    marginTop: 40,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
  },
  listCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  listTitle: {
    color: "#0f172a",
    fontWeight: "700",
    marginBottom: 4,
  },
  listMeta: {
    color: "#64748b",
  },
  priceText: {
    marginTop: 8,
    color: "#0f766e",
    fontWeight: "700",
  },
  emptyText: {
    color: "#64748b",
    fontStyle: "italic",
  },
});

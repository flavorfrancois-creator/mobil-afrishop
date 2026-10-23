import "react-native-gesture-handler";
import React from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "./src/context/AppContext";
import { palette } from "./src/components/UI";
import { AuthScreen } from "./src/screens/AuthScreen";
import {
  HomeScreen,
  ProductsScreen,
  ShopsScreen,
  OrdersScreen,
  ProfileScreen,
} from "./src/screens/MainScreens";
import {
  ProductDetailScreen,
  ShopDetailScreen,
  CartScreen,
  CheckoutScreen,
  WalletScreen,
  WithdrawalsScreen,
  FavoritesScreen,
  InviteScreen,
  VerifyScreen,
} from "./src/screens/DetailScreens";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HeaderActions() {
  const navigation = useNavigation();
  const { cartCount } = useApp();

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <TouchableOpacity onPress={() => navigation.navigate("Favorites")}>
        <Ionicons name="heart-outline" size={22} color={palette.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Cart")}>
        <View>
          <Ionicons name="cart-outline" size={22} color={palette.primary} />
          {cartCount > 0 ? (
            <View
              style={{
                position: "absolute",
                top: -6,
                right: -10,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.danger,
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>
                {cartCount}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
}

function HeaderBrand() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Image
        source={require("./assets/afrimarket-logo.png")}
        resizeMode="contain"
        style={{ width: 34, height: 30 }}
      />
      <Text style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>
        AfriMarket
      </Text>
    </View>
  );
}

function MarketplaceTabs() {
  const { user, logout } = useApp();

  return (
    <Tab.Navigator
      initialRouteName="MarketplaceHome"
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#ffffff" },
        headerShadowVisible: false,
        headerTintColor: palette.text,
        headerTitleStyle: { fontWeight: "800" },
        headerTitle: () => <HeaderBrand />,
        headerRight: () => <HeaderActions />,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            MarketplaceHome: "home-outline",
            Products: "grid-outline",
            Shops: "storefront-outline",
            Orders: "receipt-outline",
            Account: "person-outline",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="MarketplaceHome"
        component={HomeScreen}
        options={{ title: "Marketplace" }}
      />
      <Tab.Screen name="Products" component={ProductsScreen} options={{ title: "Produits" }} />
      <Tab.Screen name="Shops" component={ShopsScreen} options={{ title: "Boutiques" }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: "Commandes" }} />
      <Tab.Screen
        name="Account"
        options={{ title: user?.name ? user.name.split(" ")[0] : "Compte" }}
      >
        {(props) => <ProfileScreen {...props} user={user} onLogout={logout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AuthOrApp() {
  const { ready, isAuthenticated } = useApp();

  if (!ready) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerShadowVisible: false,
        headerTintColor: palette.text,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Tabs"
            component={MarketplaceTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Produit" }} />
          <Stack.Screen name="ShopDetail" component={ShopDetailScreen} options={{ title: "Boutique" }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Panier" }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Commander" }} />
          <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: "Portefeuille" }} />
          <Stack.Screen name="Withdrawals" component={WithdrawalsScreen} options={{ title: "Retraits" }} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Favoris" }} />
          <Stack.Screen name="Invite" component={InviteScreen} options={{ title: "Invitation" }} />
          <Stack.Screen name="Verify" component={VerifyScreen} options={{ title: "Verification" }} />
        </>
      )}
    </Stack.Navigator>
  );
}

function AppShell() {
  const { ready, bootstrapError } = useApp();

  React.useEffect(() => {
    if (bootstrapError) {
      Alert.alert("AfriMarket", bootstrapError);
    }
  }, [bootstrapError]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          {ready ? <AuthOrApp /> : null}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

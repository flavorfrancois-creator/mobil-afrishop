import "react-native-gesture-handler";
import React from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "./src/AppContext";
import { AuthScreen } from "./src/AuthScreen";
import {
  CartScreen,
  CheckoutScreen,
  FavoritesScreen,
  HomeScreen,
  OrdersScreen,
  ProductScreen,
  ProductsScreen,
  ShopsScreen,
  WalletScreen,
} from "./src/StoreScreens";
import { AccountScreen } from "./src/AccountScreen";
import { colors } from "./src/ui";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function Brand() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Image
        source={require("./assets/afrimarket-logo.png")}
        resizeMode="contain"
        style={{ width: 34, height: 30 }}
      />
      <Text style={{ color: colors.ink, fontWeight: "900", fontSize: 17 }}>
        AfriMarket
      </Text>
    </View>
  );
}

function HeaderActions() {
  const navigation = useNavigation();
  const { cartCount } = useApp();
  return (
    <TouchableOpacity
      onPress={() => navigation.getParent()?.navigate("Panier")}
      accessibilityRole="button"
      accessibilityLabel={`Panier, ${cartCount} article(s)`}
      style={{ padding: 6 }}
    >
      <Ionicons name="bag-handle-outline" size={24} color={colors.primary} />
      {cartCount > 0 ? (
        <View
          style={{
            position: "absolute",
            right: -3,
            top: -2,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
            backgroundColor: colors.coral,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>
            {cartCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      initialRouteName="Accueil"
      screenOptions={({ route }) => ({
        headerTitle: () => <Brand />,
        headerTitleAlign: "left",
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
        headerRightContainerStyle: { paddingRight: 16 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 9,
          borderTopColor: colors.line,
          backgroundColor: colors.paper,
        },
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11 },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Accueil: "home-outline",
            Produits: "grid-outline",
            Boutiques: "storefront-outline",
            Commandes: "receipt-outline",
            Compte: "person-outline",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Accueil" component={HomeScreen} />
      <Tabs.Screen name="Produits" component={ProductsScreen} />
      <Tabs.Screen name="Boutiques" component={ShopsScreen} />
      <Tabs.Screen name="Commandes" component={OrdersScreen} />
      <Tabs.Screen name="Compte" component={AccountScreen} />
    </Tabs.Navigator>
  );
}

function AppNavigation() {
  const { ready, isAuthenticated, bootstrapError } = useApp();

  React.useEffect(() => {
    if (bootstrapError) Alert.alert("AfriMarket", bootstrapError);
  }, [bootstrapError]);

  if (!ready) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Connexion"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Marketplace"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Produit" component={ProductScreen} />
            <Stack.Screen name="Panier" component={CartScreen} />
            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{ title: "Commander" }}
            />
            <Stack.Screen name="Portefeuille" component={WalletScreen} />
            <Stack.Screen name="Favoris" component={FavoritesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <AppNavigation />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppProvider>
  );
}

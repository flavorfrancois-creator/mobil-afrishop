import React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export const colors = {
  canvas: "#f5f7f4",
  paper: "#ffffff",
  ink: "#15251f",
  muted: "#68766f",
  line: "#e4e9e5",
  primary: "#126b50",
  primaryDark: "#0a4937",
  mint: "#e5f4ec",
  coral: "#d65d43",
  gold: "#e9b84f",
  success: "#238456",
};

export function Screen({ children, contentStyle }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={[styles.screen, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({ title, subtitle, right }) {
  return (
    <View style={styles.heading}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headingTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headingSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled = false,
  variant = "primary",
  style,
}) {
  const secondary = variant === "secondary";
  const danger = variant === "danger";
  return (
    <TouchableOpacity
      activeOpacity={0.84}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        secondary && styles.buttonSecondary,
        danger && styles.buttonDanger,
        disabled && { opacity: 0.56 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  autoCapitalize = "none",
  autoComplete,
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor="#9aa69f"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

export function Pill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
      activeOpacity={0.8}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ProductCard({ product, onPress, onAdd, favorited, onToggleFavorite }) {
  const image = product.image;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.product}>
      <View style={styles.productImageWrap}>
        {image ? (
          <Image
            source={{
              uri: image.startsWith("http") ? image : `https://africashop.win${image.startsWith("/") ? "" : "/"}${image}`,
            }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.imageFallback}>AfriMarket</Text>
        )}
        {onToggleFavorite ? (
          <TouchableOpacity
            onPress={(event) => {
              event?.stopPropagation?.();
              onToggleFavorite();
            }}
            accessibilityRole="button"
            accessibilityLabel={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
            style={{
              position: "absolute",
              right: 8,
              top: 8,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#ffffffee",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: favorited ? colors.coral : colors.ink, fontSize: 18 }}>
              {favorited ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text numberOfLines={2} style={styles.productName}>{product.name}</Text>
      <Text style={styles.productShop} numberOfLines={1}>
        {product.shop_name || "Marketplace"}
      </Text>
      <Text style={styles.productPrice}>
        {product.is_promo
          ? `${Number(product.promo_price || 0).toFixed(2)}`
          : `${Number(product.display_price || 0).toFixed(2)}`}{" "}
        {product.currency || ""}
      </Text>
      {onAdd ? (
        <Button
          title="Ajouter"
          onPress={(event) => {
            event?.stopPropagation?.();
            onAdd();
          }}
          style={{ marginTop: 8, paddingVertical: 10 }}
        />
      ) : null}
    </TouchableOpacity>
  );
}

export function Row({ label, value, strong = false }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowStrong]}>{value}</Text>
    </View>
  );
}

export function Loading({ label = "Chargement..." }) {
  return (
    <View style={{ paddingVertical: 30, alignItems: "center" }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.muted, marginTop: 10 }}>{label}</Text>
    </View>
  );
}

export function Empty({ title, text }) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 28 }}>
      <Text style={{ color: colors.ink, fontWeight: "800", fontSize: 17 }}>
        {title}
      </Text>
      {text ? (
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: 6 }}>
          {text}
        </Text>
      ) : null}
    </Card>
  );
}

export function HorizontalPills({ items, selected, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {items.map((item) => (
        <Pill
          key={item.value}
          label={item.label}
          active={selected === item.value}
          onPress={() => onSelect(item.value)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 14,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  headingTitle: { color: colors.ink, fontWeight: "900", fontSize: 20 },
  headingSubtitle: { color: colors.muted, marginTop: 4, lineHeight: 19 },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    marginTop: 4,
  },
  buttonSecondary: { backgroundColor: colors.mint, borderWidth: 1, borderColor: "#c8e3d3" },
  buttonDanger: { backgroundColor: colors.coral },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  buttonTextSecondary: { color: colors.primaryDark },
  label: { color: colors.ink, fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.ink,
    fontSize: 15,
  },
  multiline: { minHeight: 94, textAlignVertical: "top" },
  pill: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 10,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  pillTextActive: { color: "#fff" },
  product: {
    width: "48.5%",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 10,
    marginBottom: 10,
  },
  productImageWrap: {
    height: 128,
    borderRadius: 13,
    backgroundColor: "#eaf1ec",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageFallback: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  productName: { color: colors.ink, fontWeight: "800", marginTop: 10, minHeight: 36 },
  productShop: { color: colors.muted, fontSize: 12, marginTop: 4 },
  productPrice: { color: colors.primary, fontWeight: "900", marginTop: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowLabel: { color: colors.muted, flex: 1 },
  rowValue: { color: colors.ink, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  rowStrong: { color: colors.primary, fontSize: 16, fontWeight: "900" },
});

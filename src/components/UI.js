import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export const palette = {
  background: "#f8fafc",
  surface: "#ffffff",
  primary: "#0f766e",
  primarySoft: "#ccfbf1",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  danger: "#b91c1c",
  success: "#15803d",
};

export function Screen({ children, padded = true }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{
        padding: padded ? 16 : 0,
        paddingBottom: 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function HeroCard({ title, subtitle, footer }) {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.heroText}>{subtitle}</Text> : null}
      {footer ? <Text style={styles.heroText}>{footer}</Text> : null}
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, subtitle, right }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = "none",
  keyboardType = "default",
  multiline = false,
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor="#94a3b8"
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled = false, tone = "primary" }) {
  const backgroundColor =
    tone === "danger" ? palette.danger : tone === "muted" ? palette.border : palette.primary;
  const textColor = tone === "muted" ? palette.text : "#ffffff";
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, opacity: disabled ? 0.6 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, disabled = false }) {
  return (
    <TouchableOpacity
      style={[styles.secondaryButton, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Chip({ label, active = false, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ToggleRow({ label, helper, value, onValueChange }) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowTitle}>{label}</Text>
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

export function StatsRow({ items }) {
  return (
    <View style={styles.statsRow}>
      {items.map((item) => (
        <Card key={item.label} style={styles.statCard}>
          <Text style={styles.statValue}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </Card>
      ))}
    </View>
  );
}

export function ListCard({ title, subtitle, extra, children, onPress }) {
  const content = (
    <Card style={{ marginBottom: 12 }}>
      <Text style={styles.listTitle}>{title}</Text>
      {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
      {extra ? <Text style={styles.listExtra}>{extra}</Text> : null}
      {children}
    </Card>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      {content}
    </TouchableOpacity>
  );
}

export function EmptyState({ title, description }) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 28 }}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyText}>{description}</Text> : null}
    </Card>
  );
}

export function LoadingState({ label = "Chargement..." }) {
  return (
    <View style={{ paddingVertical: 32, alignItems: "center" }}>
      <ActivityIndicator size="large" color={palette.primary} />
      <Text style={styles.helper}>{label}</Text>
    </View>
  );
}

export function KeyValue({ label, value, tone = "default" }) {
  return (
    <View style={styles.keyValueRow}>
      <Text style={styles.keyValueLabel}>{label}</Text>
      <Text
        style={[
          styles.keyValueValue,
          tone === "success" && { color: palette.success },
          tone === "danger" && { color: palette.danger },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.primary,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
  },
  heroText: {
    color: palette.primarySoft,
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: palette.muted,
    marginTop: 2,
    fontSize: 12,
  },
  label: {
    color: palette.text,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.text,
    backgroundColor: "#ffffff",
  },
  multilineInput: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    marginTop: 8,
  },
  buttonText: {
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    color: palette.text,
    fontWeight: "700",
    fontSize: 14,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  chipActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  chipText: {
    color: palette.text,
    fontWeight: "700",
    fontSize: 12,
  },
  chipTextActive: {
    color: palette.primary,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rowTitle: {
    color: palette.text,
    fontWeight: "700",
    fontSize: 15,
  },
  helper: {
    color: palette.muted,
    marginTop: 6,
    fontSize: 12,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    width: "47%",
    marginBottom: 0,
  },
  statValue: {
    color: palette.primary,
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    color: palette.muted,
    marginTop: 4,
    fontSize: 13,
  },
  listTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
  },
  listSubtitle: {
    color: palette.muted,
    marginTop: 4,
    fontSize: 13,
  },
  listExtra: {
    color: palette.primary,
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyTitle: {
    color: palette.text,
    fontWeight: "800",
    fontSize: 16,
  },
  emptyText: {
    color: palette.muted,
    marginTop: 6,
    textAlign: "center",
  },
  keyValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    gap: 12,
  },
  keyValueLabel: {
    color: palette.muted,
    fontSize: 14,
  },
  keyValueValue: {
    color: palette.text,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "right",
    flexShrink: 1,
  },
});

import React from "react";
import { View } from "react-native";
import { CheckCircle, CircleIcon as Circle, XCircle } from "phosphor-react-native";

import { Order } from "@/src/api/types";
import { useI18n } from "@/src/i18n";
import { makeStyles, spacing, useTheme } from "@/src/theme";
import { Txt } from "./Txt";

// Same step order as the africashop.win website.
const STEPS: { key: string; label: string; aliases: string[] }[] = [
  { key: "NOUVELLE", label: "stepPlaced", aliases: ["NOUVELLE", "EN_ATTENTE"] },
  { key: "APPROUVEE", label: "stepApproved", aliases: ["APPROUVEE"] },
  { key: "EN_PREPARATION", label: "stepPreparing", aliases: ["EN_PREPARATION"] },
  { key: "PRETE", label: "stepReady", aliases: ["PRETE"] },
  { key: "EXPEDIEE", label: "stepShipped", aliases: ["EXPEDIEE"] },
  { key: "LIVREE", label: "stepDelivered", aliases: ["LIVREE"] },
];

const TERMINAL: Record<string, string> = {
  ANNULEE: "statusCancelled",
  REJETEE: "statusRejected",
  REMBOURSEE: "statusRefunded",
};

export function stepIndex(status?: string) {
  const s = (status || "").toUpperCase();
  return STEPS.findIndex((st) => st.aliases.includes(s));
}

export function statusLabelKey(status?: string) {
  const s = (status || "").toUpperCase();
  if (TERMINAL[s]) return TERMINAL[s];
  const i = stepIndex(s);
  return i >= 0 ? STEPS[i].label : null;
}

const LOCALES: Record<string, string> = { fr: "fr-FR", en: "en-US", es: "es-ES" };

function fmtDate(iso: string | undefined, lang: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : `${d.toLocaleDateString(LOCALES[lang])} ${d.toLocaleTimeString(LOCALES[lang], { hour: "2-digit", minute: "2-digit" })}`;
}

/** Compact progress bar shown on every order card. */
export function OrderProgress({ status }: { status?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const terminal = !!TERMINAL[(status || "").toUpperCase()];
  const current = stepIndex(status);
  return (
    <View style={styles.bar}>
      {STEPS.map((s, i) => (
        <View
          key={s.key}
          style={[
            styles.seg,
            { backgroundColor: terminal ? colors.border : i <= current ? colors.brandPrimary : colors.surfaceTertiary },
          ]}
        />
      ))}
    </View>
  );
}

/** Full vertical timeline, from order placed to delivered. */
export function OrderTimeline({ order }: { order: Order }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const status = (order.status || "").toUpperCase();
  const terminalKey = TERMINAL[status];
  const current = stepIndex(status);

  const reachedAt = (aliases: string[]) =>
    [...(order.status_history ?? [])].reverse().find((h) => aliases.includes((h.status || "").toUpperCase()))?.at;

  return (
    <View style={styles.timeline} testID={`order-timeline-${order.ref}`}>
      {STEPS.map((s, i) => {
        const done = !terminalKey && i <= current;
        const isCurrent = !terminalKey && i === current;
        const at = reachedAt(s.aliases) ?? (i === 0 ? order.created_at : undefined);
        const last = i === STEPS.length - 1;
        return (
          <View key={s.key} style={styles.stepRow}>
            <View style={styles.rail}>
              {done ? (
                <CheckCircle size={22} color={colors.brandPrimary} weight="fill" />
              ) : (
                <Circle size={22} color={colors.border} weight="bold" />
              )}
              {!last && <View style={[styles.line, { backgroundColor: i < current && !terminalKey ? colors.brandPrimary : colors.border }]} />}
            </View>
            <View style={styles.stepText}>
              <Txt size="sm" weight={isCurrent ? "bold" : done ? "semibold" : "regular"} color={done ? "onSurface" : "muted"}>
                {t(s.label)}
              </Txt>
              {done && !!at && (
                <Txt size="xs" color="muted">
                  {fmtDate(at, lang)}
                </Txt>
              )}
            </View>
          </View>
        );
      })}
      {!!terminalKey && (
        <View style={styles.stepRow}>
          <View style={styles.rail}>
            <XCircle size={22} color={colors.error} weight="fill" />
          </View>
          <View style={styles.stepText}>
            <Txt size="sm" weight="bold" color="error">
              {t(terminalKey)}
            </Txt>
            {!!reachedAt([status]) && (
              <Txt size="xs" color="muted">
                {fmtDate(reachedAt([status]), lang)}
              </Txt>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  bar: { flexDirection: "row", gap: 4, marginTop: spacing.xs },
  seg: { flex: 1, height: 6, borderRadius: 3 },
  timeline: { paddingTop: spacing.sm },
  stepRow: { flexDirection: "row", gap: spacing.md },
  rail: { alignItems: "center", width: 22 },
  line: { width: 2, flex: 1, minHeight: 18, marginVertical: 2 },
  stepText: { flex: 1, paddingBottom: spacing.md, gap: 2 },
}));

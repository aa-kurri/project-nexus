"use client";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { CreditCard, Clock, TrendingUp, AlertCircle } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { Card }  from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import TopBar from "../../../components/hospital/TopBar";
import { getTodayCharges, recordPayment } from "./actions";
import { useAuthStore } from "../../../store/authStore";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

const STATUS_COLOR: Record<string, string> = {
  draft:           "#f59e0b",
  finalized:       "#6366f1",
  "partially-paid":"#f97316",
  paid:            "#059669",
  void:            "#6b7280",
};

const STATUS_LABEL: Record<string, string> = {
  draft:           "Pending",
  finalized:       "Finalized",
  "partially-paid":"Partial",
  paid:            "Paid",
  void:            "Void",
};

interface BillRow {
  id:      string;
  patient: string;
  amount:  number;
  due:     string;
  status:  string;
  items:   number;
}

interface SummaryStats {
  collected: number;
  pending:   number;
  partial:   number;
}

function computeStats(bills: BillRow[]): SummaryStats {
  return {
    collected: bills.filter((b) => b.status === "paid")
                   .reduce((s, b) => s + b.amount, 0),
    pending:   bills.filter((b) => b.status === "draft" || b.status === "finalized")
                   .reduce((s, b) => s + b.amount, 0),
    partial:   bills.filter((b) => b.status === "partially-paid")
                   .reduce((s, b) => s + b.amount, 0),
  };
}

function fmtCurrency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ── List header ───────────────────────────────────────────────────────────────
function ListHeader({ stats, loading }: { stats: SummaryStats; loading: boolean }) {
  return (
    <>
      <TopBar title="Billing" />
      <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ color: "#9ca3af", fontSize: 11, fontWeight: "600",
          textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
          Today's Summary
        </Text>
        <View style={{ flexDirection: "row" }}>
          {[
            { label: "Collected", value: fmtCurrency(stats.collected), icon: TrendingUp,  color: PRIMARY   },
            { label: "Pending",   value: fmtCurrency(stats.pending),   icon: Clock,       color: "#f59e0b" },
            { label: "Partial",   value: fmtCurrency(stats.partial),   icon: AlertCircle, color: "#f97316" },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <View key={label} style={{ flex: 1,
              borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: BORDER,
              paddingLeft: i > 0 ? 14 : 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <Icon size={12} color={color} />
                <Text style={{ color: "#6b7280", fontSize: 10, fontWeight: "600",
                  textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</Text>
              </View>
              <Text style={{ color: "#f9fafb", fontSize: 17, fontWeight: "700" }}>
                {loading ? "—" : value}
              </Text>
            </View>
          ))}
        </View>
      </Card>
      <Text style={{ color: "#6b7280", fontSize: 12, fontWeight: "600",
        textTransform: "uppercase", letterSpacing: 0.5,
        marginHorizontal: 20, marginBottom: 8 }}>
        Charges
      </Text>
    </>
  );
}

// ── Bill row ──────────────────────────────────────────────────────────────────
function BillItem({
  bill, isFirst, isLast, onPay, paying,
}: {
  bill: BillRow; isFirst: boolean; isLast: boolean;
  onPay: (id: string) => void; paying: boolean;
}) {
  const color = STATUS_COLOR[bill.status] ?? "#6b7280";
  return (
    <Pressable
      onPress={() => { if (bill.status !== "paid" && bill.status !== "void") onPay(bill.id); }}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center",
        marginHorizontal: 16,
        backgroundColor: SURFACE,
        borderWidth: 1, borderColor: BORDER,
        borderTopLeftRadius:     isFirst ? 16 : 0,
        borderTopRightRadius:    isFirst ? 16 : 0,
        borderBottomLeftRadius:  isLast  ? 16 : 0,
        borderBottomRightRadius: isLast  ? 16 : 0,
        marginTop: isFirst ? 0 : -1,
        paddingHorizontal: 16, paddingVertical: 14,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 10,
        backgroundColor: `${color}15`, alignItems: "center",
        justifyContent: "center", marginRight: 12 }}>
        {paying
          ? <ActivityIndicator size="small" color={color} />
          : <CreditCard size={18} color={color} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{bill.patient}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
          <Clock size={11} color="#6b7280" />
          <Text style={{ color: "#6b7280", fontSize: 12 }}>
            {fmtDate(bill.due)} · {bill.items} item{bill.items !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Text style={{ color: "#f9fafb", fontWeight: "700" }}>{fmtCurrency(bill.amount)}</Text>
        <Badge label={STATUS_LABEL[bill.status] ?? bill.status} color={color} />
      </View>
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function BillingScreen() {
  const { profile }               = useAuthStore();
  const [bills,   setBills]       = useState<BillRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [paying,  setPaying]      = useState<string | null>(null);
  const [error,   setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const charges = await getTodayCharges(profile.tenant_id);
      setBills(
        charges.map((c) => ({
          id:      c.id,
          patient: c.patientName,
          amount:  c.amount,
          due:     c.dueDate,
          status:  c.status,
          items:   c.itemCount,
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  async function handlePay(billId: string) {
    setPaying(billId);
    try {
      await recordPayment(billId);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPaying(null);
    }
  }

  const stats = computeStats(bills);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {error && (
        <View style={{ margin: 16, backgroundColor: "#ef444420", borderRadius: 12,
          borderWidth: 1, borderColor: "#ef444440", padding: 12, zIndex: 10 }}>
          <Text style={{ color: "#f87171", fontSize: 13 }}>{error}</Text>
        </View>
      )}
      <FlatList
        data={loading ? [] : bills}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ListHeader stats={stats} loading={loading} />}
        ListEmptyComponent={
          loading ? (
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <ActivityIndicator color={PRIMARY} size="large" />
              <Text style={{ color: "#6b7280", marginTop: 12 }}>Loading bills…</Text>
            </View>
          ) : (
            <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 40 }}>
              No bills today.
            </Text>
          )
        }
        renderItem={({ item, index }) => (
          <BillItem
            bill={item}
            isFirst={index === 0}
            isLast={index === bills.length - 1}
            onPay={handlePay}
            paying={paying === item.id}
          />
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

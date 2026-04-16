"use client";
import { View, Text, FlatList, Pressable } from "react-native";
import { CreditCard, Clock, TrendingUp, AlertCircle } from "lucide-react-native";
import { Card }   from "../../../components/ui/card";
import { Badge }  from "../../../components/ui/badge";
import { TopBar } from "../../../components/hospital/TopBar";
import { getTodayCharges, recordPayment } from "./actions";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// ── Types ─────────────────────────────────────────────────────────────────────
type BillStatus = "pending" | "partial" | "paid" | "overdue";

const STATUS_COLOR: Record<BillStatus, string> = {
  pending:  "#f59e0b",
  partial:  "#6366f1",
  paid:     "#059669",
  overdue:  "#ef4444",
};

interface BillRow {
  id:      string;
  patient: string;
  amount:  string;
  due:     string;
  status:  BillStatus;
  items:   number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// TODO: getTodayCharges() — SELECT b.id, p.full_name, b.status,
//       SUM(bi.unit_price * bi.qty) AS amount, b.due_date,
//       COUNT(bi.id) AS item_count
//       FROM bills b
//       JOIN patients p ON p.id = b.patient_id
//       JOIN bill_items bi ON bi.bill_id = b.id
//       WHERE b.tenant_id = jwt_tenant() AND DATE(b.created_at) = CURRENT_DATE
//       GROUP BY b.id, p.full_name, b.status, b.due_date
const MOCK_BILLS: BillRow[] = [
  { id: "BILL-1001", patient: "Ramesh Kumar", amount: "₹4,500",  due: "Today",    status: "pending", items: 3 },
  { id: "BILL-1002", patient: "Priya Sharma", amount: "₹12,800", due: "Tomorrow", status: "pending", items: 7 },
  { id: "BILL-1003", patient: "Anita Verma",  amount: "₹2,200",  due: "Apr 18",   status: "partial", items: 2 },
  { id: "BILL-1004", patient: "Suresh Patel", amount: "₹8,750",  due: "Apr 20",   status: "pending", items: 5 },
  { id: "BILL-1005", patient: "Kavita Desai", amount: "₹1,100",  due: "Apr 12",   status: "overdue", items: 1 },
  { id: "BILL-1006", patient: "Arjun Mehta",  amount: "₹6,300",  due: "Apr 15",   status: "paid",    items: 4 },
];

// ── List header ───────────────────────────────────────────────────────────────
function ListHeader() {
  return (
    <>
      <TopBar title="Billing" />

      {/* Today's charges summary strip */}
      <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ color: "#9ca3af", fontSize: 11, fontWeight: "600",
          textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
          Today's Summary
        </Text>
        <View style={{ flexDirection: "row" }}>
          {[
            { label: "Collected", value: "₹38,200", icon: TrendingUp,  color: PRIMARY    },
            { label: "Pending",   value: "₹28,250", icon: Clock,       color: "#f59e0b"  },
            { label: "Overdue",   value: "₹1,100",  icon: AlertCircle, color: "#ef4444"  },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <View key={label} style={{ flex: 1,
              borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: BORDER,
              paddingLeft: i > 0 ? 14 : 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <Icon size={12} color={color} />
                <Text style={{ color: "#6b7280", fontSize: 10, fontWeight: "600",
                  textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</Text>
              </View>
              <Text style={{ color: "#f9fafb", fontSize: 17, fontWeight: "700" }}>{value}</Text>
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
function BillItem({ bill, isFirst, isLast }: { bill: BillRow; isFirst: boolean; isLast: boolean }) {
  const color = STATUS_COLOR[bill.status];
  return (
    <Pressable
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center",
        marginHorizontal: 16,
        backgroundColor: SURFACE,
        borderWidth: 1, borderColor: BORDER,
        borderTopLeftRadius:     isFirst ? 16 : 0,
        borderTopRightRadius:    isFirst ? 16 : 0,
        borderBottomLeftRadius:  isLast  ? 16 : 0,
        borderBottomRightRadius: isLast  ? 16 : 0,
        marginTop:   isFirst ? 0 : -1,
        paddingHorizontal: 16, paddingVertical: 14,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {/* TODO: recordPayment(bill.id) — upsert bills.status='paid', set paid_at = now() */}
      <View style={{ width: 40, height: 40, borderRadius: 10,
        backgroundColor: `${color}15`, alignItems: "center",
        justifyContent: "center", marginRight: 12 }}>
        <CreditCard size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{bill.patient}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
          <Clock size={11} color="#6b7280" />
          <Text style={{ color: "#6b7280", fontSize: 12 }}>
            Due {bill.due} · {bill.items} item{bill.items !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Text style={{ color: "#f9fafb", fontWeight: "700" }}>{bill.amount}</Text>
        <Badge label={bill.status} color={color} />
      </View>
    </Pressable>
  );
}

export default function BillingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <FlatList
        data={MOCK_BILLS}
        keyExtractor={item => item.id}
        ListHeaderComponent={<ListHeader />}
        renderItem={({ item, index }) => (
          <BillItem
            bill={item}
            isFirst={index === 0}
            isLast={index === MOCK_BILLS.length - 1}
          />
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

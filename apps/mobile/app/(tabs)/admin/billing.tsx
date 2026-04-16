import { View, Text, ScrollView, Pressable } from "react-native";
import { CreditCard, ChevronRight, Clock } from "lucide-react-native";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// TODO: fetch from bills joined with patients via actions.getPendingBills()
const MOCK_BILLS = [
  { id: "BILL-1001", patient: "Ramesh Kumar", amount: "₹4,500", due: "Today",     status: "pending" },
  { id: "BILL-1002", patient: "Priya Sharma", amount: "₹12,800",due: "Tomorrow",  status: "pending" },
  { id: "BILL-1003", patient: "Anita Verma",  amount: "₹2,200", due: "Apr 18",    status: "partial" },
  { id: "BILL-1004", patient: "Suresh Patel", amount: "₹8,750", due: "Apr 20",    status: "pending" },
];

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#f59e0b20", text: "#fcd34d" },
  partial: { bg: "#6366f120", text: "#a5b4fc" },
  paid:    { bg: "#05966920", text: "#6ee7b7" },
};

export default function BillingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>Billing</Text>
      </View>

      {/* Summary strip */}
      <View style={{ marginHorizontal: 16, marginBottom: 16,
        backgroundColor: SURFACE, borderRadius: 16,
        borderWidth: 1, borderColor: BORDER,
        flexDirection: "row", padding: 16, gap: 0 }}>
        {[
          { label: "Today's Collection", value: "₹38,200" },
          { label: "Pending",            value: "₹28,250" },
          { label: "Overdue",            value: "₹6,500"  },
        ].map((s, i) => (
          <View key={s.label} style={{ flex: 1,
            borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: BORDER,
            paddingLeft: i > 0 ? 16 : 0 }}>
            <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "700" }}>{s.value}</Text>
            <Text style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={{ color: "#6b7280", fontSize: 12, fontWeight: "600",
          textTransform: "uppercase", letterSpacing: 0.5,
          marginHorizontal: 20, marginBottom: 10 }}>
          Pending Bills
        </Text>
        <View style={{ marginHorizontal: 16, borderRadius: 16,
          backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
          {MOCK_BILLS.map((bill, i) => (
            <Pressable
              key={bill.id}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {/* TODO: actions.recordPayment() */}
              <View style={{ width: 40, height: 40, borderRadius: 10,
                backgroundColor: `${PRIMARY}15`, alignItems: "center",
                justifyContent: "center", marginRight: 12 }}>
                <CreditCard size={18} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{bill.patient}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <Clock size={11} color="#6b7280" />
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Due {bill.due}</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={{ color: "#f9fafb", fontWeight: "700" }}>{bill.amount}</Text>
                <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
                  backgroundColor: STATUS_STYLE[bill.status].bg }}>
                  <Text style={{ fontSize: 10, fontWeight: "700",
                    color: STATUS_STYLE[bill.status].text, textTransform: "capitalize" }}>
                    {bill.status}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

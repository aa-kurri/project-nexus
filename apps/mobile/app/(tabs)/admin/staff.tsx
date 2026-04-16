"use client";
import { View, Text, FlatList, Pressable, Modal } from "react-native";
import { useState } from "react";
import { ChevronDown, X } from "lucide-react-native";
import { Input }  from "../../../components/ui/input";
import { Badge }  from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { TopBar } from "../../../components/hospital/TopBar";
import { updateStaffRole, getStaffList } from "./actions";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// ── Types ─────────────────────────────────────────────────────────────────────
type StaffRole = "doctor" | "nurse" | "pharmacist" | "lab_manager" | "admin" | "staff";

const ROLE_LABEL: Record<StaffRole, string> = {
  doctor:      "Doctor",
  nurse:       "Nurse",
  pharmacist:  "Pharmacist",
  lab_manager: "Lab Manager",
  admin:       "Admin",
  staff:       "Staff",
};

const ROLE_COLOR: Record<StaffRole, string> = {
  doctor:      PRIMARY,
  nurse:       "#6366f1",
  pharmacist:  "#f59e0b",
  lab_manager: "#ec4899",
  admin:       "#8b5cf6",
  staff:       "#6b7280",
};

const ALL_ROLES: StaffRole[] = ["doctor", "nurse", "pharmacist", "lab_manager", "admin", "staff"];

interface StaffMember {
  id:     string;
  name:   string;
  role:   StaffRole;
  dept:   string;
  status: "on_duty" | "off_duty";
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// TODO: getStaffList() — SELECT id, full_name, role, department, duty_status
//       FROM profiles
//       WHERE tenant_id = jwt_tenant() AND role != 'patient'
//       ORDER BY role, full_name
const MOCK_STAFF: StaffMember[] = [
  { id: "s1", name: "Dr. Anita Mehta",  role: "doctor",      dept: "Cardiology",  status: "on_duty"  },
  { id: "s2", name: "Ravi Nair",        role: "nurse",       dept: "ICU",         status: "on_duty"  },
  { id: "s3", name: "Sunita Desai",     role: "pharmacist",  dept: "Pharmacy",    status: "off_duty" },
  { id: "s4", name: "Dr. Kiran Patel",  role: "doctor",      dept: "Orthopaedics",status: "on_duty"  },
  { id: "s5", name: "Meena Rao",        role: "lab_manager", dept: "Pathology",   status: "on_duty"  },
  { id: "s6", name: "Arjun Singh",      role: "staff",       dept: "Housekeeping",status: "on_duty"  },
  { id: "s7", name: "Priya Nambiar",    role: "nurse",       dept: "Maternity",   status: "off_duty" },
  { id: "s8", name: "Vikram Joshi",     role: "admin",       dept: "Finance",     status: "on_duty"  },
];

// ── Role picker modal ─────────────────────────────────────────────────────────
function RolePicker({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible:  boolean;
  current:  StaffRole;
  onSelect: (role: StaffRole) => void;
  onClose:  () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 20,
          borderTopRightRadius: 20, padding: 20, paddingBottom: 36 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between",
            alignItems: "center", marginBottom: 16 }}>
            <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 16 }}>
              Change Role
            </Text>
            <Pressable onPress={onClose}>
              <X size={20} color="#6b7280" />
            </Pressable>
          </View>
          {ALL_ROLES.map(role => (
            <Pressable
              key={role}
              onPress={() => onSelect(role)}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center",
                paddingVertical: 13, paddingHorizontal: 4,
                borderBottomWidth: 1, borderBottomColor: BORDER,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5,
                backgroundColor: ROLE_COLOR[role], marginRight: 12 }} />
              <Text style={{ color: role === current ? PRIMARY : "#e5e7eb",
                fontWeight: role === current ? "700" : "400", fontSize: 15 }}>
                {ROLE_LABEL[role]}
              </Text>
              {role === current && (
                <Text style={{ color: PRIMARY, marginLeft: "auto", fontSize: 12 }}>
                  Current
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Staff row ─────────────────────────────────────────────────────────────────
function StaffRow({
  member,
  isFirst,
  isLast,
  onRolePress,
}: {
  member:      StaffMember;
  isFirst:     boolean;
  isLast:      boolean;
  onRolePress: (member: StaffMember) => void;
}) {
  const color = ROLE_COLOR[member.role];
  const initials = member.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: SURFACE,
      borderWidth: 1, borderColor: BORDER,
      borderTopLeftRadius:     isFirst ? 16 : 0,
      borderTopRightRadius:    isFirst ? 16 : 0,
      borderBottomLeftRadius:  isLast  ? 16 : 0,
      borderBottomRightRadius: isLast  ? 16 : 0,
      marginTop: isFirst ? 0 : -1,
    }}>
      {/* Avatar */}
      <View style={{ width: 42, height: 42, borderRadius: 21,
        backgroundColor: `${color}20`, alignItems: "center",
        justifyContent: "center", marginRight: 12 }}>
        <Text style={{ color, fontWeight: "700", fontSize: 14 }}>{initials}</Text>
      </View>

      {/* Name + dept */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{member.name}</Text>
        <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{member.dept}</Text>
      </View>

      {/* Duty indicator + role picker */}
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4,
            backgroundColor: member.status === "on_duty" ? "#059669" : "#6b7280" }} />
          <Text style={{ color: "#6b7280", fontSize: 11 }}>
            {member.status === "on_duty" ? "On duty" : "Off duty"}
          </Text>
        </View>
        <Pressable
          onPress={() => onRolePress(member)}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 4,
            paddingHorizontal: 8, paddingVertical: 4,
            borderRadius: 8, borderWidth: 1, borderColor: `${color}50`,
            backgroundColor: `${color}10`,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {/* TODO: updateStaffRole(member.id, newRole) — UPDATE profiles SET role = $1 WHERE id = $2 AND tenant_id = jwt_tenant() */}
          <Text style={{ color, fontSize: 11, fontWeight: "700" }}>
            {ROLE_LABEL[member.role]}
          </Text>
          <ChevronDown size={11} color={color} />
        </Pressable>
      </View>
    </View>
  );
}

export default function StaffScreen() {
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState<StaffMember | null>(null);

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    ROLE_LABEL[s.role].toLowerCase().includes(query.toLowerCase()) ||
    s.dept.toLowerCase().includes(query.toLowerCase())
  );

  function handleRoleSelect(newRole: StaffRole) {
    if (!picking) return;
    // Optimistic update
    setStaff(prev =>
      prev.map(s => s.id === picking.id ? { ...s, role: newRole } : s)
    );
    // TODO: updateStaffRole(picking.id, newRole) — server action stub
    updateStaffRole(picking.id, newRole).catch(() => {
      // Revert on failure
      setStaff(prev =>
        prev.map(s => s.id === picking.id ? { ...s, role: picking.role } : s)
      );
    });
    setPicking(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <TopBar title="Staff Directory" />

      {/* Search */}
      <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
        <Input
          icon
          placeholder="Search by name, role, or dept…"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Staff count badge */}
      <Text style={{ color: "#6b7280", fontSize: 12, fontWeight: "600",
        textTransform: "uppercase", letterSpacing: 0.5,
        marginHorizontal: 20, marginBottom: 8 }}>
        {filtered.length} staff member{filtered.length !== 1 ? "s" : ""}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={{ marginHorizontal: 16 }}>
            <StaffRow
              member={item}
              isFirst={index === 0}
              isLast={index === filtered.length - 1}
              onRolePress={setPicking}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* Role picker bottom sheet */}
      <RolePicker
        visible={!!picking}
        current={picking?.role ?? "staff"}
        onSelect={handleRoleSelect}
        onClose={() => setPicking(null)}
      />
    </View>
  );
}

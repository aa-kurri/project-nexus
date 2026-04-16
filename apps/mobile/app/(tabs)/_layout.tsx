import { Tabs } from "expo-router";
import {
  Home, Calendar, FileText, Activity, User,
  List, Users, Mic, Pill,
  LayoutDashboard, Bed, CreditCard, UserCog,
  CheckSquare, Thermometer, Package, FlaskConical,
  MoreHorizontal,
} from "lucide-react-native";
import { useAuthStore } from "../../store/authStore";

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIMARY   = "#0F766E";
const INACTIVE  = "#6b7280";
const TAB_BG    = "hsl(220, 13%, 9%)";
const TAB_BORDER = "#1e2332";

const TAB_BAR_STYLE = {
  backgroundColor: TAB_BG,
  borderTopColor:  TAB_BORDER,
  paddingBottom:   4,
  height:          60,
} as const;

const LABEL_STYLE = { fontSize: 11, fontWeight: "600" as const };

// href: undefined → tab button visible
// href: null      → tab button hidden (screen still navigable)
type HideWhen = boolean; // true = hide (href: null), false = show (href: undefined)
const hide = (cond: HideWhen) => (cond ? null : undefined);

export default function TabLayout() {
  const mobileRole = useAuthStore((s) => s.mobileRole);

  const isPatient = mobileRole === "patient";
  const isDoctor  = mobileRole === "doctor";
  const isAdmin   = mobileRole === "admin";
  const isStaff   = mobileRole === "staff";
  const isNonPatient = !isPatient;

  return (
    <Tabs
      screenOptions={{
        headerShown:              false,
        tabBarActiveTintColor:    PRIMARY,
        tabBarInactiveTintColor:  INACTIVE,
        tabBarStyle:              TAB_BAR_STYLE,
        tabBarLabelStyle:         LABEL_STYLE,
      }}
    >
      {/* ════════════════ PATIENT tabs ════════════════ */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          href:  hide(!isPatient),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="appointments/index"
        options={{
          title: "Appointments",
          href:  hide(!isPatient),
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="reports/index"
        options={{
          title: "Reports",
          href:  hide(!isPatient),
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="health/index"
        options={{
          title: "Health",
          href:  hide(!isPatient),
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          href:  hide(!isPatient),
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} />,
        }}
      />

      {/* ════════════════ DOCTOR tabs ════════════════ */}
      <Tabs.Screen
        name="queue/index"
        options={{
          title: "Queue",
          href:  hide(!isDoctor),
          tabBarIcon: ({ color, size }) => <List color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="patients/index"
        options={{
          title: "Patients",
          href:  hide(!isDoctor),
          tabBarIcon: ({ color, size }) => <Users color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="scribe/index"
        options={{
          title: "Scribe",
          href:  hide(!isDoctor),
          tabBarIcon: ({ color, size }) => <Mic color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="rx/index"
        options={{
          title: "Rx",
          href:  hide(!isDoctor),
          tabBarIcon: ({ color, size }) => <Pill color={color} size={size - 2} />,
        }}
      />

      {/* ════════════════ ADMIN tabs ════════════════ */}
      <Tabs.Screen
        name="admin/dashboard"
        options={{
          title: "Dashboard",
          href:  hide(!isAdmin),
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="admin/beds"
        options={{
          title: "Beds",
          href:  hide(!isAdmin),
          tabBarIcon: ({ color, size }) => <Bed color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="admin/billing"
        options={{
          title: "Billing",
          href:  hide(!isAdmin),
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="admin/staff"
        options={{
          title: "Staff",
          href:  hide(!isAdmin),
          tabBarIcon: ({ color, size }) => <UserCog color={color} size={size - 2} />,
        }}
      />
      {/* feature-flags is reachable from More, not a top-level tab */}
      <Tabs.Screen name="admin/feature-flags" options={{ href: null }} />

      {/* ════════════════ STAFF tabs ════════════════ */}
      <Tabs.Screen
        name="tasks/index"
        options={{
          title: "Tasks",
          href:  hide(!isStaff),
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="vitals/index"
        options={{
          title: "Vitals",
          href:  hide(!isStaff),
          tabBarIcon: ({ color, size }) => <Thermometer color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="dispense/index"
        options={{
          title: "Dispense",
          href:  hide(!isStaff),
          tabBarIcon: ({ color, size }) => <Package color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="lab/index"
        options={{
          title: "Lab",
          href:  hide(!isStaff),
          tabBarIcon: ({ color, size }) => <FlaskConical color={color} size={size - 2} />,
        }}
      />

      {/* ════════════════ SHARED More (doctor / admin / staff) ════════════════ */}
      <Tabs.Screen
        name="more/index"
        options={{
          title: "More",
          href:  hide(isPatient),
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size - 2} />,
        }}
      />

      {/* ── sub-routes that must not appear as tabs ───────────────────────── */}
      <Tabs.Screen name="reports/[id]"          options={{ href: null }} />
      <Tabs.Screen name="appointments/booking"  options={{ href: null }} />
      <Tabs.Screen name="patients/[id]"         options={{ href: null }} />
    </Tabs>
  );
}

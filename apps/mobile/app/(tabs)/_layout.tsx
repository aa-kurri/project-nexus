import { Tabs } from "expo-router";
import { Home, FileText, Calendar, User, Activity } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0F766E",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#f3f4f6",
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} /> }}
      />
      <Tabs.Screen
        name="reports/index"
        options={{ title: "Reports", tabBarIcon: ({ color, size }) => <FileText color={color} size={size - 2} /> }}
      />
      <Tabs.Screen
        name="appointments/index"
        options={{ title: "Appointments", tabBarIcon: ({ color, size }) => <Calendar color={color} size={size - 2} /> }}
      />
      <Tabs.Screen
        name="health/index"
        options={{ title: "Health", tabBarIcon: ({ color, size }) => <Activity color={color} size={size - 2} /> }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} /> }}
      />
    </Tabs>
  );
}

import { View, Text, ScrollView, Pressable } from "react-native";
import { Calendar, MapPin, Clock } from "lucide-react-native";

const APPOINTMENTS = [
  { id: "A-101", doctor: "Dr. Sharma",  specialty: "General OPD",  date: "Apr 15, 2026", time: "10:30 AM", location: "OPD Block 2, Room 4", status: "confirmed" },
  { id: "A-100", doctor: "Dr. Rao",     specialty: "Endocrinology", date: "Apr 22, 2026", time: "09:00 AM", location: "OPD Block 1, Room 11", status: "confirmed" },
  { id: "A-099", doctor: "Dr. Menon",   specialty: "Cardiology",    date: "May 3, 2026",  time: "11:00 AM", location: "Cardiology Wing",       status: "pending" },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: "#d1fae5", text: "#059669", label: "Confirmed" },
  pending:   { bg: "#fef3c7", text: "#d97706", label: "Pending" },
};

export default function AppointmentsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="px-5 pt-14 pb-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Appointments</Text>
        <Text className="text-xs text-gray-400 mt-1">Upcoming visits</Text>
      </View>

      <View className="px-5 mt-4 space-y-3">
        {APPOINTMENTS.map(a => {
          const s = STATUS_STYLE[a.status];
          return (
            <View key={a.id} className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5">
              <View className="flex-row items-start justify-between mb-3">
                <View>
                  <Text className="font-bold text-gray-900 text-base">{a.doctor}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{a.specialty}</Text>
                </View>
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: s.bg }}>
                  <Text className="text-xs font-semibold" style={{ color: s.text }}>{s.label}</Text>
                </View>
              </View>
              <View className="space-y-1.5 border-t border-gray-100 pt-3">
                <View className="flex-row items-center gap-2">
                  <Calendar size={13} color="#9ca3af" />
                  <Text className="text-sm text-gray-600">{a.date}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Clock size={13} color="#9ca3af" />
                  <Text className="text-sm text-gray-600">{a.time}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <MapPin size={13} color="#9ca3af" />
                  <Text className="text-sm text-gray-600">{a.location}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

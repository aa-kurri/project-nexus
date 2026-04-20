import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { CheckSquare, Clock, AlertCircle } from "lucide-react-native";
import { useAuthStore } from "../../../store/authStore";
import { fetchMyTasks, completeTask, type Task, type Priority } from "./actions";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: "#ef4444",
  normal: "#f59e0b",
  low:    "#6b7280",
};

function dueLabel(dueAt: string | null): string {
  if (!dueAt) return "";
  const d = new Date(dueAt);
  const now = new Date();
  if (d < now) return "OVERDUE";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function TasksScreen() {
  const { profile } = useAuthStore();

  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!profile) return;
    soft ? setRefreshing(true) : setLoading(true);
    try {
      const data = await fetchMyTasks(profile.id, profile.tenant_id);
      setTasks(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (taskId: string) => {
    setCompleting(taskId);
    try {
      await completeTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  const pending  = tasks.filter(t => t.status !== "completed");
  const urgentN  = pending.filter(t => t.priority === "urgent").length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={PRIMARY} />}
    >
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>
          My Tasks — Today
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          {pending.length} pending{urgentN > 0 ? ` · ${urgentN} urgent` : ""}
        </Text>
      </View>

      {error && (
        <View style={{ margin: 16, backgroundColor: "#ef444420", borderRadius: 12,
          borderWidth: 1, borderColor: "#f87171", padding: 12 }}>
          <Text style={{ color: "#f87171", fontSize: 13 }}>{error}</Text>
        </View>
      )}

      <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
        {pending.length === 0 ? (
          <View style={{ padding: 24, alignItems: "center" }}>
            <CheckSquare size={28} color="#059669" />
            <Text style={{ color: "#059669", marginTop: 8, fontWeight: "600" }}>All tasks done!</Text>
          </View>
        ) : pending.map((task, i) => {
          const label = dueLabel(task.due_at);
          const isOverdue = label === "OVERDUE";
          return (
            <Pressable
              key={task.id}
              onPress={() => handleComplete(task.id)}
              disabled={completing === task.id}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                opacity: pressed || completing === task.id ? 0.6 : 1,
              })}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10,
                backgroundColor: `${PRIORITY_COLOR[task.priority]}20`,
                alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                {completing === task.id
                  ? <ActivityIndicator color={PRIORITY_COLOR[task.priority]} size="small" />
                  : task.priority === "urgent"
                    ? <AlertCircle size={18} color={PRIORITY_COLOR[task.priority]} />
                    : <CheckSquare size={18} color={PRIORITY_COLOR[task.priority]} />}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{task.title}</Text>
                <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                  {task.patient_name}{task.bed_label ? ` · ${task.bed_label}` : ""}
                </Text>
              </View>

              {label ? (
                <Text style={{
                  color: isOverdue ? "#ef4444" : "#6b7280",
                  fontSize: 12, fontWeight: isOverdue ? "700" : "400",
                }}>
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

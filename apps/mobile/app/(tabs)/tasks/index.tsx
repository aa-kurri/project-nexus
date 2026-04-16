import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { CheckSquare, Clock, AlertCircle, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { completeTask, fetchTaskList } from "./actions";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type Priority = "urgent" | "normal" | "low";

const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: "#ef4444",
  normal: "#f59e0b",
  low:    "#6b7280",
};

// TODO: fetch from a tasks table (or service_requests with category='nursing_task')
//       filtered by assignee_id = auth.uid() and status != 'completed'
const MOCK_TASKS = [
  { id: "t1", title: "Administer IV Drip",    patient: "Ramesh Kumar / GA-01", due: "Now",      priority: "urgent" as Priority, done: false },
  { id: "t2", title: "Record Post-op Vitals", patient: "Anita Verma / ICU-01", due: "10:30",    priority: "normal" as Priority, done: false },
  { id: "t3", title: "Change Wound Dressing",  patient: "Priya Sharma / GA-04", due: "12:00",    priority: "normal" as Priority, done: false },
  { id: "t4", title: "Collect Blood Sample",  patient: "Suresh Patel / GA-02", due: "14:00",    priority: "low"    as Priority, done: true  },
];

export default function TasksScreen() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = MOCK_TASKS.filter(t => !completed.has(t.id));
  const completedTasks = MOCK_TASKS.filter(t => completed.has(t.id));

  async function handleCompleteTask(taskId: string) {
    setCompleting(taskId);
    setError(null);
    try {
      await completeTask({ taskId });
      setCompleted((prev) => new Set([...prev, taskId]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete task");
    } finally {
      setCompleting(null);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>
          My Tasks — Today
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          {pending.length} pending
        </Text>
      </View>

      {/* Pending tasks */}
      <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
        {pending.length === 0 ? (
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ color: "#4b5563" }}>All tasks done for today!</Text>
          </View>
        ) : pending.map((task, i) => (
          <Pressable
            key={task.id}
            onPress={() => handleCompleteTask(task.id)}
            disabled={completing === task.id}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: 16, paddingVertical: 14,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
              opacity: pressed ? 0.7 : completing === task.id ? 0.6 : 1,
            })}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10,
              backgroundColor: `${PRIORITY_COLOR[task.priority]}20`,
              alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              {completing === task.id ? (
                <ActivityIndicator color={PRIORITY_COLOR[task.priority]} size="small" />
              ) : task.priority === "urgent" ? (
                <AlertCircle size={18} color={PRIORITY_COLOR[task.priority]} />
              ) : (
                <CheckSquare size={18} color={PRIORITY_COLOR[task.priority]} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{task.title}</Text>
              <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{task.patient}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Clock size={11} color="#6b7280" />
                <Text style={{ color: "#6b7280", fontSize: 12 }}>{task.due}</Text>
              </View>
              {completing !== task.id && <ChevronRight size={14} color="#4b5563" />}
            </View>
          </Pressable>
        ))}
      </View>

      {/* Error banner */}
      {error && (
        <View style={{ marginHorizontal: 16, marginTop: 16,
          backgroundColor: "#ef444420", borderRadius: 12,
          borderWidth: 1, borderColor: "#f87171", padding: 12 }}>
          <Text style={{ color: "#f87171", fontSize: 13, fontWeight: "600" }}>{error}</Text>
        </View>
      )}

      {/* Completed section */}
      {completedTasks.length > 0 && (
        <>
          <Text style={{ color: "#4b5563", fontSize: 12, fontWeight: "600",
            textTransform: "uppercase", letterSpacing: 0.5,
            marginHorizontal: 20, marginTop: 20, marginBottom: 10 }}>
            Completed
          </Text>
          <View style={{ marginHorizontal: 16, borderRadius: 16,
            backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
            {completedTasks.map((task, i) => (
              <View
                key={task.id}
                style={{
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                  opacity: 0.5,
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10,
                  backgroundColor: "#05966920",
                  alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <CheckSquare size={18} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#9ca3af", fontWeight: "600",
                    textDecorationLine: "line-through" }}>{task.title}</Text>
                  <Text style={{ color: "#4b5563", fontSize: 12, marginTop: 2 }}>{task.patient}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

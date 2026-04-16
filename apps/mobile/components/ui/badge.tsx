import { View, Text } from "react-native";

interface BadgeProps {
  label: string;
  color?: string;  // hex accent — bg will be color + "20"
}

export function Badge({ label, color = "#6b7280" }: BadgeProps) {
  return (
    <View
      style={{
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: `${color}20`,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color,
          textTransform: "capitalize",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

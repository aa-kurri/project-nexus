import { View, Text } from "react-native";

const PRIMARY = "#0F766E";

interface TopBarProps {
  title: string;
  subtitle?: string;
  /** Render a tinted header band (admin portal style). Default: false */
  tinted?: boolean;
}

export function TopBar({ title, subtitle, tinted = false }: TopBarProps) {
  return (
    <View
      style={{
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: tinted ? 20 : 16,
        backgroundColor: tinted ? PRIMARY : undefined,
      }}
    >
      {subtitle && (
        <Text
          style={{
            color: tinted ? "rgba(255,255,255,0.75)" : "#6b7280",
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 0.4,
            textTransform: "uppercase",
            marginBottom: 2,
          }}
        >
          {subtitle}
        </Text>
      )}
      <Text
        style={{
          color: tinted ? "#fff" : "#f9fafb",
          fontSize: 22,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
    </View>
  );
}

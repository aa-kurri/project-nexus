import { Pressable, Text, type StyleProp, type ViewStyle } from "react-native";

const PRIMARY = "#0F766E";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "ghost";
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = "primary", style, disabled }: ButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 20,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          backgroundColor: isPrimary ? PRIMARY : "transparent",
          borderWidth: isPrimary ? 0 : 1,
          borderColor: PRIMARY,
          opacity: pressed || disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: isPrimary ? "#fff" : PRIMARY,
          fontWeight: "700",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

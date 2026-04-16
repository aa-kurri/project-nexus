import { View, type ViewStyle, type StyleProp } from "react-native";

const SURFACE = "hsl(220, 13%, 9%)";
const BORDER  = "#1e2332";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: SURFACE,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: BORDER,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

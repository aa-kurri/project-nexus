import { ScrollView, type ScrollViewProps } from "react-native";

const BG = "hsl(220, 15%, 6%)";

interface ScrollAreaProps extends ScrollViewProps {
  children: React.ReactNode;
}

export function ScrollArea({ children, style, contentContainerStyle, ...props }: ScrollAreaProps) {
  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: BG }, style]}
      contentContainerStyle={[{ paddingBottom: 40 }, contentContainerStyle]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

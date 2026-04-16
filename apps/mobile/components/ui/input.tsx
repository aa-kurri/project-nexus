import { View, TextInput, type TextInputProps } from "react-native";
import { Search } from "lucide-react-native";

const SURFACE = "hsl(220, 13%, 9%)";
const BORDER  = "#1e2332";

interface InputProps extends TextInputProps {
  icon?: boolean;
}

export function Input({ icon = false, style, ...props }: InputProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: SURFACE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER,
        paddingHorizontal: 14,
      }}
    >
      {icon && <Search size={16} color="#6b7280" />}
      <TextInput
        style={[
          {
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: icon ? 10 : 0,
            color: "#f9fafb",
            fontSize: 15,
          },
          style,
        ]}
        placeholderTextColor="#4b5563"
        {...props}
      />
    </View>
  );
}

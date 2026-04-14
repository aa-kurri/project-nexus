import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

export default function Home() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg px-6 pt-20">
      <Text className="text-fg text-4xl font-bold">Nexus</Text>
      <Text className="text-muted mt-2">URL → PRD → Sprint → Code.</Text>

      <View className="mt-10 rounded-xl border border-border bg-surface p-1">
        <TextInput
          placeholder="https://stripe.com"
          placeholderTextColor="#8c93a3"
          value={url}
          onChangeText={setUrl}
          className="text-fg px-3 py-4 text-base"
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <Pressable
        onPress={() => url && router.push(`/projects/${encodeURIComponent(url)}`)}
        className="mt-4 rounded-xl bg-accent px-6 py-4 active:opacity-80"
      >
        <Text className="text-center font-semibold text-white">Generate</Text>
      </Pressable>
    </View>
  );
}

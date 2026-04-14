import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Root() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: "#0b0d12" }, headerTintColor: "#f1f3f7" }} />
    </>
  );
}

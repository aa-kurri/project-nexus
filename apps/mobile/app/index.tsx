// Root index — redirect to login on cold start
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/login" />;
}

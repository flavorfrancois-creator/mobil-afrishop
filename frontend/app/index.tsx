import { Redirect } from "expo-router";

import { LoadingView } from "@/src/components/StateViews";
import { useAuth } from "@/src/store/auth";

export default function Index() {
  const { user, ready } = useAuth();

  if (!ready) return <LoadingView testID="boot-loading" />;
  if (!user) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)" />;
}

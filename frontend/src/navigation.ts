import { Platform } from "react-native";

// NativeTabs only on iOS 26+. Everywhere else uses the classic JS tab bar.
export const usesNativeTabs =
  Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;

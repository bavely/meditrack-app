import { Stack } from "expo-router";
import { Colors } from "../../constants/Colors";
import "../../global.css";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.light.background,

        },
      }}
    />
  );
}
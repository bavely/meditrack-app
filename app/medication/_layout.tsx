import { Stack } from "expo-router";

export const SCREEN_TITLES = {
  add: "Add Medication",
  scan: "Scan Medication",
  manually: "Add Manually",
  "[id]": "Medication",
} as const;

export default function MedicationLayout() {
  const screens = ["add", "scan", "manually", "[id]"] as const;

  return (
    <Stack>
      {screens.map((name) => (
        <Stack.Screen key={name} name={name} options={{ title: SCREEN_TITLES[name] }} />
      ))}
      <Stack.Screen name="confirmation" options={{ headerShown: false }} />
    </Stack>
  );
}

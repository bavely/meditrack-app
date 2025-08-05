import { Stack } from "expo-router";

export default function MedicationLayout() {
  return (
    <Stack>
      <Stack.Screen name="add" options={{ title: "Add Medication" }} />
      <Stack.Screen name="scan" options={{ title: "Scan Medication" }} />
      <Stack.Screen name="manually" options={{ title: "Add Manually" }} />
      <Stack.Screen name="confirmation" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "Medication" }} />
    </Stack>
  );
}

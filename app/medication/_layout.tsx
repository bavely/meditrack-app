import { Stack } from "expo-router";


const screens = [
  { name: "add", options: { title: "Add Medication" } },
  { name: "scan", options: { title: "Scan Medication" } },
  { name: "manually", options: { title: "Add Manually" } },
  { name: "confirmation", options: { headerShown: false } },
  { name: "[id]", options: { title: "Medication" } },
];


export default function MedicationLayout() {

  return (
    <Stack>

      {screens.map((cfg) => (
        <Stack.Screen key={cfg.name} {...cfg} />
      ))}

    </Stack>
  );
}

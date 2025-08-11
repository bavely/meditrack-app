import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView, StyleSheet, Text } from "react-native";

export default function MedicationVoiceScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.message}>Voice input is currently unavailable.</Text>
    </SafeAreaView>
  );
}

function createStyles(colorScheme: "light" | "dark") {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Colors[colorScheme].background,
    },
    message: {
      color: Colors[colorScheme].text,
      fontSize: 16,
    },
  });
}

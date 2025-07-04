import { Colors } from "@/constants/Colors";
import { MedicationDose } from "@/types/medication";
import { Check, X } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DoseCardProps {
  dose: MedicationDose;
  onTake: (doseId: string) => void;
  onSkip: (doseId: string) => void;
}

export default function DoseCard({ dose, onTake, onSkip }: DoseCardProps) {
  const isPending = !dose.status || dose.status === "pending";
  const isTaken = dose.status === "taken";
  const isSkipped = dose.status === "skipped" || dose.status === "missed";
  
  // Format time (e.g., "09:00" to "9:00 AM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };
  
  return (
    <View style={styles.container}>
      <View style={[styles.colorIndicator, { backgroundColor: dose.color }]} />
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.time}>{formatTime(dose.time)}</Text>
          <Text style={styles.status}>
            {isTaken ? "Taken" : isSkipped ? "Skipped" : "Pending"}
          </Text>
        </View>
        
        <Text style={styles.name}>{dose.name}</Text>
        <Text style={styles.dosage}>{dose.dosage}</Text>
      </View>
      
      {isPending && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.takeButton]}
            onPress={() => onTake(dose.id)}
          >
            <Check size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={() => onSkip(dose.id)}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
      
      {(isTaken || isSkipped) && (
        <View style={styles.statusIndicator}>
          {isTaken ? (
            <View style={[styles.statusDot, styles.takenDot]}>
              <Check size={12} color="#FFFFFF" />
            </View>
          ) : (
            <View style={[styles.statusDot, styles.skippedDot]}>
              <X size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor:    "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  colorIndicator: {
    width: 6,
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  time: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  status: {
    fontSize: 14,
    color: Colors.light.text,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  dosage: {
    fontSize: 16,
    color: Colors.light.text,
  },
  actionsContainer: {
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
    padding: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  takeButton: {
    backgroundColor: Colors.light.tint,
  },
  skipButton: {
    backgroundColor: Colors.light.tint,
  },
  statusIndicator: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 16,
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  takenDot: {
    backgroundColor: Colors.light.tint,
  },
  skippedDot: {
    backgroundColor: Colors.light.tint,
  },
});
import { Colors } from "@/constants/Colors";
import { Medication } from "@/types/medication";
import { AlertCircle, Calendar, Clock, Pill } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface MedicationCardProps {
  medication: Medication;
  onPress: (medication: Medication) => void;
}

export default function MedicationCard({ medication, onPress }: MedicationCardProps) {
  const isLowStock =
    typeof medication.remainingDoses === "number" &&
    medication.remainingDoses <= 7;
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(medication)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: medication.color }]}>
        <Pill size={24} color="#FFFFFF" />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.name}>{medication.name}</Text>
          <Text style={styles.dosage}>{medication.dosage}</Text>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Clock size={16} color={Colors.light.tint} />
            <Text style={styles.detailText}>{medication.frequency}</Text>
          </View>
          
          {medication.refillDate && (
            <View style={styles.detailItem}>
              <Calendar size={16} color={Colors.light.tint} />
              <Text style={styles.detailText}>
                Refill: {new Date(medication.refillDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {isLowStock && (
            <View style={styles.warningContainer}>
              <AlertCircle size={16} color={Colors.light.tint} />
              <Text style={styles.warningText}>
                Low stock: {medication.remainingDoses} doses left
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  dosage: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  details: {
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  warningText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500",
  },
});
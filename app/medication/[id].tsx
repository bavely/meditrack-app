import ProgressCircle from "@/components/ProgressCircle";
import { Colors } from "@/constants/Colors";
import { useMedicationStore } from "@/store/medication-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, Calendar, Clock, Edit, FileText, Trash2 } from "lucide-react-native";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "../../components/ui/Button";
import { spacing, sizes } from "../../constants/Theme";

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { medications, deleteMedication } = useMedicationStore();
  const medication = medications.find((med) => med.id === id);
  
  if (!medication) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Medication not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.goBackButton}
        />
      </SafeAreaView>
    );
  }
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Medication",
      `Are you sure you want to delete ${medication.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMedication(medication.id);
            router.back();
          },
        },
      ]
    );
  };
  
  const handleEdit = () => {
    // In a real app, navigate to edit screen
    Alert.alert("Edit Medication", "This feature is coming soon!");
  };
  
  // Calculate remaining days until refill
  const calculateRemainingDays = () => {
    if (!medication.refillDate) return null;
    
    const today = new Date();
    const refillDate = new Date(medication.refillDate);
    const diffTime = refillDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const remainingDays = calculateRemainingDays();
  const isLowStock = medication.remainingDoses && medication.remainingDoses <= 7;
  const refillSoon = remainingDays !== null && remainingDays <= 7;
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Medication header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: medication.color }]}>
          <Text style={styles.iconText}>{medication.name.charAt(0)}</Text>
        </View>
        
        <View style={styles.headerContent}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.medicationDosage}>{medication.dosage}</Text>
        </View>
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
          <Edit size={20} color={Colors.light.tint} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Trash2 size={20} color={Colors.light.tint} />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
      
      {/* Medication details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Clock size={20} color={Colors.light.tint} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>{medication.frequency}</Text>
          </View>
        </View>
        
        {medication.refillDate && (
          <View style={styles.detailItem}>
            <Calendar size={20} color={Colors.light.tint} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Next Refill</Text>
              <Text style={styles.detailValue}>
                {new Date(medication.refillDate).toLocaleDateString()}
                {remainingDays !== null && ` (${remainingDays} days)`}
              </Text>
            </View>
          </View>
        )}
        
        {medication.instructions && (
          <View style={styles.detailItem}>
            <FileText size={20} color={Colors.light.tint} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Instructions</Text>
              <Text style={styles.detailValue}>{medication.instructions}</Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Warnings */}
      {(isLowStock || refillSoon) && (
        <View style={styles.warningsContainer}>
          {isLowStock && (
            <View style={styles.warningItem}>
              <AlertCircle size={20} color={Colors.light.tint} />
              <Text style={styles.warningText}>
                Low stock: {medication.remainingDoses} doses left
              </Text>
            </View>
          )}
          
          {refillSoon && (
            <View style={styles.warningItem}>
              <AlertCircle size={20} color={Colors.light.tint} />
              <Text style={styles.warningText}>
                Refill needed in {remainingDays} days
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Medication supply */}
      {medication.remainingDoses && medication.quantity && (
        <View style={styles.supplyContainer}>
          <Text style={styles.supplyTitle}>Medication Supply</Text>
          
          <View style={styles.supplyContent}>
            <ProgressCircle
              progress={(medication.remainingDoses / medication.quantity) * 100}
              size={100}
              strokeWidth={10}
              label="Remaining"
            />
            
            <View style={styles.supplyDetails}>
              <View style={styles.supplyItem}>
                <Text style={styles.supplyValue}>{medication.remainingDoses}</Text>
                <Text style={styles.supplyLabel}>Remaining</Text>
              </View>
              
              <View style={styles.supplyDivider} />
              
              <View style={styles.supplyItem}>
                <Text style={styles.supplyValue}>{medication.quantity}</Text>
                <Text style={styles.supplyLabel}>Total</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* Refill button */}
      <Button
        title="Mark as Refilled"
        onPress={() => Alert.alert("Refill", "This feature is coming soon!")}
        style={styles.refillButton}
      />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: spacing.md,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: spacing.md,
  },
  goBackButton: {
    minWidth: 200,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: Colors.light.background,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,

    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: spacing.sm,
    elevation: 2,
  },
  iconContainer: {
    width: sizes.lg,
    height: sizes.lg,
    borderRadius: sizes.lg / 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerContent: {
    flex: 1,
  },
  medicationName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 18,
    color: Colors.light.tint,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.tint,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: Colors.light.tint,
  },
  detailsContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.tint,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: "500",
  },
  warningsContainer: {
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  warningItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 16,
    color: Colors.light.icon,
    fontWeight: "500",
    marginLeft: 12,
  },
  supplyContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  supplyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
  },
  supplyContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  supplyDetails: {
    flex: 1,
    flexDirection: "row",
    marginLeft: 16,
    height: 80,
    alignItems: "center",
    justifyContent: "space-around",
  },
  supplyItem: {
    alignItems: "center",
  },
  supplyValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  supplyLabel: {
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 4,
  },
  supplyDivider: {
    width: 1,
    height: "50%",
    backgroundColor: Colors.light.icon,
  },
  refillButton: {
    marginBottom: 24,
  },
});
import { medicationTypes } from "@/constants/medications";
import { useMedicationStore } from "@/store/medication-store";
import { useRouter } from "expo-router";
import { Camera, ChevronRight, Pill } from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Colors } from "../../constants/Colors";

export default function AddMedicationScreen() {
  const router = useRouter();
  const { addMedication } = useMedicationStore();
  
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [time, setTime] = useState("09:00");
  const [instructions, setInstructions] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedType, setSelectedType] = useState(medicationTypes[0]);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showFrequencySelector, setShowFrequencySelector] = useState(false);
  
  const handleSave = () => {
    if (!name || !dosage || !frequency) {
      // Show validation error
      return;
    }
    
    const newMedication = {
      id: Date.now().toString(),
      name,
      dosage,
      frequency,
      time,
      instructions,
      color: Colors.light.primary,
      icon: selectedType.icon,
      quantity: quantity ? parseInt(quantity, 10) : undefined,
      remainingDoses: quantity ? parseInt(quantity, 10) : undefined,
      refillDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };
    
    addMedication(newMedication);
    router.back();
  };
  
  const handleScanPress = () => {
    router.push("/medication/scan");
  };
  
  const handleAddManuallyPress = () => {
    router.push("/medication/manually");
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      
      {/* Medication type selector */}
      <View style={styles.formGroup}>
        
  
        
        {showTypeSelector && (
          <View style={styles.typeOptions}>
            {medicationTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.typeOption}
                onPress={() => {
                  setSelectedType(type);
                  setShowTypeSelector(false);
                }}
              >
                <View
                  style={[
                    styles.typeIconContainer,
                    { backgroundColor: Colors.light.icon },
                  ]}
                >
                  <Pill size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.typeOptionText}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      {/* Scan button */}
      <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>
        <Camera size={20} color={Colors.light.tint} />
        <Text style={styles.addManuallyButtonText}>Scan Prescription Label</Text>
        <ChevronRight size={20} color={Colors.light.tint} />
      </TouchableOpacity>
      
      {/* Add Manually button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleAddManuallyPress}
      >
        <Pill size={20} color={Colors.light.tint} />
        <Text style={styles.addManuallyButtonText}>Add Manually</Text>
        <ChevronRight size={20} color={Colors.light.tint} />
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  inputPlaceholder: {
    fontSize: 16,
    color: Colors.light.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 4,
  },
  typeSelector: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  selectedType: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  selectedTypeText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  typeOptions: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    overflow: "hidden",
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
  },
  typeOptionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  frequencyOptions: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    overflow: "hidden",
  },
  frequencyOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
  },
  frequencyOptionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${Colors.light.tint}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  scanButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.tint,
    marginLeft: 12,
  },
  saveButton: {
    marginTop: 16,
  },
  addManuallyButton: {
    marginTop: 16,
  },
  addManuallyButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.tint,
  },
});
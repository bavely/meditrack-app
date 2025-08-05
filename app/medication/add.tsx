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

import { useColorScheme } from "@/hooks/useColorScheme";
import Button from "../../components/ui/Button";

import { Colors } from "../../constants/Colors";

export default function AddMedicationScreen() {
  const router = useRouter();
  const { addMedication } = useMedicationStore();
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  
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
      color: Colors[colorScheme].primary,
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

        <TouchableOpacity
          style={styles.typeSelector}
          onPress={() => setShowTypeSelector(!showTypeSelector)}
        >
          <View style={styles.selectedType}>
            <View
              style={[
                styles.typeIconContainer,
                { backgroundColor: Colors[colorScheme].icon },
              ]}
            >
              <Pill size={20} color={Colors[colorScheme].foreground} />
            </View>
            <Text style={styles.selectedTypeText}>{selectedType.name}</Text>
          </View>
          
          <ChevronDown size={20} color={Colors[colorScheme].tint} />
        </TouchableOpacity>

        
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
                    { backgroundColor: Colors[colorScheme].icon },
                  ]}
                >
                  <Pill size={20} color={Colors[colorScheme].foreground} />
                </View>
                <Text style={styles.typeOptionText}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      {/* Scan button */}
      <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>

        <Camera size={20} color={Colors[colorScheme].tint} />
        <Text style={styles.scanButtonText}>Scan Prescription Label</Text>
        <ChevronRight size={20} color={Colors[colorScheme].tint} />

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

function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors[colorScheme].text,
      marginBottom: 24,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors[colorScheme].text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: Colors[colorScheme].tint,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: Colors[colorScheme].text,
      borderWidth: 1,
      borderColor: Colors[colorScheme].tint,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    inputText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    inputPlaceholder: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    textArea: {
      height: 120,
      textAlignVertical: "top",
    },
    helperText: {
      fontSize: 14,
      color: Colors[colorScheme].text,
      marginTop: 4,
    },
    typeSelector: {
      backgroundColor: Colors[colorScheme].tint,
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors[colorScheme].tint,
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
      color: Colors[colorScheme].text,
    },
    typeOptions: {
      backgroundColor: Colors[colorScheme].tint,
      borderRadius: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme].tint,
      overflow: "hidden",
    },
    typeOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].tint,
    },
    typeOptionText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    frequencyOptions: {
      backgroundColor: Colors[colorScheme].tint,
      borderRadius: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme].tint,
      overflow: "hidden",
    },
    frequencyOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].tint,
    },
    frequencyOptionText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    scanButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: `${Colors[colorScheme].tint}10`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    scanButtonText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      color: Colors[colorScheme].tint,
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
      color: Colors[colorScheme].tint,
    },
  });
}
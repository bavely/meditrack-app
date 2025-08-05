import { medicationTypes } from "@/constants/medications";
import { useMedicationStore } from "@/store/medication-store";
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import Button from "../../components/ui/Button";
import { Colors } from "../../constants/Colors";

const Manually = () => {
          const router = useRouter();
  const { addMedication } = useMedicationStore();
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [time, setTime] = useState("09:00");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
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
    return (
      <View>
         {/* Medication name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Medication Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter medication name"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              
              {/* Dosage */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Dosage</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 10mg, 500mg, etc."
                  value={dosage}
                  onChangeText={setDosage}
                />
              </View>
              
              
              {/* Time */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Time Taken</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00"
                  value={time}
                  onChangeText={setTime}
                />
                <Text style={styles.helperText}>
                  Enter time in 24-hour format (HH:MM)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  value={date}
                  onChangeText={setDate}
                />
              </View>
              
              {/* Quantity */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Number of pills/doses"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
              </View>

              {/* Therapy Type */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Therapy Type / Medication For</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Select therapy type"
                  value={selectedType.name}
                  onPressIn={() => setShowTypeSelector(true)}
                />
              </View>
              
              {/* Instructions */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Instructions</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Special instructions for taking this medication"
                  value={instructions}
                  onChangeText={setInstructions}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              {/* Save button */}
              <Button
                title="Save Medication"
                onPress={handleSave}
                style={styles.saveButton}
                disabled={!name || !dosage || !frequency}
              />
      </View>
    )
}

export default Manually


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
  });
}
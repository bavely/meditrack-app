import React, { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import Button from "../../components/ui/Button";
import { useMedicationStore } from "../../store/medication-store";

const Confirmation = () => {
  const { parsedMedication, setParsedMedication } = useMedicationStore();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(parsedMedication?.name || "");
  const [dosage, setDosage] = useState(parsedMedication?.dosage || "");
  const [instructions, setInstructions] = useState(
    parsedMedication?.instructions || ""
  );
  const [therapy, setTherapy] = useState(parsedMedication?.therapy || "");

  useEffect(() => {
    console.log("🔍 Parsed Medication:", parsedMedication);
    setName(parsedMedication?.name || "");
    setDosage(parsedMedication?.dosage || "");
    setInstructions(parsedMedication?.instructions || "");
    setTherapy(parsedMedication?.therapy || "");
  }, [parsedMedication]);

  const handleSave = () => {
    const updatedMedication = {
      name,
      dosage,
      instructions,
      therapy,
    };

    setParsedMedication(updatedMedication);
    setIsEditing(false);
  };

  return (
    <View>
      <Text>Confirmation</Text>
      {isEditing ? (
        <>
          <TextInput value={name} onChangeText={setName} />
          <TextInput value={dosage} onChangeText={setDosage} />
          <TextInput value={instructions} onChangeText={setInstructions} />
          <TextInput value={therapy} onChangeText={setTherapy} />
          <Button title="Save" onPress={handleSave} />
        </>
      ) : (
        <>
          <Text>{name}</Text>
          <Text>{dosage}</Text>
          <Text>{instructions}</Text>
          <Text>{therapy}</Text>
          <Button title="Edit" onPress={() => setIsEditing(true)} />
        </>
      )}
    </View>
  );
};

export default Confirmation;


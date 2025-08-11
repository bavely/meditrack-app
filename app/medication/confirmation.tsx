import React, { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const [totalCount, setTotalCount] = useState(parsedMedication?.quantity || 0);
  const [lastTimeTaken, setLastTimeTaken] = useState(
 ""
  );

  useEffect(() => {
    console.log("🔍 Parsed Medication:", parsedMedication);
    setName(parsedMedication?.name || "");
    setDosage(parsedMedication?.dosage || "");
    setInstructions(parsedMedication?.instructions || "");
    setTherapy(parsedMedication?.therapy || "");
    setTotalCount(parsedMedication?.quantity || 0);
  }, [parsedMedication]);

  const handleSave = () => {
    const updatedMedication = {
      name,
      dosage,
      instructions,
      therapy,
      totalCount,
      lastTimeTaken,
    };

    setParsedMedication(updatedMedication);
    setIsEditing(false);
  };
console.log(name, dosage, instructions, therapy , "name, dosage, instructions, therapy ==============>")
  if (!parsedMedication) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-black">
        <Text className="text-black dark:text-white">
          No medication data available.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 pt-12 bg-white dark:bg-black">
      <View className="p-4 gap-4">
      {isEditing ? (
        <>
          <Text className="text-black dark:text-white">Name</Text>
          <TextInput className="border-2 border-gray-300 rounded-md p-2" value={name} onChangeText={setName} />
          <Divider className="bg-gray-600" />
          <Text className="text-black dark:text-white">Dosage</Text>
          <TextInput className="border-2 border-gray-300 rounded-md p-2" value={dosage} onChangeText={setDosage} />
          <Divider className="bg-gray-600" />
          <Text className="text-black dark:text-white">Instructions</Text>
          <TextInput className="border-2 border-gray-300 rounded-md p-2" value={instructions} onChangeText={setInstructions} />
          <Divider className="bg-gray-600" />
          <Text className="text-black dark:text-white">Therapy</Text>
          <TextInput className="border-2 border-gray-300 rounded-md p-2" value={therapy} onChangeText={setTherapy} />
          <Divider className="bg-gray-600" />
          {/* Total Count */}
          <Text className="text-black dark:text-white">Total Count</Text>
          <TextInput className="border-2 border-gray-300 rounded-md p-2" value={totalCount.toString()} onChangeText={(text) => setTotalCount(parseInt(text))} />
          {/* Last time taken */}
          <Text className="text-black dark:text-white">Last Time Taken</Text>
          <TextInput className="border-2 border-gray-300 rounded-md p-2" value={lastTimeTaken} onChangeText={setLastTimeTaken} />
          <Button title="Save" onPress={handleSave} />
        </>
      ) : (
        <>

          <Text className="text-black dark:text-white">Name: {name}</Text>
          <Text className="text-black dark:text-white">Dosage: {dosage}</Text>
          <Text className="text-black dark:text-white">Instructions: {instructions}</Text>
          <Text className="text-black dark:text-white">Therapy: {therapy}</Text>
          <Text className="text-black dark:text-white">Total Count: {totalCount}</Text>
          <Text className="text-black dark:text-white">Last Time Taken: {lastTimeTaken}</Text>
          <Button title="Edit" onPress={() => setIsEditing(true)} />
        </>
      )}
      </View>
    </SafeAreaView>

  );
};

export default Confirmation;


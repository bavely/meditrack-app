
import React, { useEffect } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { useMedicationStore } from '../../store/medication-store';

const Confirmation = () => {
  const { parsedMedication } = useMedicationStore();

  useEffect(() => {
    console.log('🔍 Parsed Medication:', parsedMedication);
  }, [parsedMedication]);

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
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="p-4">
        <Text className="text-black dark:text-white">Confirmation</Text>
        <Text className="text-black dark:text-white">{parsedMedication.name}</Text>
        <Text className="text-black dark:text-white">{parsedMedication.dosage}</Text>
        <Text className="text-black dark:text-white">{parsedMedication.instructions}</Text>
        <Text className="text-black dark:text-white">{parsedMedication.therapy}</Text>
      </View>
    </SafeAreaView>

  );
};

export default Confirmation;


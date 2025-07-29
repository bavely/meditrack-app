import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useMedicationStore } from '../../store/medication-store';

const Confirmation = () => {
    const { parsedMedication } = useMedicationStore();

    useEffect(() => {
        console.log("🔍 Parsed Medication:", parsedMedication);
    }, [parsedMedication]);
  return (
    <View>
      <Text>Confirmation</Text>
      <Text>{parsedMedication?.name}</Text>
      <Text>{parsedMedication?.dosage}</Text>
      <Text>{parsedMedication?.instructions}</Text>
      <Text>{parsedMedication?.therapy}</Text>
    </View>
  )
}

export default Confirmation
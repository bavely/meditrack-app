import { Medication } from "@/types/medication";
import { useRouter } from "expo-router";
import { Bell, Pill, Plus } from "lucide-react-native";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DoseCard from "../../components/DoseCard";
import EmptyState from "../../components/EmptyState";
import MedicationCard from "../../components/MedicationCard";
import ProgressCircle from "../../components/ProgressCircle";
import SectionHeader from "../../components/SectionHeader";
import { Colors } from "../../constants/Colors";
import { useMedicationStore } from "../../store/medication-store";
export default function DashboardScreen() {
  const router = useRouter();
  const {
    medications,
    upcomingDoses,
    todaysTakenCount,
    todaysTotalCount,
    adherenceRate,
    markDoseAsTaken,
    markDoseAsSkipped,
    refreshUpcomingDoses,
    calculateAdherenceRate,
  } = useMedicationStore();
  
  useEffect(() => {
    refreshUpcomingDoses();
    calculateAdherenceRate();
  }, []);
  
  const handleAddMedication = () => {
    router.push("/medication/add");
  };
  
const handleMedicationPress = (medication: Medication) => {
  router.push({
    pathname: "/medication/[id]",
    params: { id: medication.id },
  });
};
  
  const pendingDoses = upcomingDoses.filter(
    (dose) => !dose.status || dose.status === "pending"
  );
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with adherence stats */}
      <View style={styles.statsContainer}>
        <ProgressCircle
          progress={adherenceRate}
          size={100}
          strokeWidth={10}
          label="Adherence"
        />
        
        <View style={styles.statsDetails}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todaysTakenCount}</Text>
            <Text style={styles.statLabel}>Taken</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todaysTotalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>
      
      {/* Upcoming doses section */}
      <SectionHeader
        title="Today's Doses"
        onSeeAll={() => router.push("/calendar")}
      />
      
      {pendingDoses.length > 0 ? (
        pendingDoses.map((dose) => (
          <DoseCard
            key={dose.id}
            dose={dose}
            onTake={markDoseAsTaken}
            onSkip={markDoseAsSkipped}
          />
        ))
      ) : (
        <EmptyState
          icon={<Bell size={48} color={Colors.light.text} />}
          title="No Pending Doses"
          description="You have no pending doses for today. Great job staying on track!"
        />
      )}
      
      {/* Medications section */}
      <SectionHeader
        title="My Medications"
        onSeeAll={() => router.push("/calendar")}
      />
      
      {medications.length > 0 ? (
        medications.map((medication) => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            onPress={handleMedicationPress}
          />
        ))
      ) : (
        <EmptyState
          icon={<Pill size={48} color={Colors.light.text} />}
          title="No Medications"
          description="You haven't added any medications yet. Tap the button below to add your first medication."
          buttonTitle="Add Medication"
          onButtonPress={handleAddMedication}
        />
      )}
      
      {/* Add medication button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddMedication}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
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
    paddingBottom: 100, // Extra padding at bottom for FAB
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statsDetails: {
    flex: 1,
    flexDirection: "row",
    marginLeft: 16,
    height: 80,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: "50%",
    backgroundColor: Colors.light.icon,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
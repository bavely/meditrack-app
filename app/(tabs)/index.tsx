import { Medication } from "@/types/medication";
import { useRouter } from "expo-router";
import { Bell, Pill, Plus } from "lucide-react-native";
import { useEffect } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { Avatar } from 'react-native-paper';
import DoseCard from "../../components/DoseCard";
import EmptyState from "../../components/EmptyState";
import MedicationCard from "../../components/MedicationCard";
import ProgressCircle from "../../components/ProgressCircle";
import SectionHeader from "../../components/SectionHeader";
import { Colors } from "../../constants/Colors";
import { spacing, sizes } from "../../constants/Theme";
import { useAuthStore } from "../../store/auth-store";
import { useMedicationStore } from "../../store/medication-store";
export default function DashboardScreen() {
 const colorScheme = useColorScheme();
  const router = useRouter();
  const { user } = useAuthStore();
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
     const textcolor =
    colorScheme === "light" ? Colors.light.text : Colors.dark.text;
    const localbagroundcolor =
    colorScheme === "light" ? "#f1f5f9" : "#020617";
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

    const getUserInitials = () => {
    if (!user || !user.name) return "?";
    
    const nameParts = user.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return nameParts[0][0].toUpperCase();
  };
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ScrollView style={[styles.container, { backgroundColor: localbagroundcolor }]} contentContainerStyle={styles.content}>
      <View style={styles.statsContainer} >
        <Avatar.Text
          size={24}
          label={getUserInitials()}
          style={[styles.statLabel, {marginRight: 10}]}
          labelStyle={{ color: textcolor }}
        />
        <Text style={[styles.statLabel, {color:textcolor }]}> Welcome {user?.name}</Text>
  </View>
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
            <Text style={[styles.statValue, { color: textcolor }]}>{todaysTakenCount}</Text>
            <Text style={[styles.statLabel, {color:textcolor }]}>Taken</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: textcolor }]}>{todaysTotalCount}</Text>
            <Text style={[styles.statLabel, {color:textcolor }]}>Total</Text>
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
      

    </ScrollView>
          {/* Add medication button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddMedication}
        activeOpacity={0.8}
      >
        <Plus size={sizes.sm} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100, // Extra padding at bottom for FAB
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(224, 242, 254, .5)",
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: "center",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
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
 
  },
  statLabel: {
    fontSize: 14,

    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: "50%",
    backgroundColor: Colors.light.icon,
  },
  addButton: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.lg,
    width: sizes.lg,
    height: sizes.lg,
    borderRadius: sizes.lg / 2,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: spacing.xs },
    shadowOpacity: 0.3,
    shadowRadius: spacing.sm,
    elevation: 5,
    zIndex: 1000,
  },
});
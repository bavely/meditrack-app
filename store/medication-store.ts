import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { medicationHistory, medications, upcomingDoses } from "../constants/medications";
import { Medication, MedicationDose, MedicationHistory } from "../types/medication";

interface MedicationState {
  medications: Medication[];
  medicationHistory: MedicationHistory[];
  upcomingDoses: MedicationDose[];
  todaysTakenCount: number;
  todaysTotalCount: number;
  adherenceRate: number;
  
  // Actions
  addMedication: (medication: Medication) => void;
  updateMedication: (id: string, medication: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  markDoseAsTaken: (doseId: string) => void;
  markDoseAsSkipped: (doseId: string) => void;
  calculateAdherenceRate: () => void;
  refreshUpcomingDoses: () => void;
}

export const useMedicationStore = create<MedicationState>()(
  persist(
    (set, get) => ({
      medications: medications,
      medicationHistory: medicationHistory,
      upcomingDoses: upcomingDoses,
      todaysTakenCount: 0,
      todaysTotalCount: 0,
      adherenceRate: 0,

      addMedication: (medication) => {
        set((state) => ({
          medications: [...state.medications, medication],
        }));
        get().refreshUpcomingDoses();
      },

      updateMedication: (id, updatedMedication) => {
        set((state) => ({
          medications: state.medications.map((med) =>
            med.id === id ? { ...med, ...updatedMedication } : med
          ),
        }));
        get().refreshUpcomingDoses();
      },

      deleteMedication: (id) => {
        set((state) => ({
          medications: state.medications.filter((med) => med.id !== id),
          medicationHistory: state.medicationHistory.filter(
            (history) => history.medicationId !== id
          ),
          upcomingDoses: state.upcomingDoses.filter(
            (dose) => dose.medicationId !== id
          ),
        }));
      },

      markDoseAsTaken: (doseId) => {
        const dose = get().upcomingDoses.find((d) => d.id === doseId);
        if (!dose) return;

        const now = new Date();
        const newHistoryEntry: MedicationHistory = {
          id: Date.now().toString(),
          medicationId: dose.medicationId,
          date: now.toISOString().split("T")[0],
          time: now.toTimeString().slice(0, 5),
          status: "taken",
        };

        set((state) => ({
          medicationHistory: [...state.medicationHistory, newHistoryEntry],
          upcomingDoses: state.upcomingDoses.map((d) =>
            d.id === doseId ? { ...d, status: "taken" } : d
          ),
        }));

        get().calculateAdherenceRate();
      },

      markDoseAsSkipped: (doseId) => {
        const dose = get().upcomingDoses.find((d) => d.id === doseId);
        if (!dose) return;

        const now = new Date();
        const newHistoryEntry: MedicationHistory = {
          id: Date.now().toString(),
          medicationId: dose.medicationId,
          date: now.toISOString().split("T")[0],
          time: now.toTimeString().slice(0, 5),
          status: "skipped",
        };

        set((state) => ({
          medicationHistory: [...state.medicationHistory, newHistoryEntry],
          upcomingDoses: state.upcomingDoses.map((d) =>
            d.id === doseId ? { ...d, status: "skipped" } : d
          ),
        }));

        get().calculateAdherenceRate();
      },

      calculateAdherenceRate: () => {
        const today = new Date().toISOString().split("T")[0];
        const todaysHistory = get().medicationHistory.filter(
          (h) => h.date === today
        );
        
        const takenCount = todaysHistory.filter(
          (h) => h.status === "taken"
        ).length;
        
        const totalDoses = get().upcomingDoses.length;
        const adherenceRate = totalDoses > 0 ? (takenCount / totalDoses) * 100 : 0;
        
        set({
          todaysTakenCount: takenCount,
          todaysTotalCount: totalDoses,
          adherenceRate,
        });
      },

      refreshUpcomingDoses: () => {
        // In a real app, this would calculate upcoming doses based on
        // medication schedules and current time
        set({ upcomingDoses });
        get().calculateAdherenceRate();
      },
    }),
    {
      name: "medication-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
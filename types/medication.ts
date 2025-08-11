// Medication types
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string | string[];
  instructions?: string;
  color: string;
  icon: string;
  refillDate?: string;
  quantity?: number;
  remainingDoses?: number;
  notes?: string;
  image?: string;
}

export interface MedicationDose {
  id: string;
  medicationId: string;
  name: string;
  dosage: string;
  time: string;
  color: string;
  icon: string;
  status?: "pending" | "taken" | "missed" | "skipped";
}

export interface MedicationHistory {
  id: string;
  medicationId: string;
  date: string;
  time: string;
  status: string; // "taken" | "missed" | "skipped"
}

export interface MedicationType {
  id: string;
  name: string;
  icon: string;
}

export interface FrequencyOption {
  id: string;
  name: string;
  value: string;
}

export interface ParsedMedication {
  totalCount: any;
  name: string;
  dosage: string;
  instructions: string;
  therapy: string | null;
  quantity?: number;
}

export interface ExtractedMedication {
  medicationName: string;
}
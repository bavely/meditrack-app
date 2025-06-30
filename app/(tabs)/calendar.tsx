import DoseCard from "@/components/DoseCard";
import EmptyState from "@/components/EmptyState";
import { Colors } from "@/constants/Colors";
import { useMedicationStore } from "@/store/medication-store";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const {
    upcomingDoses,
    markDoseAsTaken,
    markDoseAsSkipped,
  } = useMedicationStore();
  
  // Generate days for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Create array for calendar days
    const days = [];
    
    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: "", isCurrentMonth: false });
    }
    
    // Add days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = isSameDay(date, new Date());
      const isSelected = isSameDay(date, selectedDate);
      
      days.push({
        day: i,
        date,
        isCurrentMonth: true,
        isToday,
        isSelected,
      });
    }
    
    return days;
  };
  
  // Check if two dates are the same day
  const isSameDay = (date1 : Date, date2 : Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Format month and year
  const formatMonthYear = (date : Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };
  
  // Get doses for selected date
  const getDosesForSelectedDate = () => {
    // In a real app, this would filter doses based on the selected date
    // For now, we'll just return all upcoming doses
    return upcomingDoses;
  };
  
  const calendarDays = generateCalendarDays();
  const dosesForSelectedDate = getDosesForSelectedDate();
  
  return (
    <View style={styles.container}>
      {/* Calendar header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth}>
          <ChevronLeft size={24} color={Colors.light.tint} />
        </TouchableOpacity>
        
        <Text style={styles.monthYearText}>{formatMonthYear(currentMonth)}</Text>
        
        <TouchableOpacity onPress={goToNextMonth}>
          <ChevronRight size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>
      
      {/* Weekday headers */}
      <View style={styles.weekdayHeader}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
          <Text key={index} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayContainer,
              day.isSelected && styles.selectedDayContainer,
              day.isToday && styles.todayContainer,
            ]}
            onPress={() => day.isCurrentMonth && setSelectedDate(day.date as Date)}
            disabled={!day.isCurrentMonth}
          >
            {day.isCurrentMonth && (
              <Text
                style={[
                  styles.dayText,
                  day.isSelected && styles.selectedDayText,
                  day.isToday && styles.todayText,
                ]}
              >
                {day.day}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Selected date doses */}
      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateText}>
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>
      
      <ScrollView style={styles.dosesContainer} contentContainerStyle={styles.dosesContent}>
        {dosesForSelectedDate.length > 0 ? (
          dosesForSelectedDate.map((dose) => (
            <DoseCard
              key={dose.id}
              dose={dose}
              onTake={markDoseAsTaken}
              onSkip={markDoseAsSkipped}
            />
          ))
        ) : (
          <EmptyState
            title="No Doses Scheduled"
            description="You don't have any doses scheduled for this day."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  weekdayHeader: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    paddingBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color:  Colors.light.text,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor:    Colors.light.background,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor:  Colors.light.tint,
  },
  dayContainer: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  selectedDayContainer: {
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
  },
  todayContainer: {
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  todayText: {
    color: Colors.light.tint,
    fontWeight: "600",
  },
  selectedDateHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  dosesContainer: {
    flex: 1,
  },
  dosesContent: {
    padding: 16,
  },
});
import { Colors } from "@/constants/Colors";
import { useRouter } from 'expo-router';
import { Bell, Clock, HelpCircle, LogOut, Moon, Shield } from "lucide-react-native";
import React from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuthStore } from "../../store/auth-store";
import { spacing, sizes } from "../../constants/Theme";

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            // Navigate to login screen
            router.push("/(auth)/login");
          },
        },
      ]
    );
  };
  
  // Get user initials for avatar
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getUserInitials()}</Text>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.email || "User"}</Text>
          <Text style={styles.profileEmail}>{user?.email || ""}</Text>
        </View>
      </View>
      
      {/* Settings sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Bell size={20} color={Colors[colorScheme].tint} />
          </View>
          
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive reminders for your medications
            </Text>
          </View>
          
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: Colors[colorScheme].tint, true: Colors[colorScheme].text }}
            thumbColor={Colors[colorScheme].foreground}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Clock size={20} color={Colors[colorScheme].tint} />
          </View>
          
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Reminder Time</Text>
            <Text style={styles.settingDescription}>
              Set default reminder times
            </Text>
          </View>
          
          <TouchableOpacity>
            <Text style={styles.settingAction}>Configure</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Moon size={20} color={Colors[colorScheme].tint} />
          </View>
          
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Dark Mode</Text>
            <Text style={styles.settingDescription}>
              Switch between light and dark theme
            </Text>
          </View>
          
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: Colors[colorScheme].tint, true: Colors[colorScheme].text }}
            thumbColor={Colors[colorScheme].foreground}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <HelpCircle size={20} color={Colors[colorScheme].tint} />
          </View>
          
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Help & Support</Text>
            <Text style={styles.settingDescription}>
              Get help with using the app
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Shield size={20} color={Colors[colorScheme].tint} />
          </View>
          
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Privacy Policy</Text>
            <Text style={styles.settingDescription}>
              Read our privacy policy
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color={Colors[colorScheme].tint} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    content: {
      padding: spacing.md,
    },
    profileHeader: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors[colorScheme].icon,
      borderRadius: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: Colors[colorScheme].tint,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: spacing.sm,
      elevation: 2,
    },
    avatarContainer: {
      width: sizes.lg,
      height: sizes.lg,
      borderRadius: sizes.lg / 2,
      backgroundColor: Colors[colorScheme].tint,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors[colorScheme].foreground,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors[colorScheme].text,
      marginBottom: spacing.xs,
    },
    profileEmail: {
      fontSize: 14,
      color: Colors[colorScheme].text,
    },
    section: {
      backgroundColor: Colors[colorScheme].surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      shadowColor: Colors[colorScheme].tint,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: spacing.sm,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors[colorScheme].text,
      marginBottom: spacing.md,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].icon,
    },
    settingIconContainer: {
      width: sizes.md,
      height: sizes.md,
      borderRadius: sizes.md / 2,
      backgroundColor: `${Colors[colorScheme].tint}20`,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors[colorScheme].text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: Colors[colorScheme].text,
    },
    settingAction: {
      fontSize: 14,
      fontWeight: "500",
      color: Colors[colorScheme].tint,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors[colorScheme].surface,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors[colorScheme].tint,
      marginLeft: spacing.sm,
    },
    versionText: {
      textAlign: "center",
      fontSize: 14,
      color: Colors[colorScheme].text,
      marginBottom: spacing.lg,
    },
  });
}
import { Colors } from "@/constants/Colors";
import { useRouter } from 'expo-router';
import { Bell, Clock, HelpCircle, LogOut, Moon, Shield } from "lucide-react-native";
import React from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../../store/auth-store";

export default function ProfileScreen() {
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
    if (!user || !user.email) return "?";
    
    const nameParts = user.email.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return nameParts[0][0].toUpperCase();
  };
  
  return (
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
            <Bell size={20} color={Colors.light.tint} />
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
            trackColor={{ false: Colors.light.tint, true: Colors.light.text }}
            thumbColor="#FFFFFF"
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Clock size={20} color={Colors.light.tint} />
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
            <Moon size={20} color={Colors.light.tint} />
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
            trackColor={{ false: Colors.light.tint, true: Colors.light.text }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <HelpCircle size={20} color={Colors.light.tint} />
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
            <Shield size={20} color={Colors.light.tint} />
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
        <LogOut size={20} color={Colors.light.tint} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      
      <Text style={styles.versionText}>Version 1.0.0</Text>
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
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.icon,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.light.text,
  },
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.icon,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.light.tint}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.light.text,
  },
  settingAction: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.tint,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.tint,
    marginLeft: 8,
  },
  versionText: {
    textAlign: "center",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 24,
  },
});
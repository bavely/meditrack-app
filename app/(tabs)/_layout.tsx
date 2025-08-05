// app/(tabs)/_layout.tsx
import { useColorScheme } from "@/hooks/useColorScheme";
import { Tabs, useRouter } from "expo-router";
import { Calendar, Home, MessageSquare, User } from "lucide-react-native";
import { SafeAreaView } from "react-native";
import { Colors } from "../../constants/Colors";
import { spacing, sizes } from "../../constants/Theme";

export default function TabLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const bgcolor =
    colorScheme === "light" ? Colors.light.background : Colors.dark.background;
  const textcolor =
    colorScheme === "light" ? Colors.light.text : Colors.dark.text;

    const tintcolor =
    colorScheme === "light" ? Colors.light.tint : Colors.dark.tint;
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tintcolor,
          tabBarInactiveTintColor: textcolor,
          tabBarStyle: {
            backgroundColor: bgcolor,
            borderTopWidth: 1,
            borderTopColor: tintcolor,
            elevation: 0,
            height: sizes.lg,
            paddingBottom: spacing.sm,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
          headerStyle: {
            backgroundColor: bgcolor,

          },
          headerShadowVisible: true,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 24,
          },
          headerTitleAlign: "center",
          headerTintColor: textcolor,

        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      
      {/* <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ color }) => <PlusCircle size={32} color={bgcolor} />,
          tabBarLabel: () => null,
          headerShown: false,
        }}
        listeners={() => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            // Navigate to add medication screen
            router.push("/medication/add");
          },
        })}
      /> */}
      
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      </Tabs>
    </SafeAreaView>
  );
}
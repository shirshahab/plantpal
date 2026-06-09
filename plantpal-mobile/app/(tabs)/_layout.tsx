import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Brand } from "@/lib/theme";
import { useColorScheme } from "@/components/useColorScheme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, color, focused }: { name: IconName; color: string; focused: boolean }) {
  return <Ionicons name={name} size={focused ? 24 : 22} color={color as string} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].card,
          borderTopColor: Colors[colorScheme].border,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        headerStyle: { backgroundColor: Brand.background },
        headerTintColor: Brand.text,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "sunny" : "sunny-outline"} color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: "Garden",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "leaf" : "leaf-outline"} color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "add-circle" : "add-circle-outline"}
              color={focused ? Brand.primary : String(color)}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "camera" : "camera-outline"} color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="academy"
        options={{
          title: "Academy",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "school" : "school-outline"} color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "grid" : "grid-outline"} color={String(color)} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

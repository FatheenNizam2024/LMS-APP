//import useUser from "@/hooks/auth/useUser";
import { Tabs } from "expo-router";
import { Image } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function TabsLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
    <Tabs
      screenOptions={({ route }) => {
        return {
          tabBarIcon: ({ color }) => {
            let iconName;
            if (route.name === "index") {
              iconName = require("@/assets/icons/HouseSimple.png");
            } else if (route.name === "courses/index") {
              iconName = require("@/assets/icons/BookBookmark.png");
            } else if (route.name === "profile/index") {
              iconName = require("@/assets/icons/User.png");
            }

            if (!iconName) return null; 
            
            return (
              <Image
                style={{ width: 25, height: 25, tintColor: color }}
                source={iconName}
              />
            );
          },
          headerShown: false,
          tabBarShowLabel: false,
        };
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="courses/index" />
      <Tabs.Screen name="profile/index" />
      </Tabs>
     </SafeAreaView>
    </SafeAreaProvider>
  );
}

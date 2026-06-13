// app/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: "#999",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="rotinas"
        options={{
          title: "Rotinas",
          tabBarIcon: ({ color }) => (
            <Ionicons name="barbell" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="nutricao"
        options={{
          title: "Nutrição",
          tabBarIcon: ({ color }) => (
            <Ionicons name="nutrition" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="grupo"
        options={{
          title: "Grupo",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
// app/index.tsx

import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../src/context/AuthContext";

export default function Index() {
  const { logado, carregando } = useAuth();

  if (carregando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (logado) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
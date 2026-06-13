// src/components/Header.tsx

import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

export default function Header({
  name,
  subtitle,
}: {
  name: string;
  subtitle: string;
}) {
  return (
    <LinearGradient
      colors={["#2563eb", "#0f2e82"]}
      style={styles.container}
    >
      <View style={styles.row}>
        <View>
          <Text style={styles.greeting}>
            Olá, {name}!
          </Text>
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#c7d2fe",
    textTransform: "capitalize",
  },
});

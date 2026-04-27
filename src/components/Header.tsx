import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text } from "react-native";

type HeaderProps = {
  name: string;
  subtitle: string;
};

export default function Header({ name, subtitle }: HeaderProps) {
  return (
    <LinearGradient
      colors={["#2563eb", "#0f2e82"]}
      style={styles.container}
    >
      <Text style={styles.greeting}>Olá, {name}! 👋</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
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
  greeting: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#c7d2fe",
  },
});
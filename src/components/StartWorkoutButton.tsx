// src/components/StartWorkoutButton.tsx

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function StartWorkoutButton() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Treino de Hoje</Text>

      <View style={styles.card}>
        <Text style={styles.name}>Treino A - Peito e Tríceps</Text>
        <Text style={styles.info}>45 minutos • 8 exercícios</Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Iniciar Treino</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#e0ecff",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },
  name: {
    fontWeight: "600",
  },
  info: {
    color: "#555",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
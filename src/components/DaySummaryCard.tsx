// src/components/DaySummaryCard.tsx

import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function DaySummaryCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Resumo do Dia</Text>

      {/* Hidratação */}
      <View style={styles.item}>
        <View style={styles.row}>
          <View style={styles.left}>
            <Ionicons name="water-outline" size={16} color="#3b82f6" />
            <Text style={styles.label}>Hidratação</Text>
          </View>
          <Text style={styles.value}>1.5L / 2.5L</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: "60%" }]} />
        </View>
      </View>

      {/* Calorias */}
      <View style={styles.item}>
        <View style={styles.row}>
          <View style={styles.left}>
            <Ionicons name="flame-outline" size={16} color="#f97316" />
            <Text style={styles.label}>Calorias</Text>
          </View>
          <Text style={styles.value}>1200 / 2000 kcal</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: "60%" }]} />
        </View>
      </View>

      {/* Treino */}
      <View style={styles.item}>
        <View style={styles.row}>
          <View style={styles.left}>
            <Ionicons name="trending-up-outline" size={16} color="#22c55e" />
            <Text style={styles.label}>Treino</Text>
          </View>
          <Text style={styles.value}>2 / 3 exercícios</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: "66%" }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: -20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 4,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 12,
    fontSize: 16,
  },
  item: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 12,
    color: "#666",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
  },
  progress: {
    height: 6,
    backgroundColor: "#111827",
    borderRadius: 10,
  },
});
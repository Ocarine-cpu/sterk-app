import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { COLORS } from "../../styles/theme";
import { DadosLuta } from "../../types";

interface Props {
  value: DadosLuta;
  onChange: (
    dados: DadosLuta
  ) => void;
}

const ESTILOS = [
  "Boxe",
  "Muay Thai",
  "Jiu-Jitsu",
  "Judô",
  "Karatê",
  "MMA",
  "Taekwondo",
];

export default function FormLutas({
  value,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Lutas
      </Text>

      <Text style={styles.label}>
        Duração (min)
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={
          value.duracao
            ? String(value.duracao)
            : ""
        }
        onChangeText={(texto) =>
          onChange({
            ...value,
            duracao:
              Number(texto) || 0,
          })
        }
      />

      <Text style={styles.label}>
        Estilo
      </Text>

      <View style={styles.opcoes}>
        {ESTILOS.map((estilo) => (
          <Text
            key={estilo}
            style={[
              styles.opcao,
              value.estilo === estilo &&
                styles.opcaoAtiva,
            ]}
            onPress={() =>
              onChange({
                ...value,
                estilo,
              })
            }
          >
            {estilo}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  label: {
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: COLORS.card,
  },
  opcoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  opcao: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  opcaoAtiva: {
    backgroundColor: "#2563eb",
    color: "#fff",
  },
});
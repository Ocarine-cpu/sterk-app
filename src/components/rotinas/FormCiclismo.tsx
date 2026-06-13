import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { COLORS } from "../../styles/theme";
import { DadosCiclismo } from "../../types";

interface Props {
  value: DadosCiclismo;
  onChange: (
    dados: DadosCiclismo
  ) => void;
}

const TERRENOS = [
  "Asfalto",
  "Terra",
  "Misto",
  "Montanha",
];

export default function FormCiclismo({
  value,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Ciclismo
      </Text>

      <Text style={styles.label}>
        Distância (km)
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={
          value.distancia
            ? String(value.distancia)
            : ""
        }
        onChangeText={(texto) =>
          onChange({
            ...value,
            distancia:
              Number(
                texto.replace(",", ".")
              ) || 0,
          })
        }
      />

      <Text style={styles.label}>
        Tempo (min)
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={
          value.tempo
            ? String(value.tempo)
            : ""
        }
        onChangeText={(texto) =>
          onChange({
            ...value,
            tempo:
              Number(texto) || 0,
          })
        }
      />

      <Text style={styles.label}>
        Terreno
      </Text>

      <View style={styles.opcoes}>
        {TERRENOS.map((terreno) => (
          <Text
            key={terreno}
            style={[
              styles.opcao,
              value.terreno === terreno &&
                styles.opcaoAtiva,
            ]}
            onPress={() =>
              onChange({
                ...value,
                terreno,
              })
            }
          >
            {terreno}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },

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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },

  opcaoAtiva: {
    backgroundColor: "#2563eb",
    color: "#fff",
  },
});
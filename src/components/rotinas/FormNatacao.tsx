import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { COLORS } from "../../styles/theme";
import { DadosNatacao } from "../../types";

interface Props {
  value: DadosNatacao;
  onChange: (
    dados: DadosNatacao
  ) => void;
}

const ESTILOS = [
  "Livre",
  "Costas",
  "Peito",
  "Borboleta",
  "Medley",
];

export default function FormNatacao({
  value,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Natação
      </Text>

      <Text style={styles.label}>
        Distância (metros)
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={
          value.distancia
            ? String(value.distancia)
            : ""
        }
        onChangeText={(texto) =>
          onChange({
            ...value,
            distancia:
              Number(texto) || 0,
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
    marginTop: 10,
    marginBottom: 6,
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
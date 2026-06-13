import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { COLORS } from "../../styles/theme";
import { DadosPilates } from "../../types";

interface Props {
  value: DadosPilates;
  onChange: (
    dados: DadosPilates
  ) => void;
}

export default function FormPilates({
  value,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Pilates
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
            duracao:
              Number(texto) || 0,
          })
        }
      />

      <Text style={styles.info}>
        Informe a duração média da
        sessão de pilates.
      </Text>
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
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: COLORS.card,
  },

  info: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { COLORS } from "../../styles/theme";
import { DadosCorrida } from "../../types";

interface Props {
  value: DadosCorrida;
  onChange: (
    dados: DadosCorrida
  ) => void;
}

export default function FormCardio({
  value,
  onChange,
}: Props) {
  function alterarDistancia(
    texto: string
  ) {
    onChange({
      ...value,
      distancia:
        Number(
          texto.replace(",", ".")
        ) || 0,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Corrida
      </Text>

      <Text style={styles.label}>
        Distância (km)
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="Ex: 5"
        value={
          value.distancia
            ? String(
                value.distancia
              )
            : ""
        }
        onChangeText={
          alterarDistancia
        }
      />

      <Text style={styles.info}>
        Informe a distância que
        pretende percorrer em cada
        treino.
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
    fontSize: 14,
    marginBottom: 6,
    color: COLORS.text,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor:
      COLORS.card,
  },

  info: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
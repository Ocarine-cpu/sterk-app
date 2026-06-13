import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { COLORS } from "../../styles/theme";

interface Props {
  horario?: string;
  onChange: (
    horario?: string
  ) => void;
}

const HORAS = Array.from(
  { length: 24 },
  (_, i) =>
    i.toString().padStart(2, "0")
);

const MINUTOS = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
];

export default function HorarioPicker({
  horario,
  onChange,
}: Props) {
  const [horaAtual, minutoAtual] =
    horario?.split(":") ?? [
      "08",
      "00",
    ];

  function alterarHora(
    novaHora: string
  ) {
    onChange(
      `${novaHora}:${minutoAtual}`
    );
  }

  function alterarMinuto(
    novoMinuto: string
  ) {
    onChange(
      `${horaAtual}:${novoMinuto}`
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Horário (opcional)
      </Text>

      <View style={styles.linha}>
        <View style={styles.coluna}>
          <Text style={styles.label}>
            Hora
          </Text>

          <View style={styles.lista}>
            {HORAS.map((hora) => (
              <TouchableOpacity
                key={hora}
                style={[
                  styles.item,
                  horaAtual === hora &&
                    styles.itemAtivo,
                ]}
                onPress={() =>
                  alterarHora(hora)
                }
              >
                <Text
                  style={[
                    styles.itemTexto,
                    horaAtual ===
                      hora &&
                      styles.itemTextoAtivo,
                  ]}
                >
                  {hora}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.coluna}>
          <Text style={styles.label}>
            Min
          </Text>

          <View style={styles.lista}>
            {MINUTOS.map((minuto) => (
              <TouchableOpacity
                key={minuto}
                style={[
                  styles.item,
                  minutoAtual ===
                    minuto &&
                    styles.itemAtivo,
                ]}
                onPress={() =>
                  alterarMinuto(
                    minuto
                  )
                }
              >
                <Text
                  style={[
                    styles.itemTexto,
                    minutoAtual ===
                      minuto &&
                      styles.itemTextoAtivo,
                  ]}
                >
                  {minuto}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.remover}
        onPress={() =>
          onChange(undefined)
        }
      >
        <Text style={styles.removerTexto}>
          Remover horário
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },

  titulo: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },

  linha: {
    flexDirection: "row",
    gap: 12,
  },

  coluna: {
    flex: 1,
  },

  label: {
    marginBottom: 8,
    fontWeight: "600",
  },

  lista: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  item: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  itemAtivo: {
    backgroundColor: COLORS.primary,
  },

  itemTexto: {
    color: "#111827",
  },

  itemTextoAtivo: {
    color: "#fff",
    fontWeight: "700",
  },

  remover: {
    marginTop: 12,
    alignSelf: "flex-start",
  },

  removerTexto: {
    color: "#ef4444",
    fontWeight: "600",
  },
});
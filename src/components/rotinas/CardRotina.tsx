import React from "react";
import {
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONT, SPACING } from "../../styles/theme";
import { Rotina } from "../../types";

interface Props {
  rotina: Rotina;
  expandido: boolean;

  onToggle: () => void;

  onEditar?: (rotina: Rotina) => void;
  onExcluir?: (rotina: Rotina) => void;
}

const ICONES = {
  academia: "barbell-outline",
  corrida: "walk-outline",
  ciclismo: "bicycle-outline",
  natacao: "water-outline",
  lutas: "shield-outline",
  pilates: "body-outline",
  danca: "musical-notes-outline",
} as const;

const LABELS = {
  academia: "Academia",
  corrida: "Corrida",
  ciclismo: "Ciclismo",
  natacao: "Natação",
  lutas: "Lutas",
  pilates: "Pilates",
  danca: "Dança",
} as const;

export default function CardRotina({
  rotina,
  expandido,
  onToggle,
  onEditar,
  onExcluir,
}: Props) {
  const dados: any = rotina.dados;

  const icone =
    ICONES[rotina.tipo as keyof typeof ICONES] ??
    "fitness-outline";

  const label =
    LABELS[rotina.tipo as keyof typeof LABELS] ??
    rotina.tipo;

  function renderDetalhes() {
    switch (rotina.tipo) {
      case "academia":
        return (
          <>
            {dados?.foco?.length > 0 && (
              <View style={styles.bloco}>
                <Text style={styles.tituloBloco}>
                  Foco muscular
                </Text>

                <Text style={styles.texto}>
                  {dados.foco.join(" • ")}
                </Text>
              </View>
            )}

            {dados?.exercicios?.length > 0 && (
              <View style={styles.bloco}>
                <Text style={styles.tituloBloco}>
                  Exercícios
                </Text>

                {dados.exercicios.map(
                  (ex: any, index: number) => (
                    <View
                      key={`${ex.nome}-${index}`}
                      style={styles.itemExercicio}
                    >
                      <Text style={styles.texto}>
                        {ex.nome}
                      </Text>

                      <Text
                            style={styles.textoSecundario}
                        >
                            {ex.series} séries • {ex.repeticoes} repetições
                        </Text>
                    </View>
                  )
                )}
              </View>
            )}
          </>
        );

      case "corrida":
        return (
          <View style={styles.bloco}>
            <Text style={styles.texto}>
              Distância: {dados?.distancia ?? 0} km
            </Text>

            <Text style={styles.texto}>
              Tempo: {dados?.tempo ?? 0} min
            </Text>
          </View>
        );

      case "ciclismo":
        return (
          <View style={styles.bloco}>
            <Text style={styles.texto}>
              Distância: {dados?.distancia ?? 0} km
            </Text>

            <Text style={styles.texto}>
              Tempo: {dados?.tempo ?? 0} min
            </Text>

            <Text style={styles.texto}>
              Terreno: {dados?.terreno ?? "-"}
            </Text>
          </View>
        );

      case "natacao":
        return (
          <View style={styles.bloco}>
            <Text style={styles.texto}>
              Distância: {dados?.distancia ?? 0} m
            </Text>

            <Text style={styles.texto}>
              Estilo: {dados?.estilo ?? "-"}
            </Text>

            <Text style={styles.texto}>
              Tempo: {dados?.tempo ?? 0} min
            </Text>
          </View>
        );

      case "lutas":
        return (
          <View style={styles.bloco}>
            <Text style={styles.texto}>
              Modalidade: {dados?.estilo ?? "-"}
            </Text>

            <Text style={styles.texto}>
              Duração: {dados?.duracao ?? 0} min
            </Text>
          </View>
        );

      case "pilates":
        return (
          <View style={styles.bloco}>
            <Text style={styles.texto}>
              Estilo: {dados?.estilo ?? "-"}
            </Text>

            <Text style={styles.texto}>
              Duração: {dados?.duracao ?? 0} min
            </Text>
          </View>
        );

      case "danca":
        return (
          <View style={styles.bloco}>
            <Text style={styles.texto}>
              Estilo: {dados?.estilo ?? "-"}
            </Text>

            <Text style={styles.texto}>
              Duração: {dados?.duracao ?? 0} min
            </Text>
          </View>
        );

      default:
        return null;
    }
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onToggle}
      >
        <View style={styles.topo}>
          <View style={styles.infoPrincipal}>
            <View style={styles.iconeContainer}>
              <Ionicons
                name={icone as any}
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.nome}>
                {rotina.nome}
              </Text>

              <Text style={styles.tipo}>
                {label}
              </Text>
            </View>
          </View>

          <Ionicons
            name={
              expandido
                ? "chevron-up"
                : "chevron-down"
            }
            size={20}
            color={COLORS.textSecondary}
          />
        </View>

        <View style={styles.tags}>
          {rotina.dias?.map((dia) => (
            <View
              key={dia}
              style={styles.tag}
            >
              <Text style={styles.tagTexto}>
                {dia.toUpperCase()}
              </Text>
            </View>
          ))}

          {rotina.horario && (
            <View style={styles.tagHorario}>
              <Ionicons
                name="time-outline"
                size={12}
                color="#16a34a"
              />

              <Text style={styles.tagHorarioTexto}>
                {rotina.horario}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {expandido && (
        <View style={styles.areaExpandida}>
          {renderDetalhes()}

          <View style={styles.acoes}>
            <TouchableOpacity
              style={styles.btnEditar}
              onPress={() =>
                onEditar?.(rotina)
              }
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={COLORS.primary}
              />

              <Text
                style={styles.btnEditarTexto}
              >
                Editar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnExcluir}
              onPress={() =>
                onExcluir?.(rotina)
              }
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color="#ef4444"
              />

              <Text
                style={styles.btnExcluirTexto}
              >
                Excluir
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = {
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: 12,

    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  topo: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },

  infoPrincipal: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },

  iconeContainer: {
    width: 42,
    height: 42,

    borderRadius: 12,

    backgroundColor: "#eff6ff",

    alignItems: "center" as const,
    justifyContent: "center" as const,

    marginRight: 12,
  },

  nome: {
    fontSize: FONT.xl,
    fontWeight: "700" as const,
    color: COLORS.text,
  },

  tipo: {
    fontSize: FONT.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  tags: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
    marginTop: 12,
  },

  tag: {
    backgroundColor: "#eff6ff",

    borderWidth: 1,
    borderColor: "#bfdbfe",

    borderRadius: 16,

    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  tagTexto: {
    color: COLORS.primary,
    fontWeight: "600" as const,
    fontSize: FONT.sm,
  },

  tagHorario: {
    flexDirection: "row" as const,
    alignItems: "center" as const,

    gap: 4,

    backgroundColor: "#f0fdf4",

    borderWidth: 1,
    borderColor: "#bbf7d0",

    borderRadius: 16,

    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  tagHorarioTexto: {
    color: "#16a34a",
    fontWeight: "600" as const,
    fontSize: FONT.sm,
  },

  areaExpandida: {
    marginTop: 16,
    paddingTop: 16,

    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  bloco: {
    marginBottom: 14,
  },

  tituloBloco: {
    fontWeight: "700" as const,
    color: COLORS.text,
    marginBottom: 6,
  },

  texto: {
    color: COLORS.text,
    fontSize: FONT.md,
    marginBottom: 4,
  },

  textoSecundario: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
  },

  itemExercicio: {
    marginBottom: 8,
  },

  acoes: {
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 8,
  },

  btnEditar: {
    flex: 1,

    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,

    gap: 6,

    paddingVertical: 12,

    borderRadius: 12,

    backgroundColor: "#eff6ff",
  },

  btnEditarTexto: {
    color: COLORS.primary,
    fontWeight: "600" as const,
  },

  btnExcluir: {
    flex: 1,

    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,

    gap: 6,

    paddingVertical: 12,

    borderRadius: 12,

    backgroundColor: "#fee2e2",
  },

  btnExcluirTexto: {
    color: "#ef4444",
    fontWeight: "600" as const,
  },
};
// src/components/ExercicioCard.tsx
// Card reutilizável para exibir um exercício de academia.
// Mostra nome + séries/reps (ou conteúdo customizado via `children`) e, se
// houver informações detalhadas (descrição, instruções, sugestões da API),
// exibe um botão "ⓘ" que expande esses detalhes — usado na criação da rotina,
// no card expandido da rotina e na tela de detalhes.

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { COLORS, FONT } from "../styles/theme";
import { ExercicioAcademia } from "../types";

interface Props {
  exercicio: ExercicioAcademia;
  /** Botões de ação extra (editar, remover, etc.), exibidos à direita */
  actions?: React.ReactNode;
  /** Conteúdo customizado no lugar do texto padrão "X séries · Y reps" */
  children?: React.ReactNode;
}

export default function ExercicioCard({ exercicio, actions, children }: Props) {
  const [expandido, setExpandido] = useState(false);

  const temDetalhes = !!(
    exercicio.descricao ||
    (exercicio.instrucoes && exercicio.instrucoes.length > 0) ||
    exercicio.equipamento ||
    exercicio.dificuldade ||
    exercicio.seriesSugeridas ||
    exercicio.repsSugeridas ||
    exercicio.descansoSugerido
  );

  return (
    <View style={{
      backgroundColor: "#f9fafb",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      overflow: "hidden",
    }}>
      {/* Linha principal */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, gap: 8 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontWeight: "600", color: COLORS.text, fontSize: FONT.sm }}>
            {exercicio.nome}
          </Text>
          {children ?? (
            <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
              {exercicio.series} séries · {exercicio.repeticoes} reps
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          {temDetalhes && (
            <TouchableOpacity
              onPress={() => setExpandido((e) => !e)}
              style={{ padding: 6 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={expandido ? "chevron-up-circle" : "information-circle-outline"}
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
          {actions}
        </View>
      </View>

      {/* Detalhes expandidos */}
      {expandido && temDetalhes && (
        <View style={{
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          padding: 12,
          gap: 8,
          backgroundColor: "#fff",
        }}>
          {exercicio.descricao && (
            <Text style={{ fontSize: FONT.sm, color: COLORS.text, lineHeight: 18 }}>
              {exercicio.descricao}
            </Text>
          )}

          {exercicio.instrucoes && exercicio.instrucoes.length > 0 && (
            <View style={{ gap: 4 }}>
              <Text style={{ fontWeight: "700", fontSize: FONT.sm, color: COLORS.text }}>
                Como executar:
              </Text>
              {exercicio.instrucoes.map((inst, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{
                    width: 18, height: 18, borderRadius: 9,
                    backgroundColor: COLORS.primary,
                    alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, flex: 1, lineHeight: 18 }}>
                    {inst}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {(exercicio.equipamento || exercicio.dificuldade) && (
            <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
              {exercicio.equipamento}
              {exercicio.equipamento && exercicio.dificuldade ? " · " : ""}
              {exercicio.dificuldade}
            </Text>
          )}

          {(exercicio.seriesSugeridas || exercicio.repsSugeridas || exercicio.descansoSugerido) && (
            <View style={{ backgroundColor: "#eff6ff", borderRadius: 8, padding: 8 }}>
              <Text style={{ color: COLORS.primary, fontSize: FONT.sm, fontWeight: "500" }}>
                Sugestão: {exercicio.seriesSugeridas ?? "—"} séries · {exercicio.repsSugeridas ?? "—"} reps · Descanso: {exercicio.descansoSugerido ?? "—"}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
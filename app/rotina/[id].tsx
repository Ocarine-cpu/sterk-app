// app/rotina/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ExercicioCard from "../../src/components/ExercicioCard";
import {
  buscarRotinaPorId,
  deletarRotina,
  removerExercicioRotina,
} from "../../src/services/rotinaService";
import { COLORS, FONT, SPACING } from "../../src/styles/theme";
import { ExercicioAcademia, Rotina } from "../../src/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; cor: string; bg: string }> = {
  academia:  { label: "Academia", icon: "barbell-outline",       cor: "#2563eb", bg: "#eff6ff" },
  corrida:   { label: "Corrida",   icon: "walk-outline",          cor: "#dc2626", bg: "#fef2f2" },
  caminhada: { label: "Caminhada", icon: "walk-outline",          cor: "#059669", bg: "#f0fdf4" },
  ciclismo:  { label: "Ciclismo",  icon: "bicycle-outline",       cor: "#d97706", bg: "#fffbeb" },
  lutas:     { label: "Lutas",     icon: "shield-outline",        cor: "#7c3aed", bg: "#f5f3ff" },
  natacao:   { label: "Natação",   icon: "water-outline",         cor: "#0284c7", bg: "#f0f9ff" },
  yoga:      { label: "Yoga",      icon: "body-outline",          cor: "#0891b2", bg: "#ecfeff" },
  pilates:   { label: "Pilates",   icon: "body-outline",          cor: "#db2777", bg: "#fdf2f8" },
  danca:     { label: "Dança",     icon: "musical-notes-outline", cor: "#c026d3", bg: "#fdf4ff" },
};

function cfg(tipo: string) {
  return TIPO_CONFIG[tipo] ?? { label: tipo, icon: "document-text-outline", cor: COLORS.primary, bg: "#eff6ff" };
}

// ─── Componente de linha de detalhe ──────────────────────────────────────────

function LinhaDetalhe({ label, valor, icon }: { label: string; valor: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
        {icon && <Ionicons name={icon} size={16} color={COLORS.textSecondary} />}
        <Text style={{ color: COLORS.textSecondary, fontSize: FONT.md }}>{label}</Text>
      </View>
      <Text style={{ color: COLORS.text, fontSize: FONT.md, fontWeight: "600", flex: 1, textAlign: "right" }}>
        {valor}
      </Text>
    </View>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function DetalheRotina() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [rotina, setRotina] = useState<Rotina | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        if (!id || typeof id !== "string") return;
        const dados = await buscarRotinaPorId(id);
        setRotina(dados);
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [id]);

  async function recarregar() {
    if (!id || typeof id !== "string") return;
    const dados = await buscarRotinaPorId(id);
    setRotina(dados);
  }

  async function confirmarDelete() {
    Alert.alert(
      "Excluir rotina",
      "Tem certeza que deseja excluir esta rotina? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletando(true);
              await deletarRotina(rotina!.id);
              router.back();
            } catch (e: any) {
              Alert.alert("Erro", e.message);
            } finally {
              setDeletando(false);
            }
          },
        },
      ]
    );
  }

  async function removerExercicio(index: number) {
    Alert.alert(
      "Remover exercício",
      "Deseja remover este exercício da rotina?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await removerExercicioRotina(rotina!.id, index);
              await recarregar();
            } catch (e: any) {
              Alert.alert("Erro", e.message);
            }
          },
        },
      ]
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!rotina) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 12 }}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
        <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: FONT.xl }}>
          Rotina não encontrada
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
          <Text style={{ color: COLORS.primary, fontWeight: "600" }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = cfg(rotina.tipo);
  const dados = rotina.dados as any;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ─── Header hero ─────────────────────────────────────────────────── */}
      <View style={{
        backgroundColor: config.bg,
        paddingTop: 52,
        paddingBottom: SPACING.xl,
        paddingHorizontal: SPACING.lg,
      }}>
        {/* Botão voltar */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 20 }}
        >
          <Ionicons name="arrow-back" size={18} color={config.cor} />
          <Text style={{ color: config.cor, fontWeight: "600", fontSize: FONT.md }}>Voltar</Text>
        </TouchableOpacity>

        {/* Ícone principal da categoria + Badge */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{
            width: 64, height: 64, borderRadius: 16,
            backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
            elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4
          }}>
            <Ionicons name={config.icon} size={36} color={config.cor} />
          </View>
          <View style={{
            backgroundColor: config.cor,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 20,
          }}>
            <Text style={{ color: "#fff", fontSize: FONT.sm, fontWeight: "700" }}>
              {config.label.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.text, marginTop: 16 }}>
          {rotina.nome}
        </Text>

        {/* Dias */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {(rotina.dias ?? []).map((dia) => (
            <View key={dia} style={{
              backgroundColor: config.cor,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
            }}>
              <Text style={{ color: "#fff", fontSize: FONT.sm, fontWeight: "700" }}>
                {dia.toUpperCase()}
              </Text>
            </View>
          ))}
          {rotina.horario && (
            <View style={{
              backgroundColor: "#fff",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: config.cor,
              flexDirection: "row",
              alignItems: "center",
              gap: 4
            }}>
              <Ionicons name="time-outline" size={14} color={config.cor} />
              <Text style={{ color: config.cor, fontSize: FONT.sm, fontWeight: "700" }}>
                {rotina.horario}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ padding: SPACING.lg, gap: 16 }}>

        {/* ─── ACADEMIA ────────────────────────────────────────────────────── */}
        {rotina.tipo === "academia" && (
          <>
            {/* Foco muscular */}
            <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: SPACING.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Ionicons name="fitness-outline" size={20} color={COLORS.text} />
                <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
                  Foco Muscular
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {dados?.foco?.length > 0 ? (
                  dados.foco.map((f: string) => (
                    <View key={f} style={{
                      backgroundColor: "#f5f3ff",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: "#ddd6fe",
                    }}>
                      <Text style={{ color: "#7c3aed", fontWeight: "600", fontSize: FONT.md }}>{f}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: COLORS.textSecondary }}>Não definido</Text>
                )}
              </View>
            </View>

            {/* Exercícios */}
            <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: SPACING.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Ionicons name="barbell-outline" size={20} color={COLORS.text} />
                <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
                  Exercícios
                </Text>
              </View>

              {!dados?.exercicios?.length ? (
                <Text style={{ color: COLORS.textSecondary, marginBottom: 8 }}>
                  Nenhum exercício adicionado ainda.
                </Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {dados.exercicios.map((ex: ExercicioAcademia, idx: number) => (
                    <ExercicioCard
                      key={idx}
                      exercicio={ex}
                      actions={
                        <TouchableOpacity
                          onPress={() => removerExercicio(idx)}
                          style={{
                            width: 28,
                            height: 28,
                            backgroundColor: "#fee2e2",
                            borderRadius: 14,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="close" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      }
                    />
                  ))}
                </View>
              )}

              {/* Botão adicionar exercício via API */}
              <TouchableOpacity
                onPress={() => router.push(`/rotina/adicionarExercicio?rotinaId=${rotina.id}` as any)}
                style={{
                  borderWidth: 2,
                  borderColor: COLORS.primary,
                  borderStyle: "dashed",
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 12,
                }}
              >
                <Ionicons name="add" size={18} color={COLORS.primary} style={{ fontWeight: "700" }} />
                <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: FONT.md }}>
                  Adicionar Exercício
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── CORRIDA / CAMINHADA ────────────────────────────────────────___ */}
        {["corrida", "caminhada"].includes(rotina.tipo) && (
          <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: SPACING.lg, gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Ionicons name="stats-chart-outline" size={20} color={COLORS.text} />
              <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
                Detalhes
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 8 }} />
            <LinhaDetalhe icon="resize-outline" label="Distância" valor={`${dados?.distancia ?? 0} km`} />
            <LinhaDetalhe icon="time-outline" label="Tempo estimado" valor={`${dados?.tempo ?? 0} min`} />
          </View>
        )}

        {/* ─── CICLISMO ────────────────────────────────────────────────────── */}
        {rotina.tipo === "ciclismo" && (
          <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: SPACING.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Ionicons name="stats-chart-outline" size={20} color={COLORS.text} />
              <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
                Detalhes
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 8 }} />
            <LinhaDetalhe icon="resize-outline" label="Distância" valor={`${dados?.distancia ?? 0} km`} />
            <LinhaDetalhe icon="map-outline" label="Terreno" valor={dados?.terreno || "Não definido"} />
            <LinhaDetalhe icon="time-outline" label="Tempo estimado" valor={`${dados?.tempo ?? 0} min`} />
          </View>
        )}

        {/* ─── NATAÇÃO ─────────────────────────────────────────────────────── */}
        {rotina.tipo === "natacao" && (
          <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: SPACING.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Ionicons name="stats-chart-outline" size={20} color={COLORS.text} />
              <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
                Detalhes
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 8 }} />
            <LinhaDetalhe icon="water-outline" label="Estilo" valor={dados?.estilo || "Livre"} />
            <LinhaDetalhe icon="resize-outline" label="Distância" valor={`${dados?.distancia ?? 0} metros`} />
            <LinhaDetalhe icon="time-outline" label="Tempo estimado" valor={`${dados?.tempo ?? 0} min`} />
          </View>
        )}

        {/* ─── LUTAS / DANÇA / YOGA / PILATES ──────────────────────────────── */}
        {["lutas", "danca", "yoga", "pilates"].includes(rotina.tipo) && (
          <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: SPACING.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Ionicons name="stats-chart-outline" size={20} color={COLORS.text} />
              <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
                Detalhes
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 8 }} />
            <LinhaDetalhe
              icon={rotina.tipo === "lutas" ? "shield-outline" : "musical-notes-outline"}
              label={rotina.tipo === "lutas" ? "Modalidade" : "Estilo"}
              valor={dados?.estilo || "Não definido"}
            />
            <LinhaDetalhe icon="time-outline" label="Duração" valor={`${dados?.duracao ?? 0} min`} />
          </View>
        )}

        {/* ─── BOTÃO EXCLUIR ────────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={confirmarDelete}
          disabled={deletando}
          style={{
            backgroundColor: "#fef2f2",
            borderRadius: 14,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            borderWidth: 1,
            borderColor: "#fecaca",
          }}
        >
          {!deletando && <Ionicons name="trash-outline" size={18} color="#dc2626" />}
          <Text style={{ color: "#dc2626", fontWeight: "700", fontSize: FONT.md }}>
            {deletando ? "Excluindo..." : "Excluir Rotina"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
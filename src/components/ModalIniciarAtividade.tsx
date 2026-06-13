// src/components/ModalIniciarAtividade.tsx
// Modal compartilhado usado na home e na tela de detalhes da rotina.
// Permite ao usuário registrar duração e salva o treino como concluído.

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { calcularCalorias } from "../services/api";
import { salvarTreinoConcluido } from "../services/workoutStorage";
import { COLORS, FONT, SPACING } from "../styles/theme";
import { Rotina, TipoExercicio } from "../types";

// Mapeamento de tipo → id da atividade na API
const ATIVIDADE_API_ID: Record<TipoExercicio, string> = {
  academia:  "funcional",
  corrida:   "corrida_moderada",
  ciclismo:  "ciclismo_moderado",
  natacao:   "natacao_moderada",
  lutas:     "muay_thai",
  danca:     "funcional",
  pilates:   "pilates",
};

// Caloria padrão por minuto por tipo (fallback se API falhar)
const CAL_POR_MIN: Record<TipoExercicio, number> = {
  academia: 8,
  corrida:  12,
  ciclismo: 9,
  natacao:  10,
  lutas:    11,
  danca:    6,
  pilates:  4,
};

interface Props {
  visivel: boolean;
  rotina: Rotina | null;
  onFechar: () => void;
  onConcluido?: (caloriasGastas: number) => void;
}

export default function ModalIniciarAtividade({
  visivel,
  rotina,
  onFechar,
  onConcluido,
}: Props) {
  const { usuario } = useAuth();

  const [etapa, setEtapa] = useState<"configurar" | "cronometro" | "concluido">("configurar");
  const [duracaoMin, setDuracaoMin] = useState("30");
  const [caloriasGastas, setCaloriasGastas] = useState(0);
  const [calculando, setCalculando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Cronômetro
  const [segundos, setSegundos] = useState(0);
  const [rodando, setRodando] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visivel) {
      // Reset ao fechar
      setEtapa("configurar");
      setDuracaoMin("30");
      setCaloriasGastas(0);
      setSegundos(0);
      setRodando(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [visivel]);

  useEffect(() => {
    if (rodando) {
      intervalRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [rodando]);

  function formatarTempo(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  async function iniciarCronometro() {
    const min = parseInt(duracaoMin, 10);
    if (!min || min <= 0) {
      Alert.alert("Atenção", "Informe uma duração válida.");
      return;
    }
    setEtapa("cronometro");
    setSegundos(0);
    setRodando(true);
  }

  async function concluirTreino() {
    if (!rotina || !usuario) return;
    setRodando(false);
    setCalculando(true);

    const duracaoReal = Math.max(Math.round(segundos / 60), 1);
    const pesoKg = usuario.peso ?? 70;

    let calorias = 0;
    try {
      const atividadeId = ATIVIDADE_API_ID[rotina.tipo] ?? "funcional";
      const resultado = await calcularCalorias(atividadeId, duracaoReal, pesoKg);
      calorias = resultado.gastoCalorico ?? 0;
    } catch {
      // Fallback: estimativa simples
      calorias = Math.round((CAL_POR_MIN[rotina.tipo] ?? 8) * duracaoReal);
    }

    setCaloriasGastas(calorias);
    setCalculando(false);
    setSalvando(true);

    try {
      await salvarTreinoConcluido({
        rotinaId: rotina.id,
        rotinaNome: rotina.nome,
        tipo: rotina.tipo,
        duracaoMin: duracaoReal,
        caloriasGastas: calorias,
      });
    } catch (e) {
      console.error("Erro ao salvar treino:", e);
    }

    setSalvando(false);
    setEtapa("concluido");
    onConcluido?.(calorias);
  }

  if (!rotina) return null;

  return (
    <Modal visible={visivel} transparent animationType="fade">
      <View style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}>
        <View style={{
          backgroundColor: COLORS.card,
          borderRadius: 24,
          width: "100%",
          maxHeight: "85%",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
          elevation: 12,
          overflow: "hidden",
        }}>

          {/* ── Header ── */}
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: SPACING.lg,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="flash-outline" size={20} color={COLORS.primary} />
              <Text style={{ fontSize: FONT.xl, fontWeight: "700", color: COLORS.text }}>
                {etapa === "concluido" ? "Treino Concluído!" : rotina.nome}
              </Text>
            </View>
            <TouchableOpacity onPress={onFechar} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: SPACING.lg, gap: 16 }} showsVerticalScrollIndicator={false}>

            {/* ── ETAPA 1: Configurar ── */}
            {etapa === "configurar" && (
              <>
                {/* Info da rotina */}
                <View style={{
                  backgroundColor: "#eff6ff",
                  borderRadius: 14,
                  padding: SPACING.lg,
                  borderLeftWidth: 4,
                  borderLeftColor: COLORS.primary,
                  gap: 6,
                }}>
                  <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
                    {rotina.nome}
                  </Text>
                  <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, textTransform: "capitalize" }}>
                    {rotina.tipo}
                    {rotina.tipo === "academia" && (rotina.dados as any)?.exercicios?.length > 0
                      ? `  ·  ${(rotina.dados as any).exercicios.length} exercícios`
                      : ""}
                  </Text>
                </View>

                {/* Duração estimada */}
                <View>
                  <Text style={{ fontWeight: "600", fontSize: FONT.md, color: COLORS.text, marginBottom: 8 }}>
                    Duração estimada (minutos)
                  </Text>
                  <TextInput
                    value={duracaoMin}
                    onChangeText={(t) => setDuracaoMin(t.replace(/\D/g, ""))}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: COLORS.background,
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 24,
                      fontWeight: "700",
                      textAlign: "center",
                      color: COLORS.text,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  />
                  <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: "center", marginTop: 6 }}>
                    Você poderá parar o cronômetro quando quiser
                  </Text>
                </View>

                {/* Exercícios da rotina (academia) */}
                {rotina.tipo === "academia" && (rotina.dados as any)?.exercicios?.length > 0 && (
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontWeight: "600", fontSize: FONT.md, color: COLORS.text }}>
                      Exercícios do treino
                    </Text>
                    {((rotina.dados as any).exercicios as any[]).map((ex: any, i: number) => (
                      <View key={i} style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: COLORS.background,
                        borderRadius: 10,
                        padding: 10,
                      }}>
                        <Text style={{ fontWeight: "600", color: COLORS.text, fontSize: FONT.md }}>
                          {ex.nome}
                        </Text>
                        <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm }}>
                          {ex.series}×{ex.repeticoes}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Botão iniciar */}
                <TouchableOpacity
                  onPress={iniciarCronometro}
                  style={{
                    backgroundColor: "#16a34a",
                    borderRadius: 14,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: FONT.lg }}>
                    Iniciar Treino
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onFechar}>
                  <Text style={{ textAlign: "center", color: COLORS.textSecondary, fontSize: FONT.md }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── ETAPA 2: Cronômetro ── */}
            {etapa === "cronometro" && (
              <>
                {/* Timer */}
                <View style={{
                  alignItems: "center",
                  backgroundColor: "#f0fdf4",
                  borderRadius: 20,
                  padding: SPACING.xl,
                  gap: 8,
                  borderWidth: 1,
                  borderColor: "#bbf7d0",
                }}>
                  <Text style={{ fontSize: FONT.sm, color: "#16a34a", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
                    Em andamento
                  </Text>
                  <Text style={{
                    fontSize: 56,
                    fontWeight: "800",
                    color: "#16a34a",
                    letterSpacing: 2,
                    fontVariant: ["tabular-nums"],
                  }}>
                    {formatarTempo(segundos)}
                  </Text>
                  <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
                    {rotina.nome}
                  </Text>
                </View>

                {/* Pause / Resume */}
                <TouchableOpacity
                  onPress={() => setRodando((r) => !r)}
                  style={{
                    backgroundColor: rodando ? "#f59e0b" : COLORS.primary,
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name={rodando ? "pause" : "play"} size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: FONT.lg }}>
                    {rodando ? "Pausar" : "Retomar"}
                  </Text>
                </TouchableOpacity>

                {/* Concluir */}
                <TouchableOpacity
                  onPress={concluirTreino}
                  disabled={calculando || salvando}
                  style={{
                    backgroundColor: calculando || salvando ? "#9ca3af" : "#16a34a",
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: FONT.lg }}>
                    {calculando ? "Calculando calorias..." : salvando ? "Salvando..." : "Concluir Treino"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setRodando(false);
                    Alert.alert(
                      "Abandonar treino",
                      "Deseja sair sem salvar o progresso?",
                      [
                        { text: "Não", style: "cancel", onPress: () => setRodando(true) },
                        { text: "Sair", style: "destructive", onPress: onFechar },
                      ]
                    );
                  }}
                >
                  <Text style={{ textAlign: "center", color: "#ef4444", fontSize: FONT.md, fontWeight: "600" }}>
                    Abandonar treino
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── ETAPA 3: Concluído ── */}
            {etapa === "concluido" && (
              <>
                {/* Parabéns */}
                <View style={{
                  alignItems: "center",
                  backgroundColor: "#f0fdf4",
                  borderRadius: 20,
                  padding: SPACING.xl,
                  gap: 12,
                  borderWidth: 1,
                  borderColor: "#bbf7d0",
                }}>
                  <View style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: "#16a34a",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Ionicons name="checkmark" size={40} color="#fff" />
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: "#16a34a" }}>
                    Treino Concluído!
                  </Text>
                  <Text style={{ fontSize: FONT.md, color: COLORS.textSecondary, textAlign: "center" }}>
                    {rotina.nome}
                  </Text>
                </View>

                {/* Stats */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{
                    flex: 1,
                    backgroundColor: COLORS.background,
                    borderRadius: 14,
                    padding: SPACING.lg,
                    alignItems: "center",
                    gap: 4,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}>
                    <Ionicons name="time-outline" size={22} color={COLORS.primary} />
                    <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.text }}>
                      {formatarTempo(segundos)}
                    </Text>
                    <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>Duração</Text>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: COLORS.background,
                    borderRadius: 14,
                    padding: SPACING.lg,
                    alignItems: "center",
                    gap: 4,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}>
                    <Ionicons name="flame-outline" size={22} color="#f97316" />
                    <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.text }}>
                      {caloriasGastas}
                    </Text>
                    <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>kcal</Text>
                  </View>
                </View>

                <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: "center" }}>
                  Este treino foi salvo no seu histórico e as calorias queimadas já aparecem no resumo do dia.
                </Text>

                <TouchableOpacity
                  onPress={onFechar}
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: FONT.lg }}>
                    Fechar
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
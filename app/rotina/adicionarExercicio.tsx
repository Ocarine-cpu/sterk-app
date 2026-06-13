// app/rotina/adicionarExercicio.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { getExercisesByMuscle } from "../../src/services/api";
import {
  adicionarExercicioRotina,
  buscarRotinaPorId,
} from "../../src/services/rotinaService";
import { COLORS, FONT, SPACING } from "../../src/styles/theme";
import { ExercicioAcademia, Rotina } from "../../src/types";

// ─── Tipos da API ─────────────────────────────────────────────────────────────

interface ExercicioAPI {
  id: number;
  nome: string;
  grupoMuscular: string;
  musculosSecundarios: string[];
  equipamento: string;
  dificuldade: string;
  descricao: string;
  instrucoes: string[];
  series: string;
  repeticoes: string;
  descanso: string; 
}


// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function AdicionarExercicio() {
  const { rotinaId } = useLocalSearchParams<{ rotinaId: string }>();
  const router = useRouter();

  const [rotina, setRotina] = useState<Rotina | null>(null);
  const [exerciciosAPI, setExerciciosAPI] = useState<ExercicioAPI[]>([]);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<ExercicioAPI | null>(null);
  const [expandido, setExpandido] = useState<number | null>(null);

  const [series, setSeries] = useState("");
  const [repeticoes, setRepeticoes] = useState("");

  const [carregandoRotina, setCarregandoRotina] = useState(true);
  const [carregandoExercicios, setCarregandoExercicios] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // ─── Carregar rotina e exercícios ──────────────────────────────────────────

  useEffect(() => {
    async function inicializar() {
      if (!rotinaId) return;
      try {
        const r = await buscarRotinaPorId(rotinaId);
        setRotina(r);

        if (r && r.tipo === "academia" && (r.dados as any)?.foco?.length > 0) {
          await carregarExercicios((r.dados as any).foco);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCarregandoRotina(false);
      }
    }

    inicializar();
  }, [rotinaId]);

  async function carregarExercicios(focos: string[]) {
    setCarregandoExercicios(true);
    try {
      // Busca exercícios para cada foco e agrupa sem repetições
      const promessas = focos.map((f) => getExercisesByMuscle(f));
      const resultados = await Promise.all(promessas);
      const todos: ExercicioAPI[] = resultados.flat();

      // Remove duplicatas por ID
      const unicos = todos.filter(
        (ex, idx, arr) => arr.findIndex((e) => e.id === ex.id) === idx
      );

      setExerciciosAPI(unicos);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar os exercícios da API.");
    } finally {
      setCarregandoExercicios(false);
    }
  }

  // ─── Selecionar exercício ──────────────────────────────────────────────────

  function selecionarExercicio(ex: ExercicioAPI) {
    if (exercicioSelecionado?.id === ex.id) {
      setExercicioSelecionado(null);
      setSeries("");
      setRepeticoes("");
    } else {
      setExercicioSelecionado(ex);
      // Pré-preenche com os valores sugeridos pela API
      const s = ex.series?.split("–")[0]?.replace(/\D/g, "") || "";
      const r = ex.repeticoes?.split("–")[0]?.replace(/\D/g, "") || "";
      setSeries(s);
      setRepeticoes(r);
    }
  }

  // ─── Salvar exercício ─────────────────────────────────────────────────────

  async function salvar() {
    if (!exercicioSelecionado) {
      Alert.alert("Atenção", "Selecione um exercício.");
      return;
    }

    const s = parseInt(series, 10);
    const r = parseInt(repeticoes, 10);

    if (!s || s <= 0) {
      Alert.alert("Atenção", "Informe um número válido de séries.");
      return;
    }
    if (!r || r <= 0) {
      Alert.alert("Atenção", "Informe um número válido de repetições.");
      return;
    }

    const novoExercicio: ExercicioAcademia = {
      nome: exercicioSelecionado.nome,
      series: s,
      repeticoes: r,
    };

    try {
      setSalvando(true);
      await adicionarExercicioRotina(rotinaId, novoExercicio);
      Alert.alert("✅ Salvo!", `${exercicioSelecionado.nome} adicionado à rotina.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    } finally {
      setSalvando(false);
    }
  }

  // ─── Badge de dificuldade ─────────────────────────────────────────────────

  function BadgeDificuldade({ nivel }: { nivel: string }) {
    const cor =
      nivel === "Iniciante"     ? { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" } :
      nivel === "Intermediário" ? { bg: "#fffbeb", text: "#d97706", border: "#fde68a" } :
                                  { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
    return (
      <View style={{
        backgroundColor: cor.bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: cor.border,
      }}>
        <Text style={{ color: cor.text, fontSize: FONT.sm, fontWeight: "600" }}>{nivel}</Text>
      </View>
    );
  }

  // ─── Loading inicial ───────────────────────────────────────────────────────

  if (carregandoRotina) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!rotina) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 12 }}>
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: FONT.xl }}>Rotina não encontrada</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, fontWeight: "600" }}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const focos: string[] = (rotina.dados as any)?.foco ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <View style={{
        backgroundColor: COLORS.card,
        paddingTop: 52,
        paddingBottom: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 }}
        >
          <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: FONT.md }}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.text }}>
          Adicionar Exercício
        </Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: FONT.md, marginTop: 4 }}>
          {rotina.nome}
        </Text>

        {/* Tags de foco */}
        {focos.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {focos.map((f) => (
              <View key={f} style={{
                backgroundColor: "#f5f3ff",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#ddd6fe",
              }}>
                <Text style={{ color: "#7c3aed", fontSize: FONT.sm, fontWeight: "600" }}>🎯 {f}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ padding: SPACING.lg, gap: 16 }}>

        {/* ─── Carregando exercícios da API ──────────────────────────────── */}
        {carregandoExercicios && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ color: COLORS.textSecondary, marginTop: 12, fontSize: FONT.md }}>
              Buscando exercícios...
            </Text>
          </View>
        )}

        {/* ─── Sem foco definido ──────────────────────────────────────────── */}
        {!carregandoExercicios && focos.length === 0 && (
          <View style={{
            backgroundColor: "#fffbeb",
            borderRadius: 12,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: "#fde68a",
          }}>
            <Text style={{ color: "#92400e", fontWeight: "600", fontSize: FONT.md }}>
              ⚠️ Esta rotina não tem foco muscular definido.
            </Text>
            <Text style={{ color: "#92400e", fontSize: FONT.sm, marginTop: 4 }}>
              Volte à rotina e adicione um foco muscular para ver exercícios sugeridos.
            </Text>
          </View>
        )}

        {/* ─── Lista de exercícios da API ────────────────────────────────── */}
        {!carregandoExercicios && exerciciosAPI.length > 0 && (
          <View>
            <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text, marginBottom: 12 }}>
              Exercícios disponíveis
            </Text>

            <View style={{ gap: 10 }}>
              {exerciciosAPI.map((ex) => {
                const selecionado = exercicioSelecionado?.id === ex.id;
                const aberto = expandido === ex.id;

                return (
                  <View key={ex.id} style={{
                    backgroundColor: COLORS.card,
                    borderRadius: 14,
                    borderWidth: selecionado ? 2 : 1,
                    borderColor: selecionado ? COLORS.primary : COLORS.border,
                    overflow: "hidden",
                  }}>
                    {/* Linha principal */}
                    <TouchableOpacity
                      onPress={() => selecionarExercicio(ex)}
                      style={{ padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 }}
                      activeOpacity={0.8}
                    >
                      {/* Checkbox */}
                      <View style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: selecionado ? COLORS.primary : COLORS.border,
                        backgroundColor: selecionado ? COLORS.primary : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 2,
                      }}>
                        {selecionado && (
                          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>✓</Text>
                        )}
                      </View>

                      {/* Infos */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
                          {ex.nome}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm }}>
                            🏋️ {ex.equipamento}
                          </Text>
                          <BadgeDificuldade nivel={ex.dificuldade} />
                        </View>
                        {ex.musculosSecundarios?.length > 0 && (
                          <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm, marginTop: 2 }}>
                            Também: {ex.musculosSecundarios.join(", ")}
                          </Text>
                        )}
                      </View>

                      {/* Botão expandir detalhes */}
                      <TouchableOpacity
                        onPress={() => setExpandido(aberto ? null : ex.id)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={{ color: COLORS.primary, fontSize: 18 }}>
                          {aberto ? "▲" : "▼"}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>

                    {/* Detalhes expandidos */}
                    {aberto && (
                      <View style={{
                        borderTopWidth: 1,
                        borderTopColor: COLORS.border,
                        padding: 14,
                        gap: 10,
                        backgroundColor: "#f9fafb",
                      }}>
                        <Text style={{ color: COLORS.text, fontSize: FONT.md, lineHeight: 20 }}>
                          {ex.descricao}
                        </Text>

                        {ex.instrucoes?.length > 0 && (
                          <View>
                            <Text style={{ fontWeight: "700", color: COLORS.text, fontSize: FONT.md, marginBottom: 6 }}>
                              Como fazer:
                            </Text>
                            {ex.instrucoes.map((inst, i) => (
                              <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
                                <View style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 10,
                                  backgroundColor: COLORS.primary,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginTop: 1,
                                  flexShrink: 0,
                                }}>
                                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{i + 1}</Text>
                                </View>
                                <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm, flex: 1, lineHeight: 18 }}>
                                  {inst}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Sugestão padrão da API */}
                        {(ex.series || ex.repeticoes) && (
                          <View style={{
                            backgroundColor: "#eff6ff",
                            borderRadius: 8,
                            padding: 8,
                            flexDirection: "row",
                            gap: 6,
                          }}>
                            <Text style={{ color: COLORS.primary, fontSize: FONT.sm }}>
                              💡 Sugestão: {ex.series} séries · {ex.repeticoes} reps · Descanso: {ex.descanso}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── Painel de configuração (aparece ao selecionar) ──────────────── */}
        {exercicioSelecionado && (
          <View style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: SPACING.lg,
            borderWidth: 2,
            borderColor: COLORS.primary,
            gap: 14,
          }}>
            <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
              ⚙️ Configurar: {exercicioSelecionado.nome}
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontWeight: "600",
                  fontSize: FONT.sm,
                  color: COLORS.textSecondary,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  Séries
                </Text>
                <TextInput
                  value={series}
                  onChangeText={setSeries}
                  keyboardType="numeric"
                  placeholder="Ex: 3"
                  placeholderTextColor={COLORS.textSecondary}
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 12,
                    padding: 12,
                    fontSize: FONT.lg,
                    textAlign: "center",
                    fontWeight: "700",
                    color: COLORS.text,
                    backgroundColor: COLORS.background,
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontWeight: "600",
                  fontSize: FONT.sm,
                  color: COLORS.textSecondary,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  Repetições
                </Text>
                <TextInput
                  value={repeticoes}
                  onChangeText={setRepeticoes}
                  keyboardType="numeric"
                  placeholder="Ex: 12"
                  placeholderTextColor={COLORS.textSecondary}
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 12,
                    padding: 12,
                    fontSize: FONT.lg,
                    textAlign: "center",
                    fontWeight: "700",
                    color: COLORS.text,
                    backgroundColor: COLORS.background,
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={salvar}
              disabled={salvando}
              style={{
                backgroundColor: salvando ? "#93c5fd" : COLORS.primary,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: FONT.lg }}>
                {salvando ? "Salvando..." : "✅ Confirmar e Salvar"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

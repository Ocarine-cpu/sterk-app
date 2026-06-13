import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { getExercisesByMuscle } from "../../services/api";
import { COLORS, FONT, SPACING } from "../../styles/theme";
import { ExercicioAcademia } from "../../types";

interface ExerciseApi {
  id: number;
  nome: string;
  grupoMuscular: string;
  equipamento: string;
  dificuldade: string;
  descricao: string;
  instrucoes: string[];
  series: string;
  repeticoes: string;
  descanso: string;
}

interface Props {
  visible: boolean;
  focos: string[];
  onClose: () => void;
  onSelect: (exercicio: ExercicioAcademia) => void;
}

const GRUPOS_FALLBACK = [
  "Peito", "Costas", "Bíceps", "Tríceps",
  "Ombros", "Pernas", "Abdômen", "Glúteos",
];

export default function ModalSelecionarExercicio({
  visible,
  focos,
  onClose,
  onSelect,
}: Props) {
  const grupos = focos.length > 0 ? focos : GRUPOS_FALLBACK;

  const [grupoAtivo, setGrupoAtivo] = useState<string>(grupos[0]);
  const [exercicios, setExercicios] = useState<ExerciseApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [selecionado, setSelecionado] = useState<ExerciseApi | null>(null);
  const [series, setSeries] = useState("3");
  const [reps, setReps] = useState("12");

  useEffect(() => {
    if (visible) {
      console.log("=== MODAL ABRIU ===");
      const grupoInicial = grupos[0];
      setGrupoAtivo(grupoInicial);
      buscarPorGrupo(grupoInicial);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setSelecionado(null);
      setExpandido(null);
      setExercicios([]);
      setErro(false);
    }
  }, [visible]);

  async function buscarPorGrupo(grupo: string) {
    setGrupoAtivo(grupo);
    setSelecionado(null);
    setExpandido(null);
    setLoading(true);
    setErro(false);
    try {
      const lista = await getExercisesByMuscle(grupo);
      if (!lista || lista.length === 0) {
        setErro(true);
        setExercicios([]);
      } else {
        setExercicios(lista);
      }
    } catch (e) {
      console.log("=== ERRO NA API:", String(e));
      setErro(true);
      setExercicios([]);
    } finally {
      setLoading(false);
    }
  }

  function confirmar() {
    if (!selecionado) return;
    const s = parseInt(series, 10);
    const r = parseInt(reps, 10);
    if (!s || s <= 0 || !r || r <= 0) return;
    onSelect({
      id: selecionado.id,
      nome: selecionado.nome,
      grupoMuscular: selecionado.grupoMuscular,
      series: s,
      repeticoes: r,
      descricao: selecionado.descricao,
    });
    setSelecionado(null);
    setSeries("3");
    setReps("12");
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.titulo}>Selecionar Exercício</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 20, color: COLORS.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Área Principal (Scroll) */}
          <View style={styles.scrollContainer}>
            <ScrollView 
              keyboardShouldPersistTaps="handled" 
              contentContainerStyle={{ paddingBottom: SPACING.lg }}
            >
              {/* Filtro de grupos musculares */}
              <View style={{ padding: SPACING.lg, paddingBottom: 8 }}>
                <Text style={styles.label}>Grupo muscular</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {grupos.map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => buscarPorGrupo(g)}
                        style={[styles.chip, grupoAtivo === g && styles.chipAtivo]}
                      >
                        <Text style={[styles.chipText, grupoAtivo === g && styles.chipTextAtivo]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Lista de exercícios */}
              <View style={{ paddingHorizontal: SPACING.lg, gap: 8, paddingBottom: 8 }}>
                {loading ? (
                  <View style={{ alignItems: "center", paddingVertical: 32, gap: 10 }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ color: COLORS.textSecondary }}>Buscando exercícios...</Text>
                  </View>
                ) : erro ? (
                  <View style={{ alignItems: "center", paddingVertical: 24, gap: 10 }}>
                    <Text style={{ color: COLORS.textSecondary, textAlign: "center" }}>
                      Não foi possível carregar exercícios.
                    </Text>
                    <TouchableOpacity
                      onPress={() => buscarPorGrupo(grupoAtivo)}
                      style={{
                        backgroundColor: COLORS.primary,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>Tentar novamente</Text>
                    </TouchableOpacity>
                  </View>
                ) : exercicios.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 24 }}>
                    <Text style={{ color: COLORS.textSecondary, textAlign: "center" }}>
                      Nenhum exercício encontrado.
                    </Text>
                  </View>
                ) : (
                  exercicios.map((ex) => {
                    const sel = selecionado?.id === ex.id;
                    const exp = expandido === ex.id;
                    return (
                      <View
                        key={ex.id}
                        style={{
                          borderRadius: 12,
                          borderWidth: sel ? 2 : 1,
                          borderColor: sel ? COLORS.primary : COLORS.border,
                          backgroundColor: sel ? "#eff6ff" : "#fff",
                          overflow: "hidden",
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            if (sel) {
                              setSelecionado(null);
                            } else {
                              setSelecionado(ex);
                              setSeries(ex.series?.match(/\d+/)?.[0] ?? "3");
                              setReps(ex.repeticoes?.match(/\d+/)?.[0] ?? "12");
                            }
                          }}
                          style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 10 }}
                          activeOpacity={0.7}
                        >
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              borderWidth: 2,
                              borderColor: sel ? COLORS.primary : COLORS.border,
                              backgroundColor: sel ? COLORS.primary : "transparent",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {sel && (
                              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>✓</Text>
                            )}
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: "700", fontSize: FONT.md, color: COLORS.text }}>
                              {ex.nome}
                            </Text>
                            <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 1 }}>
                              {ex.equipamento} · {ex.dificuldade}
                            </Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => setExpandido(exp ? null : ex.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>
                              {exp ? "▲" : "▼"}
                            </Text>
                          </TouchableOpacity>
                        </TouchableOpacity>

                        {exp && (
                          <View
                            style={{
                              borderTopWidth: 1,
                              borderTopColor: COLORS.border,
                              padding: 12,
                              gap: 8,
                              backgroundColor: "#f9fafb",
                            }}
                          >
                            <Text style={{ fontSize: FONT.sm, color: COLORS.text, lineHeight: 18 }}>
                              {ex.descricao}
                            </Text>
                            {ex.instrucoes?.length > 0 && (
                              <View style={{ gap: 4 }}>
                                <Text style={{ fontWeight: "700", fontSize: FONT.sm, color: COLORS.text }}>
                                  Como executar:
                                </Text>
                                {ex.instrucoes.map((inst, i) => (
                                  <View key={i} style={{ flexDirection: "row", gap: 8 }}>
                                    <View
                                      style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        backgroundColor: COLORS.primary,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                                        {i + 1}
                                      </Text>
                                    </View>
                                    <Text
                                      style={{
                                        fontSize: FONT.sm,
                                        color: COLORS.textSecondary,
                                        flex: 1,
                                        lineHeight: 18,
                                      }}
                                    >
                                      {inst}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>

              {/* Config séries/reps */}
              {selecionado && (
                <View
                  style={{
                    marginHorizontal: SPACING.lg,
                    marginTop: SPACING.sm,
                    padding: SPACING.lg,
                    backgroundColor: "#eff6ff",
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: COLORS.primary,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontWeight: "700", fontSize: FONT.md, color: COLORS.text }}>
                    Configurar: {selecionado.nome}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { marginBottom: 6 }]}>Séries</Text>
                      <TextInput
                        value={series}
                        onChangeText={setSeries}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { marginBottom: 6 }]}>Repetições</Text>
                      <TextInput
                        value={reps}
                        onChangeText={setReps}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.btn, { flex: 1, backgroundColor: "#f3f4f6" }]}
            >
              <Text style={{ color: COLORS.text, fontWeight: "600" }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmar}
              disabled={!selecionado}
              style={[
                styles.btn,
                { flex: 2, backgroundColor: selecionado ? COLORS.primary : "#93c5fd" },
              ]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Adicionar exercício</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    flex: 1,                 // Ocupa o tamanho flexível calculado pelas margens verticais
    marginVertical: 40,      // Margem segura para não colar no topo/rodapé
    elevation: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollContainer: {
    flex: 1,                 // Essencial para dizer à ScrollView o espaço máximo que ela pode usar
  },
  titulo: {
    fontSize: FONT.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  label: {
    fontSize: FONT.md,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipAtivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  chipTextAtivo: {
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: "#fff", // Garante que fique sólido sobre a scrollview
  },
  btn: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
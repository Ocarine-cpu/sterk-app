// app/(tabs)/rotinas.tsx

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ExercicioCard from "../../src/components/ExercicioCard";
import Header from "../../src/components/Header";
import ModalIniciarAtividade from "../../src/components/ModalIniciarAtividade";
import { useAuth } from "../../src/context/AuthContext";
import { getExercisesByMuscle } from "../../src/services/api";
import {
  buscarRotinasDoUsuario,
  salvarRotina,
} from "../../src/services/rotinaService";
import { carregarTreinosHoje } from "../../src/services/workoutStorage";
import { COLORS, FONT, SPACING } from "../../src/styles/theme";
import { DiaSemana, ExercicioAcademia, Rotina } from "../../src/types";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIAS: {
  valor: Rotina["tipo"];
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { valor: "academia", label: "Academia", icon: "barbell-outline" },
  { valor: "corrida",  label: "Corrida",  icon: "walk-outline" },
  { valor: "ciclismo", label: "Ciclismo", icon: "bicycle-outline" },
  { valor: "lutas",    label: "Lutas",    icon: "shield-outline" },
  { valor: "natacao",  label: "Natação",  icon: "water-outline" },
  { valor: "pilates",  label: "Pilates",  icon: "body-outline" },
  { valor: "danca",    label: "Dança",    icon: "musical-notes-outline" },
];

const DIAS: { valor: DiaSemana; label: string }[] = [
  { valor: "seg", label: "Seg" },
  { valor: "ter", label: "Ter" },
  { valor: "qua", label: "Qua" },
  { valor: "qui", label: "Qui" },
  { valor: "sex", label: "Sex" },
  { valor: "sab", label: "Sáb" },
  { valor: "dom", label: "Dom" },
];

const FOCO_MUSCULAR   = ["Peito", "Costas", "Bíceps", "Tríceps", "Ombros", "Pernas", "Abdômen", "Glúteos"];
const ESTILOS_LUTA    = ["Boxe", "Muay Thai", "Jiu-Jitsu", "Judô", "Karatê", "Taekwondo", "MMA"];
const ESTILOS_NATACAO = ["Livre", "Costas", "Peito", "Borboleta", "Medley"];
const TERRENOS        = ["Plano", "Montanha", "Misto"];
const ESTILOS_DANCA   = ["Ballet", "Jazz", "Hip Hop", "Contemporâneo", "Salsa", "Samba", "Forró", "Zouk"];
const ESTILOS_PILATES = ["Mat Pilates", "Reformer", "Cadillac", "Clássico", "Contemporâneo"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function catConfig(tipo: string) {
  return CATEGORIAS.find((c) => c.valor === tipo) ?? CATEGORIAS[0];
}

function limitarMinutos(t: string) {
  const n = t.replace(/\D/g, "");
  if (!n) return "";
  return Math.min(Number(n), 720).toString();
}

interface ExercicioAPI {
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

// ─────────────────────────────────────────────────────────────────────────────
// SELETOR DE HORÁRIO (nativo — picker do sistema)
// ─────────────────────────────────────────────────────────────────────────────

function HorarioPickerNativo({
  hora, minuto, onChangeHora, onChangeMinuto,
}: {
  hora: string; minuto: string;
  onChangeHora: (h: string) => void;
  onChangeMinuto: (m: string) => void;
}) {
  const [mostrar, setMostrar] = useState(false);

  const valorAtual = new Date();
  valorAtual.setHours(parseInt(hora, 10) || 0, parseInt(minuto, 10) || 0, 0, 0);

  function handleChange(_event: any, selecionado?: Date) {
    if (Platform.OS === "android") setMostrar(false);
    if (selecionado) {
      onChangeHora(String(selecionado.getHours()).padStart(2, "0"));
      onChangeMinuto(String(selecionado.getMinutes()).padStart(2, "0"));
    }
  }

  return (
    <View>
      <TouchableOpacity
        onPress={() => setMostrar(true)}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          backgroundColor: "#f3f4f6",
          borderRadius: 14,
          paddingVertical: 16,
        }}
      >
        <Ionicons name="time-outline" size={22} color={COLORS.primary} />
        <Text style={{ fontSize: 28, fontWeight: "800", color: COLORS.text, fontVariant: ["tabular-nums"] }}>
          {hora}:{minuto}
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: "center", marginTop: 6 }}>
        Toque para alterar o horário
      </Text>

      {mostrar && (
        <DateTimePicker
          value={valorAtual}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
        />
      )}

      {Platform.OS === "ios" && mostrar && (
        <TouchableOpacity
          onPress={() => setMostrar(false)}
          style={{ marginTop: 10, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 10, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Confirmar horário</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL SELECIONAR EXERCÍCIO VIA API
// ─────────────────────────────────────────────────────────────────────────────

function ModalSelecionarExercicio({
  visivel, focos, onConfirmar, onFechar,
}: {
  visivel: boolean;
  focos: string[];
  onConfirmar: (ex: ExercicioAcademia) => void;
  onFechar: () => void;
}) {
  const [focoAtivo, setFocoAtivo]           = useState(focos[0] ?? "Peito");
  const [exerciciosAPI, setExerciciosAPI]   = useState<ExercicioAPI[]>([]);
  const [carregando, setCarregando]         = useState(false);
  const [erroBusca, setErroBusca]           = useState(false);
  const [selecionado, setSelecionado]       = useState<ExercicioAPI | null>(null);
  const [series, setSeries]                 = useState("3");
  const [reps, setReps]                     = useState("12");
  const [expandido, setExpandido]           = useState<number | null>(null);

  async function buscarPorFoco(foco: string) {
    setFocoAtivo(foco);
    setSelecionado(null);
    setExpandido(null);
    setCarregando(true);
    setErroBusca(false);
    try {
      const lista = await getExercisesByMuscle(foco);
      if (!lista || lista.length === 0) {
        setErroBusca(true);
        setExerciciosAPI([]);
      } else {
        setExerciciosAPI(lista);
      }
    } catch {
      setErroBusca(true);
      setExerciciosAPI([]);
    } finally {
      setCarregando(false);
    }
  }

  React.useEffect(() => {
    if (visivel && focos.length > 0) buscarPorFoco(focos[0]);
  }, [visivel]);

  function confirmar() {
    if (!selecionado) { Alert.alert("Atenção", "Selecione um exercício."); return; }
    const s = parseInt(series, 10);
    const r = parseInt(reps, 10);
    if (!s || s <= 0) { Alert.alert("Atenção", "Séries inválidas."); return; }
    if (!r || r <= 0) { Alert.alert("Atenção", "Repetições inválidas."); return; }

    // Salva também as informações detalhadas, para que possam ser
    // consultadas depois (na rotina, no card expandido e nos detalhes)
    onConfirmar({
      id: selecionado.id,
      nome: selecionado.nome,
      grupoMuscular: selecionado.grupoMuscular,
      series: s,
      repeticoes: r,
      descricao: selecionado.descricao,
      instrucoes: selecionado.instrucoes,
      equipamento: selecionado.equipamento,
      dificuldade: selecionado.dificuldade,
      seriesSugeridas: selecionado.series,
      repsSugeridas: selecionado.repeticoes,
      descansoSugerido: selecionado.descanso,
    });

    setSelecionado(null); setSeries("3"); setReps("12");
  }

  return (
    <Modal visible={visivel} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 16 }}>
        <View style={{ backgroundColor: COLORS.card, borderRadius: 20, width: "100%", height: "88%", elevation: 12 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ fontSize: FONT.xl, fontWeight: "700", color: COLORS.text }}>Selecionar Exercício</Text>
            <TouchableOpacity onPress={onFechar}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
            {/* Filtros de grupo muscular */}
            <View style={{ padding: SPACING.lg, paddingBottom: 8 }}>
              <Text style={S.label}>Grupo muscular</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {focos.map((f) => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => buscarPorFoco(f)}
                      style={[S.chip, focoAtivo === f && S.chipAtivo]}
                    >
                      <Text style={[S.chipText, focoAtivo === f && S.chipTextAtivo]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Lista */}
            <View style={{ paddingHorizontal: SPACING.lg, gap: 8, paddingBottom: 8 }}>
              {carregando ? (
                <View style={{ alignItems: "center", paddingVertical: 32, gap: 10 }}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={{ color: COLORS.textSecondary }}>Buscando exercícios...</Text>
                </View>
              ) : erroBusca ? (
                <View style={{ alignItems: "center", paddingVertical: 24, gap: 10 }}>
                  <Ionicons name="wifi-outline" size={36} color={COLORS.border} />
                  <Text style={{ color: COLORS.textSecondary, textAlign: "center" }}>
                    Não foi possível carregar exercícios.
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm, textAlign: "center" }}>
                    Verifique se a API está rodando.
                  </Text>
                  <TouchableOpacity
                    onPress={() => buscarPorFoco(focoAtivo)}
                    style={{ backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : exerciciosAPI.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 32, gap: 8 }}>
                  <Ionicons name="barbell-outline" size={36} color={COLORS.border} />
                  <Text style={{ color: COLORS.textSecondary }}>Nenhum exercício encontrado.</Text>
                </View>
              ) : (
                exerciciosAPI.map((ex) => {
                  const sel = selecionado?.id === ex.id;
                  const exp = expandido === ex.id;
                  return (
                    <View key={ex.id} style={{
                      borderRadius: 12,
                      borderWidth: sel ? 2 : 1,
                      borderColor: sel ? COLORS.primary : COLORS.border,
                      backgroundColor: sel ? "#eff6ff" : COLORS.background,
                      overflow: "hidden",
                    }}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelecionado(sel ? null : ex);
                          if (!sel) {
                            setSeries(ex.series?.match(/\d+/)?.[0] ?? "3");
                            setReps(ex.repeticoes?.match(/\d+/)?.[0] ?? "12");
                          }
                        }}
                        style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 10 }}
                        activeOpacity={0.7}
                      >
                        <View style={{
                          width: 20, height: 20, borderRadius: 10,
                          borderWidth: 2,
                          borderColor: sel ? COLORS.primary : COLORS.border,
                          backgroundColor: sel ? COLORS.primary : "transparent",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "600", fontSize: FONT.md, color: COLORS.text }}>{ex.nome}</Text>
                          <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 1 }}>
                            {ex.equipamento} · {ex.dificuldade}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => setExpandido(exp ? null : ex.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Ionicons name={exp ? "chevron-up" : "chevron-down"} size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      </TouchableOpacity>

                      {exp && (
                        <View style={{ borderTopWidth: 1, borderTopColor: COLORS.border, padding: 12, gap: 8, backgroundColor: "#f9fafb" }}>
                          <Text style={{ fontSize: FONT.sm, color: COLORS.text, lineHeight: 18 }}>{ex.descricao}</Text>
                          {ex.instrucoes?.length > 0 && (
                            <View style={{ gap: 4 }}>
                              <Text style={{ fontWeight: "700", fontSize: FONT.sm, color: COLORS.text }}>Como executar:</Text>
                              {ex.instrucoes.map((inst, i) => (
                                <View key={i} style={{ flexDirection: "row", gap: 8 }}>
                                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{i + 1}</Text>
                                  </View>
                                  <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, flex: 1, lineHeight: 18 }}>{inst}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                          {ex.series && (
                            <View style={{ backgroundColor: "#eff6ff", borderRadius: 8, padding: 8 }}>
                              <Text style={{ color: COLORS.primary, fontSize: FONT.sm, fontWeight: "500" }}>
                                Sugestão: {ex.series} séries · {ex.repeticoes} reps · Descanso: {ex.descanso}
                              </Text>
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
              <View style={{ margin: SPACING.lg, padding: SPACING.lg, backgroundColor: "#eff6ff", borderRadius: 14, borderWidth: 2, borderColor: COLORS.primary, gap: 12 }}>
                <Text style={{ fontWeight: "700", fontSize: FONT.md, color: COLORS.text }}>
                  Configurar: {selecionado.nome}
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.label, { marginBottom: 6 }]}>Séries</Text>
                    <TextInput value={series} onChangeText={setSeries} keyboardType="numeric"
                      style={[S.input, { textAlign: "center", fontSize: 20, fontWeight: "700" }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.label, { marginBottom: 6 }]}>Repetições</Text>
                    <TextInput value={reps} onChangeText={setReps} keyboardType="numeric"
                      style={[S.input, { textAlign: "center", fontSize: 20, fontWeight: "700" }]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={{ flexDirection: "row", gap: 10, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border }}>
            <TouchableOpacity onPress={onFechar} style={[S.btn, { flex: 1, backgroundColor: COLORS.background }]}>
              <Text style={{ color: COLORS.text, fontWeight: "600" }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmar} style={[S.btn, { flex: 2, backgroundColor: COLORS.primary }]}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Adicionar exercício</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function Rotinas() {
  const router   = useRouter();
  const { usuario } = useAuth();

  const [rotinas, setRotinas]         = useState<Rotina[]>([]);
  const [carregando, setCarregando]   = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [cardExpandido, setCardExpandido] = useState<string | null>(null);

  // ── Estatísticas de treinos ──
  const [treinosFeitos, setTreinosFeitos] = useState(0);

  // ── Modal de iniciar atividade ──
  const [rotinaParaIniciar, setRotinaParaIniciar] = useState<Rotina | null>(null);

  // ── Campos do modal de criação ──
  const [nome, setNome]               = useState("");
  const [tipo, setTipo]               = useState<Rotina["tipo"]>("academia");
  const [dias, setDias]               = useState<DiaSemana[]>([]);
  const [usarHorario, setUsarHorario] = useState(false);
  const [hora, setHora]               = useState("07");
  const [minuto, setMinuto]           = useState("00");
  const [foco, setFoco]               = useState<string[]>([]);
  const [exercicios, setExercicios]   = useState<ExercicioAcademia[]>([]);
  const [modalExercicio, setModalExercicio] = useState(false);
  const [editIdx, setEditIdx]         = useState<number | null>(null);
  const [editSeries, setEditSeries]   = useState("");
  const [editReps, setEditReps]       = useState("");
  const [distKm, setDistKm]           = useState("");
  const [distM, setDistM]             = useState("");
  const [tempo, setTempo]             = useState("");
  const [duracao, setDuracao]         = useState("");
  const [terreno, setTerreno]         = useState("");
  const [estiloNatacao, setEstiloNatacao] = useState("");
  const [estiloLuta, setEstiloLuta]   = useState("");
  const [estiloDanca, setEstiloDanca] = useState("");
  const [estiloPilates, setEstiloPilates] = useState("");

  // ─── Carregar ──────────────────────────────────────────────────────────────

  async function carregar() {
    try {
      if (!usuario) return;
      const [lista, treinos] = await Promise.all([
        buscarRotinasDoUsuario(usuario.uid),
        carregarTreinosHoje(),
      ]);
      setRotinas(lista);
      setTreinosFeitos(treinos.length);
    } catch (e) { console.error(e); }
    finally { setCarregando(false); }
  }

  useFocusEffect(useCallback(() => { carregar(); }, [usuario]));

  // ─── Reset ────────────────────────────────────────────────────────────────

  function reset() {
    setNome(""); setTipo("academia"); setDias([]);
    setUsarHorario(false); setHora("07"); setMinuto("00");
    setFoco([]); setExercicios([]);
    setDistKm(""); setDistM("");
    setTempo(""); setDuracao("");
    setTerreno(""); setEstiloNatacao("");
    setEstiloLuta(""); setEstiloDanca(""); setEstiloPilates("");
    setEditIdx(null);
  }

  // ─── Editar exercício inline ───────────────────────────────────────────────

  function iniciarEdicao(idx: number) {
    setEditIdx(idx);
    setEditSeries(String(exercicios[idx].series));
    setEditReps(String(exercicios[idx].repeticoes));
  }

  function confirmarEdicao(idx: number) {
    const s = parseInt(editSeries, 10);
    const r = parseInt(editReps, 10);
    if (!s || !r || s <= 0 || r <= 0) { Alert.alert("Atenção", "Valores inválidos."); return; }
    setExercicios((prev) => prev.map((ex, i) => i === idx ? { ...ex, series: s, repeticoes: r } : ex));
    setEditIdx(null);
  }

  // ─── Salvar rotina ────────────────────────────────────────────────────────

  async function salvar() {
    if (!usuario) return;
    if (!nome.trim())      { Alert.alert("Atenção", "Digite um nome."); return; }
    if (dias.length === 0) { Alert.alert("Atenção", "Selecione pelo menos um dia."); return; }

    const horario   = usarHorario ? `${hora}:${minuto}` : undefined;
    const km        = parseFloat(distKm) || 0;
    const m         = parseFloat(distM)  || 0;
    const distFinal = km + m / 1000;
    let dados: any  = {};

    if (tipo === "academia") {
      if (foco.length === 0) { Alert.alert("Atenção", "Selecione o foco muscular."); return; }
      dados = { foco, exercicios };
    } else if (tipo === "corrida") {
      if (!distFinal) { Alert.alert("Atenção", "Insira a distância."); return; }
      dados = { distancia: distFinal, tempo: parseInt(tempo) || 0 };
    } else if (tipo === "ciclismo") {
      if (!distFinal) { Alert.alert("Atenção", "Insira a distância."); return; }
      if (!terreno)   { Alert.alert("Atenção", "Selecione o terreno."); return; }
      dados = { distancia: distFinal, tempo: parseInt(tempo) || 0, terreno };
    } else if (tipo === "natacao") {
      const metros = km * 1000 + m;
      if (!metros)        { Alert.alert("Atenção", "Insira a distância."); return; }
      if (!estiloNatacao) { Alert.alert("Atenção", "Selecione o estilo."); return; }
      dados = { distancia: metros, estilo: estiloNatacao, tempo: parseInt(tempo) || 0 };
    } else if (tipo === "lutas") {
      if (!estiloLuta) { Alert.alert("Atenção", "Selecione a modalidade."); return; }
      dados = { estilo: estiloLuta, duracao: parseInt(duracao) || 0 };
    } else if (tipo === "danca") {
      if (!estiloDanca) { Alert.alert("Atenção", "Selecione o estilo."); return; }
      dados = { estilo: estiloDanca, duracao: parseInt(duracao) || 0 };
    } else if (tipo === "pilates") {
      if (!estiloPilates) { Alert.alert("Atenção", "Selecione o estilo."); return; }
      dados = { estilo: estiloPilates, duracao: parseInt(duracao) || 0 };
    }

    try {
      await salvarRotina({ usuarioUid: usuario.uid, nome: nome.trim(), tipo, dias, horario, dados, publica: false, criadoEm: new Date().toISOString() });
      reset(); setModalAberto(false);
      await carregar();
      Alert.alert("Criado!", "Rotina salva com sucesso.");
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    }
  }

  // ─── Card de rotina ───────────────────────────────────────────────────────

  function CardRotina({ r }: { r: Rotina }) {
    const cfg    = catConfig(r.tipo);
    const dados  = r.dados as any;
    const aberto = cardExpandido === r.id;

    function renderDetalhes() {
      if (r.tipo === "academia") {
        return (
          <View style={{ gap: 12 }}>
            {dados?.foco?.length > 0 && (
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Ionicons name="fitness-outline" size={13} color={COLORS.textSecondary} />
                  <Text style={{ fontSize: FONT.sm, fontWeight: "700", color: COLORS.text }}>Foco muscular</Text>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {dados.foco.map((f: string) => (
                    <View key={f} style={{ backgroundColor: "#f5f3ff", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#ddd6fe" }}>
                      <Text style={{ color: "#7c3aed", fontWeight: "600", fontSize: FONT.sm }}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {dados?.exercicios?.length > 0 && (
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Ionicons name="barbell-outline" size={13} color={COLORS.textSecondary} />
                  <Text style={{ fontSize: FONT.sm, fontWeight: "700", color: COLORS.text }}>
                    Exercícios ({dados.exercicios.length})
                  </Text>
                </View>
                <View style={{ gap: 6 }}>
                  {dados.exercicios.map((ex: ExercicioAcademia, i: number) => (
                    <ExercicioCard key={i} exercicio={ex} />
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      }
      if (["corrida", "ciclismo"].includes(r.tipo)) {
        return (
          <View style={{ gap: 5 }}>
            <LinhaInfo icon="navigate-outline" label="Distância" valor={`${dados?.distancia?.toFixed(2) ?? 0} km`} />
            <LinhaInfo icon="time-outline"     label="Tempo"     valor={`${dados?.tempo ?? 0} min`} />
            {r.tipo === "ciclismo" && <LinhaInfo icon="map-outline" label="Terreno" valor={dados?.terreno ?? "—"} />}
          </View>
        );
      }
      if (r.tipo === "natacao") {
        return (
          <View style={{ gap: 5 }}>
            <LinhaInfo icon="navigate-outline" label="Distância" valor={`${dados?.distancia ?? 0} m`} />
            <LinhaInfo icon="water-outline"    label="Estilo"    valor={dados?.estilo ?? "—"} />
            <LinhaInfo icon="time-outline"     label="Tempo"     valor={`${dados?.tempo ?? 0} min`} />
          </View>
        );
      }
      if (["lutas", "pilates", "danca"].includes(r.tipo)) {
        return (
          <View style={{ gap: 5 }}>
            <LinhaInfo icon={r.tipo === "lutas" ? "shield-outline" : "musical-notes-outline"} label={r.tipo === "lutas" ? "Modalidade" : "Estilo"} valor={dados?.estilo ?? "—"} />
            <LinhaInfo icon="time-outline" label="Duração" valor={`${dados?.duracao ?? 0} min`} />
          </View>
        );
      }
      return null;
    }

    return (
      <View style={{
        backgroundColor: COLORS.card,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: aberto ? COLORS.primary : COLORS.border,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8,
        elevation: 3, overflow: "hidden",
      }}>
        {/* Topo clicável */}
        <TouchableOpacity
          onPress={() => setCardExpandido(aberto ? null : r.id)}
          activeOpacity={0.82}
          style={{ padding: SPACING.lg }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: aberto ? COLORS.primary : "#eff6ff", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={cfg.icon} size={18} color={aberto ? "#fff" : COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT.xl, fontWeight: "700", color: COLORS.text }}>{r.nome}</Text>
                <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 1 }}>{cfg.label}</Text>
              </View>
            </View>
            <Ionicons name={aberto ? "chevron-up" : "chevron-down"} size={18} color={aberto ? COLORS.primary : COLORS.border} />
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {(r.dias ?? []).map((d) => (
              <View key={d} style={{ backgroundColor: "#eff6ff", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: "#bfdbfe" }}>
                <Text style={{ color: COLORS.primary, fontSize: FONT.sm, fontWeight: "600" }}>{d.toUpperCase()}</Text>
              </View>
            ))}
            {r.horario && (
              <View style={{ backgroundColor: "#f0fdf4", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: "#bbf7d0", flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Ionicons name="time-outline" size={11} color="#16a34a" />
                <Text style={{ color: "#16a34a", fontSize: FONT.sm, fontWeight: "600" }}>{r.horario}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Área expandida */}
        {aberto && (
          <View style={{ borderTopWidth: 1, borderTopColor: COLORS.border, padding: SPACING.lg, gap: 14, backgroundColor: "#fafafa" }}>
            {renderDetalhes()}

            {/* Botões de ação */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              {/* Iniciar Atividade */}
              <TouchableOpacity
                onPress={() => { setRotinaParaIniciar(r); }}
                style={{
                  flex: 2,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: "#16a34a",
                  shadowColor: "#16a34a",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.22,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <Ionicons name="flash-outline" size={15} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: FONT.sm }}>Iniciar Atividade</Text>
              </TouchableOpacity>

              {/* Ver detalhes */}
              <TouchableOpacity
                onPress={() => router.push(`/rotina/${r.id}` as any)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: "#eff6ff",
                }}
              >
                <Ionicons name="expand-outline" size={14} color={COLORS.primary} />
                <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: FONT.sm }}>Detalhes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // ─── Campos específicos do modal de criação ───────────────────────────────

  function CamposEspecificos() {
    const kmMInput = (
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={[S.label, { marginBottom: 6 }]}>Quilômetros</Text>
          <TextInput value={distKm} onChangeText={setDistKm} placeholder="0" keyboardType="numeric" style={S.input} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[S.label, { marginBottom: 6 }]}>Metros</Text>
          <TextInput value={distM} onChangeText={setDistM} placeholder="0" keyboardType="numeric" style={S.input} />
        </View>
      </View>
    );

    const tempoInput = (
      <View>
        <Text style={S.label}>Tempo estimado (min)</Text>
        <TextInput value={tempo} onChangeText={(t) => setTempo(limitarMinutos(t))} placeholder="Ex: 45" keyboardType="numeric" style={S.input} />
      </View>
    );

    if (tipo === "academia") {
      return (
        <View style={{ gap: SPACING.md }}>
          <View>
            <Text style={S.label}>Foco muscular</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8, paddingTop: 4 }}>
                {FOCO_MUSCULAR.map((f) => {
                  const ativo = foco.includes(f);
                  return (
                    <TouchableOpacity key={f} onPress={() => setFoco((prev) => ativo ? prev.filter((x) => x !== f) : [...prev, f])} style={[S.chip, ativo && S.chipAtivo]}>
                      <Text style={[S.chipText, ativo && S.chipTextAtivo]}>{f}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {foco.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={[S.label, { marginBottom: 0 }]}>Exercícios ({exercicios.length})</Text>

              {exercicios.length === 0 ? (
                <View style={{ padding: 14, borderStyle: "dashed", borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, alignItems: "center" }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm }}>Nenhum exercício adicionado.</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {exercicios.map((ex, idx) => {
                    const editando = editIdx === idx;
                    return (
                      <ExercicioCard
                        key={idx}
                        exercicio={ex}
                        actions={
                          <>
                            {editando ? (
                              <TouchableOpacity onPress={() => confirmarEdicao(idx)} style={{ padding: 6 }}>
                                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity onPress={() => iniciarEdicao(idx)} style={{ padding: 6 }}>
                                <Ionicons name="pencil-outline" size={15} color={COLORS.textSecondary} />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => setExercicios((prev) => prev.filter((_, i) => i !== idx))} style={{ padding: 6 }}>
                              <Ionicons name="trash-outline" size={15} color="#ef4444" />
                            </TouchableOpacity>
                          </>
                        }
                      >
                        {editando ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <TextInput value={editSeries} onChangeText={setEditSeries} keyboardType="numeric"
                              style={[S.input, { paddingVertical: 2, paddingHorizontal: 6, minWidth: 40, marginBottom: 0, textAlign: "center" }]} />
                            <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>×</Text>
                            <TextInput value={editReps} onChangeText={setEditReps} keyboardType="numeric"
                              style={[S.input, { paddingVertical: 2, paddingHorizontal: 6, minWidth: 40, marginBottom: 0, textAlign: "center" }]} />
                          </View>
                        ) : (
                          <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>{ex.series} séries · {ex.repeticoes} reps</Text>
                        )}
                      </ExercicioCard>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setModalExercicio(true)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12, backgroundColor: COLORS.primary }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: FONT.md }}>Adicionar Exercício</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    if (tipo === "corrida")  return <View style={{ gap: SPACING.md }}>{kmMInput}{tempoInput}</View>;
    if (tipo === "ciclismo") return (
      <View style={{ gap: SPACING.md }}>
        {kmMInput}{tempoInput}
        <View>
          <Text style={S.label}>Terreno</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {TERRENOS.map((t) => (
              <TouchableOpacity key={t} onPress={() => setTerreno(t)} style={[S.chip, terreno === t && S.chipAtivo, { flex: 1 }]}>
                <Text style={[S.chipText, terreno === t && S.chipTextAtivo]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );

    if (tipo === "natacao") return (
      <View style={{ gap: SPACING.md }}>
        {kmMInput}{tempoInput}
        <View>
          <Text style={S.label}>Estilo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {ESTILOS_NATACAO.map((e) => (
                <TouchableOpacity key={e} onPress={() => setEstiloNatacao(e)} style={[S.chip, estiloNatacao === e && S.chipAtivo]}>
                  <Text style={[S.chipText, estiloNatacao === e && S.chipTextAtivo]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );

    if (["lutas", "danca", "pilates"].includes(tipo)) {
      const [opcoes, valor, setValor, labelEstilo] =
        tipo === "lutas"   ? [ESTILOS_LUTA,    estiloLuta,    setEstiloLuta,    "Modalidade"] :
        tipo === "danca"   ? [ESTILOS_DANCA,   estiloDanca,   setEstiloDanca,   "Estilo de dança"] :
                             [ESTILOS_PILATES, estiloPilates, setEstiloPilates, "Estilo de pilates"];

      return (
        <View style={{ gap: SPACING.md }}>
          <View>
            <Text style={S.label}>Duração (minutos)</Text>
            <TextInput value={duracao} onChangeText={(t) => setDuracao(limitarMinutos(t))} placeholder="Ex: 60" keyboardType="numeric" style={S.input} />
          </View>
          <View>
            <Text style={S.label}>{labelEstilo as string}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(opcoes as string[]).map((op) => (
                  <TouchableOpacity key={op} onPress={() => (setValor as any)(op)} style={[S.chip, (valor as string) === op && S.chipAtivo]}>
                    <Text style={[S.chipText, (valor as string) === op && S.chipTextAtivo]}>{op}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      );
    }

    return null;
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header name={usuario?.nome ?? "Usuário"} subtitle="Minhas Rotinas" />

      {/* Botão nova rotina + contador treinos hoje */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: 4 }}>
        <TouchableOpacity
          onPress={() => {
            if (rotinas.length >= 5) { Alert.alert("Limite atingido", "Você já tem 5 rotinas cadastradas."); return; }
            setModalAberto(true);
          }}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.primary,
            shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5,
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: FONT.lg }}>Nova Rotina</Text>
          {rotinas.length > 0 && (
            <View style={{ backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
              <Text style={{ color: "#fff", fontSize: FONT.sm, fontWeight: "700" }}>{rotinas.length}/5</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Estatística de treinos hoje */}
        {treinosFeitos > 0 && (
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 6, marginTop: 10, padding: 8,
            backgroundColor: "#f0fdf4", borderRadius: 10,
            borderWidth: 1, borderColor: "#bbf7d0",
          }}>
            <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
            <Text style={{ color: "#16a34a", fontWeight: "600", fontSize: FONT.sm }}>
              {treinosFeitos} treino{treinosFeitos !== 1 ? "s" : ""} concluído{treinosFeitos !== 1 ? "s" : ""} hoje
            </Text>
          </View>
        )}
      </View>

      {/* Lista de rotinas */}
      {carregando ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {rotinas.length === 0 ? (
            <View style={{ paddingVertical: 60, alignItems: "center", gap: 12 }}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.border} />
              <Text style={{ fontSize: FONT.lg, fontWeight: "600", color: COLORS.textSecondary, textAlign: "center" }}>
                Você não tem rotinas criadas ainda.
              </Text>
              <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: "center", paddingHorizontal: 32 }}>
                Monte um cronograma semanal personalizado para organizar seus treinos.
              </Text>
            </View>
          ) : (
            rotinas.map((r) => <CardRotina key={r.id} r={r} />)
          )}
        </ScrollView>
      )}

      {/* ── Modal de criação ── */}
      <Modal visible={modalAberto} transparent animationType="fade" onRequestClose={() => { reset(); setModalAberto(false); }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16 }}>
          <View style={{ backgroundColor: COLORS.card, borderRadius: 24, width: "100%", maxHeight: "92%", elevation: 16, overflow: "hidden" }}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="calendar-outline" size={17} color={COLORS.primary} />
                </View>
                <Text style={{ fontSize: FONT.xl, fontWeight: "700", color: COLORS.text }}>Nova Rotina</Text>
              </View>
              <TouchableOpacity onPress={() => { reset(); setModalAberto(false); }}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md }}>
              {/* Nome */}
              <View>
                <Text style={S.label}>Nome da rotina</Text>
                <TextInput value={nome} onChangeText={setNome} placeholder="Ex: Treino A – Peito e Tríceps" placeholderTextColor={COLORS.textSecondary} maxLength={50} style={S.input} />
              </View>

              {/* Tipo */}
              <View>
                <Text style={S.label}>Tipo de atividade</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8, paddingTop: 4 }}>
                    {CATEGORIAS.map((cat) => {
                      const sel = tipo === cat.valor;
                      return (
                        <TouchableOpacity key={cat.valor} onPress={() => setTipo(cat.valor)} style={[S.chip, sel && S.chipAtivo, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
                          <Ionicons name={cat.icon} size={14} color={sel ? "#fff" : COLORS.primary} />
                          <Text style={[S.chipText, sel && S.chipTextAtivo]}>{cat.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Dias */}
              <View>
                <Text style={S.label}>Dias da semana</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 4 }}>
                  {DIAS.map((d) => {
                    const ativo = dias.includes(d.valor);
                    return (
                      <TouchableOpacity
                        key={d.valor}
                        onPress={() => setDias((prev) => ativo ? prev.filter((x) => x !== d.valor) : [...prev, d.valor])}
                        style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: ativo ? COLORS.primary : "#f3f4f6", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: ativo ? COLORS.primary : "transparent" }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "600", color: ativo ? "#fff" : COLORS.textSecondary }}>{d.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Horário */}
              <View>
                <TouchableOpacity onPress={() => setUsarHorario(!usarHorario)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: usarHorario ? COLORS.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                    {usarHorario && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={{ fontSize: FONT.md, fontWeight: "500", color: COLORS.text }}>
                    Definir horário fixo de lembrete
                  </Text>
                </TouchableOpacity>
                {usarHorario && (
                  <View style={{ marginTop: 12 }}>
                    <HorarioPickerNativo hora={hora} minuto={minuto} onChangeHora={setHora} onChangeMinuto={setMinuto} />
                  </View>
                )}
              </View>

              <CamposEspecificos />
            </ScrollView>

            {/* Footer */}
            <View style={{ flexDirection: "row", gap: 12, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <TouchableOpacity onPress={() => { reset(); setModalAberto(false); }} style={[S.btn, { flex: 1, backgroundColor: "#f3f4f6" }]}>
                <Text style={{ color: COLORS.text, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={salvar} style={[S.btn, { flex: 2, backgroundColor: COLORS.primary }]}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Salvar Rotina</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sub-modal de exercícios via API */}
      <ModalSelecionarExercicio
        visivel={modalExercicio}
        focos={foco}
        onFechar={() => setModalExercicio(false)}
        onConfirmar={(ex) => { setExercicios((prev) => [...prev, ex]); setModalExercicio(false); }}
      />

      {/* Modal de iniciar atividade */}
      <ModalIniciarAtividade
        visivel={!!rotinaParaIniciar}
        rotina={rotinaParaIniciar}
        onFechar={() => setRotinaParaIniciar(null)}
        onConcluido={(calorias) => {
          // Recarrega os dados após concluir
          carregar();
        }}
      />
    </View>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function LinhaInfo({ icon, label, valor }: { icon: keyof typeof Ionicons.glyphMap; label: string; valor: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
      <Ionicons name={icon} size={13} color={COLORS.textSecondary} />
      <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>{label}:</Text>
      <Text style={{ fontSize: FONT.sm, color: COLORS.text, fontWeight: "600" }}>{valor}</Text>
    </View>
  );
}

// ─── Estilos locais ───────────────────────────────────────────────────────────

const S = {
  label: { fontSize: FONT.md, fontWeight: "600" as const, color: COLORS.text, marginBottom: 8 },
  input: { backgroundColor: "#f3f4f6", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: FONT.md, color: COLORS.text, borderWidth: 1, borderColor: "transparent", marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "transparent", alignItems: "center" as const, justifyContent: "center" as const },
  chipAtivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: "500" as const },
  chipTextAtivo: { color: "#fff", fontWeight: "600" as const },
  btn: { height: 48, borderRadius: 14, alignItems: "center" as const, justifyContent: "center" as const },
};
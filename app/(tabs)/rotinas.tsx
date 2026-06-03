import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Configuração das APIs ────────────────────────────────────────────────────

const RAPIDAPI_KEY = "0c3adf7d38msh2d848fed8b9d652p15cfdbjsn1758045423bb";
const EXERCISEDB_BASE = "https://exercisedb.p.rapidapi.com";
const exerciseDbHeaders = {
  "X-RapidAPI-Key": RAPIDAPI_KEY,
  "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
};

// Troque pelo IP/URL onde sua API está rodando (ex: "http://192.168.x.x:3000")
const FITNESS_API_BASE = "http://localhost:3000";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Exercise = {
  id: string;
  name: string;
  category?: string;
  intensity?: string;
  met?: number;
  muscles?: string[];
  description?: string;
  // campos ExerciseDB
  target?: string;
  equipment?: string;
  bodyPart?: string;
  gifUrl?: string;
  source: "fitness_api" | "exercisedb";
};

type TreinoItem = Exercise & { duration_min?: number; distance_km?: number };

type CaloriasResumo = {
  total_calories_burned: number;
  total_duration_min: number;
  total_hydration: { recommended_ml: number; recommended_glasses: number };
  exercise_count: number;
};

// ─── Helpers de tradução ──────────────────────────────────────────────────────

function traduzir(texto: string = "") {
  const map: Record<string, string> = {
    back: "costas",
    cardio: "cardio",
    chest: "peito",
    "lower arms": "antebraço",
    "lower legs": "panturrilha",
    neck: "pescoço",
    shoulders: "ombros",
    "upper arms": "braços",
    "upper legs": "pernas",
    waist: "abdômen",
    biceps: "bíceps",
    triceps: "tríceps",
    pectorals: "peitorais",
    quads: "quadríceps",
    calves: "panturrilhas",
    glutes: "glúteos",
    abs: "abdômen",
    delts: "deltoides",
    forearms: "antebraços",
    hamstrings: "posterior de coxa",
    lats: "dorsais",
    traps: "trapézio",
    barbell: "barra",
    dumbbell: "halter",
    cable: "cabo/polia",
    "body weight": "peso corporal",
    "smith machine": "máquina smith",
    "leverage machine": "máquina",
    band: "elástico",
    kettlebell: "kettlebell",
    "resistance band": "faixa elástica",
  };
  return map[texto.toLowerCase()] ?? texto;
}

function termoPtParaEn(texto: string = "") {
  const map: Record<string, string> = {
    peito: "chest",
    costas: "back",
    ombro: "shoulders",
    ombros: "shoulders",
    braço: "upper arms",
    braco: "upper arms",
    braços: "upper arms",
    bracos: "upper arms",
    biceps: "upper arms",
    bíceps: "upper arms",
    triceps: "upper arms",
    tríceps: "upper arms",
    perna: "upper legs",
    pernas: "upper legs",
    panturrilha: "lower legs",
    panturrilhas: "lower legs",
    abdomen: "waist",
    abdômen: "waist",
    abdominal: "waist",
    abs: "waist",
    pescoco: "neck",
    pescoço: "neck",
    cardio: "cardio",
  };
  return map[texto.toLowerCase().trim()] ?? texto;
}

const BODY_PARTS = [
  "back",
  "cardio",
  "chest",
  "lower arms",
  "lower legs",
  "neck",
  "shoulders",
  "upper arms",
  "upper legs",
  "waist",
];

const INTENSITY_LABELS: Record<string, string> = {
  muito_baixa: "Muito baixa",
  baixa: "Baixa",
  moderada: "Moderada",
  alta: "Alta",
  muito_alta: "Muito alta",
};

const CATEGORY_LABELS: Record<string, string> = {
  corrida_caminhada: "🏃 Corrida / Caminhada",
  ciclismo: "🚴 Ciclismo",
  natacao: "🏊 Natação",
  lutas: "🥊 Lutas",
  yoga_alongamento: "🧘 Yoga / Alongamento",
  hiit_funcional: "⚡ HIIT / Funcional",
};

// ─── Funções de fetch ─────────────────────────────────────────────────────────

async function fetchExerciseDb(busca: string): Promise<Exercise[]> {
  const termo = termoPtParaEn(busca).toLowerCase().trim();
  const url = BODY_PARTS.includes(termo)
    ? `${EXERCISEDB_BASE}/exercises/bodyPart/${encodeURIComponent(termo)}?limit=30&offset=0`
    : busca.trim()
      ? `${EXERCISEDB_BASE}/exercises/name/${encodeURIComponent(termo)}?limit=30&offset=0`
      : `${EXERCISEDB_BASE}/exercises?limit=20&offset=0`;

  const res = await fetch(url, { method: "GET", headers: exerciseDbHeaders });
  if (!res.ok) throw new Error(`ExerciseDB ${res.status}`);
  const data = await res.json();
  return data.map((e: any) => ({ ...e, source: "exercisedb" as const }));
}

async function fetchFitnessApi(
  category: string,
  intensity: string,
): Promise<Exercise[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (intensity) params.set("intensity", intensity);
  const res = await fetch(`${FITNESS_API_BASE}/exercises?${params}`);
  if (!res.ok) throw new Error(`FitnessAPI ${res.status}`);
  const data = await res.json();
  return data.exercises.map((e: any) => ({
    ...e,
    source: "fitness_api" as const,
  }));
}

async function fetchCaloriasRotina(
  weightKg: number,
  treino: TreinoItem[],
): Promise<{ summary: CaloriasResumo; exercises: any[] }> {
  const routine = treino
    .filter((t) => t.source === "fitness_api" && t.duration_min)
    .map((t) => ({
      exercise_id: t.id,
      duration_min: t.duration_min,
      ...(t.distance_km ? { distance_km: t.distance_km } : {}),
    }));

  if (routine.length === 0)
    throw new Error("Nenhum exercício da API própria com duração definida.");

  const res = await fetch(`${FITNESS_API_BASE}/routines/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weight_kg: weightKg, routine }),
  });
  if (!res.ok) throw new Error(`RoutineSummary ${res.status}`);
  return res.json();
}

async function fetchHidratacao(
  durationMin: number,
  intensity: string,
  weightKg: number,
) {
  const res = await fetch(`${FITNESS_API_BASE}/hydration/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      duration_min: durationMin,
      intensity,
      weight_kg: weightKg,
    }),
  });
  if (!res.ok) throw new Error(`Hydration ${res.status}`);
  return res.json();
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Rotinas() {
  // Aba ativa: "academia" | "aerobico"
  const [aba, setAba] = useState<"academia" | "aerobico">("academia");

  // Academia (ExerciseDB)
  const [buscaGym, setBuscaGym] = useState("");
  const [exerciciosGym, setExerciciosGym] = useState<Exercise[]>([]);

  // Aeróbico (Fitness API)
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroIntensidade, setFiltroIntensidade] = useState("");
  const [exerciciosAero, setExerciciosAero] = useState<Exercise[]>([]);

  // Estado compartilhado
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // Treinos
  const [treinoA, setTreinoA] = useState<TreinoItem[]>([]);
  const [treinoB, setTreinoB] = useState<TreinoItem[]>([]);

  // Modal de calorias
  const [modalVisivel, setModalVisivel] = useState(false);
  const [pesoKg, setPesoKg] = useState("75");
  const [resumoCalorias, setResumoCalorias] = useState<CaloriasResumo | null>(
    null,
  );
  const [calcCarregando, setCalcCarregando] = useState(false);
  const [calcErro, setCalcErro] = useState("");

  // Modal de duração ao adicionar exercício fitness_api
  const [modalDuracao, setModalDuracao] = useState(false);
  const [exercicioSelecionado, setExercicioSelecionado] =
    useState<Exercise | null>(null);
  const [targetTreino, setTargetTreino] = useState<"A" | "B">("A");
  const [duracao, setDuracao] = useState("30");
  const [distancia, setDistancia] = useState("");

  // ── Carregamento inicial ──
  useEffect(() => {
    carregarGym();
    carregarAerobico();
  }, []);

  async function carregarGym() {
    setCarregando(true);
    setErro("");
    try {
      const dados = await fetchExerciseDb("");
      setExerciciosGym(dados);
    } catch (e: any) {
      setErro("Não foi possível carregar exercícios de academia.");
    } finally {
      setCarregando(false);
    }
  }

  async function buscarGym() {
    setCarregando(true);
    setErro("");
    try {
      const dados = await fetchExerciseDb(buscaGym);
      setExerciciosGym(dados);
    } catch (e: any) {
      setErro("Erro ao buscar exercícios.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarAerobico() {
    setCarregando(true);
    setErro("");
    try {
      const dados = await fetchFitnessApi(filtroCategoria, filtroIntensidade);
      setExerciciosAero(dados);
    } catch (e: any) {
      setErro(
        "Não foi possível carregar exercícios aeróbicos. Verifique se a API está rodando.",
      );
    } finally {
      setCarregando(false);
    }
  }

  // ── Adicionar ao treino ──
  function tentarAdicionarAoTreino(exercicio: Exercise, treino: "A" | "B") {
    if (exercicio.source === "fitness_api") {
      setExercicioSelecionado(exercicio);
      setTargetTreino(treino);
      setDuracao("30");
      setDistancia("");
      setModalDuracao(true);
    } else {
      adicionarDirecto(exercicio, treino);
    }
  }

  function adicionarDirecto(exercicio: Exercise, treino: "A" | "B") {
    const setter = treino === "A" ? setTreinoA : setTreinoB;
    const lista = treino === "A" ? treinoA : treinoB;
    if (lista.some((i) => i.id === exercicio.id)) {
      alert(`Esse exercício já está no Treino ${treino}.`);
      return;
    }
    setter((l) => [...l, { ...exercicio }]);
  }

  function confirmarComDuracao() {
    if (!exercicioSelecionado) return;
    const setter = targetTreino === "A" ? setTreinoA : setTreinoB;
    const lista = targetTreino === "A" ? treinoA : treinoB;
    if (lista.some((i) => i.id === exercicioSelecionado.id)) {
      alert(`Esse exercício já está no Treino ${targetTreino}.`);
      setModalDuracao(false);
      return;
    }
    const item: TreinoItem = {
      ...exercicioSelecionado,
      duration_min: parseInt(duracao) || 30,
      ...(distancia ? { distance_km: parseFloat(distancia) } : {}),
    };
    setter((l) => [...l, item]);
    setModalDuracao(false);
  }

  function remover(id: string, treino: "A" | "B") {
    const setter = treino === "A" ? setTreinoA : setTreinoB;
    setter((l) => l.filter((i) => i.id !== id));
  }

  // ── Cálculo de calorias ──
  async function calcularCalorias(treino: TreinoItem[]) {
    setCalcErro("");
    setResumoCalorias(null);
    setCalcCarregando(true);
    try {
      const peso = parseFloat(pesoKg);
      if (!peso || peso <= 0) throw new Error("Peso inválido.");
      const { summary } = await fetchCaloriasRotina(peso, treino);
      setResumoCalorias(summary);
    } catch (e: any) {
      setCalcErro(e.message ?? "Erro ao calcular calorias.");
    } finally {
      setCalcCarregando(false);
    }
  }

  // ── Renderização ──
  const corAba = (a: string) => (aba === a ? "#27AE60" : "#1E2A38");
  const exerciciosAtivos = aba === "academia" ? exerciciosGym : exerciciosAero;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0B0F14" }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      {/* ── Header ── */}
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 4,
        }}
      >
        Exercícios
      </Text>
      <Text style={{ color: "#AAB2C0", fontSize: 14, marginBottom: 20 }}>
        Academia via ExerciseDB · Aeróbico/Lutas/Yoga via Fitness API
      </Text>

      {/* ── Abas ── */}
      <View style={{ flexDirection: "row", marginBottom: 20, gap: 10 }}>
        <TouchableOpacity
          onPress={() => setAba("academia")}
          style={{
            flex: 1,
            backgroundColor: corAba("academia"),
            padding: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
            🏋️ Academia
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setAba("aerobico")}
          style={{
            flex: 1,
            backgroundColor: corAba("aerobico"),
            padding: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
            🏃 Aeróbico & +
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Painel Academia ── */}
      {aba === "academia" && (
        <View
          style={{
            backgroundColor: "#151B23",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#273140",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            Buscar exercício de academia
          </Text>
          <TextInput
            placeholder="Ex: peito, costas, biceps, chest..."
            placeholderTextColor="#7C8797"
            value={buscaGym}
            onChangeText={setBuscaGym}
            style={{
              backgroundColor: "#0B0F14",
              color: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#354052",
              padding: 12,
              borderRadius: 10,
              marginBottom: 10,
            }}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={buscarGym}
              style={{
                flex: 1,
                backgroundColor: "#27AE60",
                padding: 12,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                Buscar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={carregarGym}
              style={{
                flex: 1,
                backgroundColor: "#2F80ED",
                padding: 12,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                Recarregar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Painel Aeróbico ── */}
      {aba === "aerobico" && (
        <View
          style={{
            backgroundColor: "#151B23",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#273140",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            Filtrar exercícios
          </Text>

          <Text style={{ color: "#AAB2C0", marginBottom: 6 }}>Categoria</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          >
            {["", ...Object.keys(CATEGORY_LABELS)].map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setFiltroCategoria(cat)}
                style={{
                  backgroundColor:
                    filtroCategoria === cat ? "#27AE60" : "#0B0F14",
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: filtroCategoria === cat ? "#27AE60" : "#354052",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 13 }}>
                  {cat === "" ? "Todos" : CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={{ color: "#AAB2C0", marginBottom: 6 }}>Intensidade</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          >
            {["", "muito_baixa", "baixa", "moderada", "alta", "muito_alta"].map(
              (int) => (
                <TouchableOpacity
                  key={int}
                  onPress={() => setFiltroIntensidade(int)}
                  style={{
                    backgroundColor:
                      filtroIntensidade === int ? "#2F80ED" : "#0B0F14",
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor:
                      filtroIntensidade === int ? "#2F80ED" : "#354052",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 13 }}>
                    {int === "" ? "Todas" : INTENSITY_LABELS[int]}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={carregarAerobico}
            style={{
              backgroundColor: "#27AE60",
              padding: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
              Aplicar filtros
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Treino A ── */}
      <TreinoCard
        titulo="Treino A"
        itens={treinoA}
        onRemover={(id) => remover(id, "A")}
        onCalcular={() => {
          setModalVisivel(true);
          calcularCalorias(treinoA);
        }}
      />

      {/* ── Treino B ── */}
      <TreinoCard
        titulo="Treino B"
        itens={treinoB}
        onRemover={(id) => remover(id, "B")}
        onCalcular={() => {
          setModalVisivel(true);
          calcularCalorias(treinoB);
        }}
      />

      {/* ── Loading / Erro ── */}
      {carregando && (
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <ActivityIndicator size="large" color="#27AE60" />
          <Text style={{ color: "#AAB2C0", marginTop: 8 }}>
            Carregando exercícios...
          </Text>
        </View>
      )}
      {!!erro && (
        <Text
          style={{ color: "#FF6B6B", textAlign: "center", marginBottom: 16 }}
        >
          {erro}
        </Text>
      )}

      {/* ── Lista de resultados ── */}
      {!carregando &&
        exerciciosAtivos.map((item) => (
          <CardExercicio
            key={item.id}
            item={item}
            onAddA={() => tentarAdicionarAoTreino(item, "A")}
            onAddB={() => tentarAdicionarAoTreino(item, "B")}
          />
        ))}

      {!carregando && exerciciosAtivos.length === 0 && (
        <Text style={{ color: "#7C8797", textAlign: "center", marginTop: 20 }}>
          Nenhum exercício encontrado.
        </Text>
      )}

      {/* ── Modal: definir duração ── */}
      <Modal visible={modalDuracao} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "#00000099",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#151B23",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 4,
              }}
            >
              {exercicioSelecionado?.name}
            </Text>
            <Text style={{ color: "#AAB2C0", marginBottom: 16 }}>
              Informe a duração para calcular calorias
            </Text>

            <Text style={{ color: "#AAB2C0", marginBottom: 6 }}>
              Duração (minutos) *
            </Text>
            <TextInput
              value={duracao}
              onChangeText={setDuracao}
              keyboardType="numeric"
              style={{
                backgroundColor: "#0B0F14",
                color: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#354052",
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
              }}
            />

            {exercicioSelecionado?.id?.startsWith("run_walk") ||
            exercicioSelecionado?.id?.startsWith("cycling") ||
            exercicioSelecionado?.id?.startsWith("swim") ? (
              <>
                <Text style={{ color: "#AAB2C0", marginBottom: 6 }}>
                  Distância (km) — opcional
                </Text>
                <TextInput
                  value={distancia}
                  onChangeText={setDistancia}
                  keyboardType="numeric"
                  placeholder="Ex: 5"
                  placeholderTextColor="#7C8797"
                  style={{
                    backgroundColor: "#0B0F14",
                    color: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: "#354052",
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 16,
                  }}
                />
              </>
            ) : (
              <View style={{ marginBottom: 16 }} />
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setModalDuracao(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#273140",
                  padding: 14,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmarComDuracao}
                style={{
                  flex: 1,
                  backgroundColor: targetTreino === "A" ? "#27AE60" : "#2F80ED",
                  padding: 14,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                  Add Treino {targetTreino}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: calorias ── */}
      <Modal visible={modalVisivel} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "#00000099",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#151B23",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              maxHeight: "70%",
            }}
          >
            <ScrollView>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 20,
                  fontWeight: "bold",
                  marginBottom: 12,
                }}
              >
                🔥 Calorias & Hidratação
              </Text>

              <Text style={{ color: "#AAB2C0", marginBottom: 6 }}>
                Seu peso (kg)
              </Text>
              <TextInput
                value={pesoKg}
                onChangeText={setPesoKg}
                keyboardType="numeric"
                style={{
                  backgroundColor: "#0B0F14",
                  color: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#354052",
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              />

              <Text
                style={{ color: "#AAB2C0", fontSize: 12, marginBottom: 16 }}
              >
                Nota: o cálculo usa apenas exercícios da Fitness API
                (aeróbicos/lutas/yoga) com duração definida.
              </Text>

              {calcCarregando && (
                <ActivityIndicator
                  color="#27AE60"
                  style={{ marginBottom: 16 }}
                />
              )}

              {!!calcErro && (
                <Text style={{ color: "#FF6B6B", marginBottom: 16 }}>
                  {calcErro}
                </Text>
              )}

              {resumoCalorias && (
                <View
                  style={{
                    backgroundColor: "#0B0F14",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <ResumoLinha
                    emoji="🔥"
                    label="Calorias queimadas"
                    valor={`${resumoCalorias.total_calories_burned} kcal`}
                  />
                  <ResumoLinha
                    emoji="⏱️"
                    label="Duração total"
                    valor={`${resumoCalorias.total_duration_min} min`}
                  />
                  <ResumoLinha
                    emoji="💧"
                    label="Hidratação recomendada"
                    valor={`${resumoCalorias.total_hydration.recommended_ml} ml (${resumoCalorias.total_hydration.recommended_glasses} copos)`}
                  />
                  <ResumoLinha
                    emoji="🏃"
                    label="Exercícios"
                    valor={`${resumoCalorias.exercise_count}`}
                  />
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setModalVisivel(false)}
                  style={{
                    flex: 1,
                    backgroundColor: "#273140",
                    padding: 14,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF" }}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function CardExercicio({
  item,
  onAddA,
  onAddB,
}: {
  item: Exercise;
  onAddA: () => void;
  onAddB: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: "#151B23",
        marginBottom: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: "#273140",
        borderRadius: 14,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 17,
          fontWeight: "bold",
          marginBottom: 6,
          textTransform: "capitalize",
        }}
      >
        {item.name}
      </Text>

      {item.source === "exercisedb" ? (
        <>
          {item.target && (
            <Text style={{ color: "#DDE3EC", marginBottom: 2 }}>
              Músculo: {traduzir(item.target)}
            </Text>
          )}
          {item.equipment && (
            <Text style={{ color: "#DDE3EC", marginBottom: 2 }}>
              Equipamento: {traduzir(item.equipment)}
            </Text>
          )}
          {item.bodyPart && (
            <Text style={{ color: "#DDE3EC", marginBottom: 10 }}>
              Parte do corpo: {traduzir(item.bodyPart)}
            </Text>
          )}
          {item.gifUrl && (
            <Image
              source={{ uri: item.gifUrl }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 10,
                backgroundColor: "#FFF",
                marginBottom: 10,
              }}
              resizeMode="contain"
            />
          )}
        </>
      ) : (
        <>
          {item.category && (
            <Text style={{ color: "#DDE3EC", marginBottom: 2 }}>
              {CATEGORY_LABELS[item.category] ?? item.category}
            </Text>
          )}
          {item.intensity && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 2,
              }}
            >
              <Text style={{ color: "#DDE3EC" }}>Intensidade: </Text>
              <IntensidadeBadge intensity={item.intensity} />
            </View>
          )}
          {item.met && (
            <Text style={{ color: "#7C8797", fontSize: 12, marginBottom: 2 }}>
              MET: {item.met}
            </Text>
          )}
          {item.description && (
            <Text style={{ color: "#AAB2C0", fontSize: 13, marginBottom: 8 }}>
              {item.description}
            </Text>
          )}
          {item.muscles && item.muscles.length > 0 && (
            <Text style={{ color: "#7C8797", fontSize: 12, marginBottom: 10 }}>
              Músculos: {item.muscles.join(", ")}
            </Text>
          )}
          <Text style={{ color: "#7C8797", fontSize: 11, marginBottom: 8 }}>
            ⏱ Duração será pedida ao adicionar
          </Text>
        </>
      )}

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          onPress={onAddA}
          style={{
            flex: 1,
            backgroundColor: "#27AE60",
            padding: 11,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
            Add Treino A
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAddB}
          style={{
            flex: 1,
            backgroundColor: "#2F80ED",
            padding: 11,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
            Add Treino B
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TreinoCard({
  titulo,
  itens,
  onRemover,
  onCalcular,
}: {
  titulo: string;
  itens: TreinoItem[];
  onRemover: (id: string) => void;
  onCalcular: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: "#151B23",
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#273140",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "bold" }}>
          {titulo}
        </Text>
        {itens.length > 0 && (
          <TouchableOpacity
            onPress={onCalcular}
            style={{
              backgroundColor: "#E67E22",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 13 }}
            >
              🔥 Calorias
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {itens.length === 0 ? (
        <Text style={{ color: "#7C8797" }}>Nenhum exercício adicionado.</Text>
      ) : (
        itens.map((item) => (
          <View
            key={item.id}
            style={{
              borderTopWidth: 1,
              borderTopColor: "#273140",
              paddingTop: 10,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontWeight: "bold",
                textTransform: "capitalize",
              }}
            >
              {item.name}
            </Text>
            {item.source === "fitness_api" ? (
              <>
                {item.category && (
                  <Text style={{ color: "#DDE3EC", fontSize: 13 }}>
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </Text>
                )}
                {item.duration_min && (
                  <Text style={{ color: "#AAB2C0", fontSize: 12 }}>
                    ⏱ {item.duration_min} min
                    {item.distance_km ? ` · ${item.distance_km} km` : ""}
                  </Text>
                )}
              </>
            ) : (
              <Text style={{ color: "#DDE3EC", fontSize: 13 }}>
                Músculo: {traduzir(item.target ?? "")}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => onRemover(item.id)}
              style={{
                backgroundColor: "#D64545",
                padding: 8,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                Remover
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

function IntensidadeBadge({ intensity }: { intensity: string }) {
  const cores: Record<string, string> = {
    muito_baixa: "#4CAF50",
    baixa: "#8BC34A",
    moderada: "#FFC107",
    alta: "#FF9800",
    muito_alta: "#F44336",
  };
  return (
    <View
      style={{
        backgroundColor: cores[intensity] ?? "#666",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
      }}
    >
      <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "bold" }}>
        {INTENSITY_LABELS[intensity] ?? intensity}
      </Text>
    </View>
  );
}

function ResumoLinha({
  emoji,
  label,
  valor,
}: {
  emoji: string;
  label: string;
  valor: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <Text style={{ color: "#AAB2C0" }}>
        {emoji} {label}
      </Text>
      <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>{valor}</Text>
    </View>
  );
}

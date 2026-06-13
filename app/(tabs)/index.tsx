// app/(tabs)/index.tsx

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Header from "../../src/components/Header";
import ModalIniciarAtividade from "../../src/components/ModalIniciarAtividade";
import PostCard from "../../src/components/PostCard";

import { useAuth } from "../../src/context/AuthContext";
import { buscarGrupoDoUsuario } from "../../src/services/grupoService";
import { carregarRegistroHoje } from "../../src/services/nutritionStorage";
import { buscarPostsDoGrupo } from "../../src/services/postService";
import { buscarRotinasDoUsuario } from "../../src/services/rotinaService";
import {
  caloriasGastasHoje,
  carregarTreinosHoje,
} from "../../src/services/workoutStorage";

import { COLORS, FONT, SPACING } from "../../src/styles/theme";
import { Post, Rotina } from "../../src/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIAS_SEMANA: Record<number, string> = {
  0: "dom", 1: "seg", 2: "ter", 3: "qua",
  4: "qui", 5: "sex", 6: "sab",
};

function diaDeHoje() {
  return DIAS_SEMANA[new Date().getDay()];
}

function formatarData() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function calcularMetaAgua(peso?: number, sexo?: "masculino" | "feminino"): number {
  if (!peso) return 2000;
  const base = peso * 35;
  return sexo === "feminino" ? Math.round(base * 0.9) : Math.round(base);
}

// ─── Componente: Barra de progresso ──────────────────────────────────────────

function BarraProgresso({
  icon, iconColor, label, valorAtual, valorMeta, unidade, semMeta = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  valorAtual: number;
  valorMeta: number;
  unidade: string;
  semMeta?: boolean;
}) {
  const pct = valorMeta > 0 ? Math.min((valorAtual / valorMeta) * 100, 100) : 0;

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name={icon} size={15} color={iconColor} />
          <Text style={{ fontSize: FONT.md, color: COLORS.text, fontWeight: "500" }}>{label}</Text>
        </View>
        <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
          {valorAtual} {semMeta ? unidade : `/ ${valorMeta} ${unidade}`}
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: COLORS.border, borderRadius: 10 }}>
        <View style={{
          height: 6,
          width: semMeta ? "0%" : `${pct}%`,
          backgroundColor: iconColor,
          borderRadius: 10,
        }} />
      </View>
    </View>
  );
}

// ─── Componente: Resumo do Dia ────────────────────────────────────────────────

function DaySummaryCard({
  aguaMl, metaAguaMl,
  calConsumidas, metaCalorias,
  calGastas,
  treinosHoje,
}: {
  aguaMl: number;
  metaAguaMl: number;
  calConsumidas: number;
  metaCalorias: number;
  calGastas: number;
  treinosHoje: number;
}) {
  const aguaL     = Math.round(aguaMl / 100) / 10;
  const metaAguaL = Math.round(metaAguaMl / 100) / 10;

  return (
    <View style={{
      marginHorizontal: SPACING.lg,
      marginTop: -20,
      padding: SPACING.lg,
      borderRadius: 16,
      backgroundColor: COLORS.card,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
    }}>
      <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text, marginBottom: 14 }}>
        Resumo do Dia
      </Text>

      <BarraProgresso
        icon="water-outline"
        iconColor="#3b82f6"
        label="Hidratação"
        valorAtual={aguaL}
        valorMeta={metaAguaL}
        unidade="L"
      />

      <BarraProgresso
        icon="restaurant-outline"
        iconColor="#f97316"
        label="Calorias consumidas"
        valorAtual={Math.round(calConsumidas)}
        valorMeta={metaCalorias}
        unidade="kcal"
      />

      <BarraProgresso
        icon="flame-outline"
        iconColor="#ef4444"
        label="Calorias queimadas"
        valorAtual={calGastas}
        valorMeta={0}
        unidade="kcal"
        semMeta
      />

      {/* Treinos de hoje — sem barrinha, só o número */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="barbell-outline" size={15} color="#22c55e" />
          <Text style={{ fontSize: FONT.md, color: COLORS.text, fontWeight: "500" }}>
            Treinos concluídos hoje
          </Text>
        </View>
        <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
          {treinosHoje} treino{treinosHoje !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
}

// ─── Componente: Treino de Hoje ───────────────────────────────────────────────

function TreinoDeHoje({
  rotina,
  onIniciar,
}: {
  rotina: Rotina | null;
  onIniciar: () => void;
}) {
  const dados = rotina?.dados as any;

  if (!rotina) {
    return (
      <View style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
        <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text, marginBottom: 10 }}>
          Treino de Hoje
        </Text>
        <View style={{
          backgroundColor: COLORS.card,
          borderRadius: 14,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: COLORS.border,
          alignItems: "center",
          gap: 8,
        }}>
          <Ionicons name="calendar-outline" size={32} color={COLORS.border} />
          <Text style={{ color: COLORS.textSecondary, fontSize: FONT.md, textAlign: "center" }}>
            Nenhum treino agendado para hoje.
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm, textAlign: "center" }}>
            Crie uma rotina na aba Rotinas e defina os dias da semana.
          </Text>
        </View>
      </View>
    );
  }

  const numExercicios = dados?.exercicios?.length ?? 0;
  const focos: string[] = dados?.foco ?? [];

  return (
    <View style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
      <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text, marginBottom: 10 }}>
        Treino de Hoje
      </Text>

      <View style={{
        backgroundColor: "#eff6ff",
        borderRadius: 14,
        padding: SPACING.lg,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
      }}>
        {/* Nome + badge */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ fontSize: FONT.xl, fontWeight: "700", color: COLORS.text }}>
              {rotina.nome}
            </Text>
            {focos.length > 0 && (
              <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 2 }}>
                {focos.join(" · ")}
              </Text>
            )}
          </View>
          <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ color: "#fff", fontSize: FONT.sm, fontWeight: "700" }}>
              {rotina.tipo.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Meta info */}
        <View style={{ flexDirection: "row", gap: 16, marginBottom: numExercicios > 0 ? 12 : 0 }}>
          {rotina.horario && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
              <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>{rotina.horario}</Text>
            </View>
          )}
          {numExercicios > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="barbell-outline" size={13} color={COLORS.textSecondary} />
              <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
                {numExercicios} exercício{numExercicios !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Preview dos exercícios */}
        {numExercicios > 0 && (
          <View style={{ marginBottom: 14, gap: 4 }}>
            {(dados.exercicios as any[]).slice(0, 3).map((ex: any, i: number) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primary }} />
                <Text style={{ fontSize: FONT.sm, color: COLORS.text }}>
                  {ex.nome}
                  <Text style={{ color: COLORS.textSecondary }}>  {ex.series}×{ex.repeticoes}</Text>
                </Text>
              </View>
            ))}
            {numExercicios > 3 && (
              <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, marginLeft: 11 }}>
                + {numExercicios - 3} mais...
              </Text>
            )}
          </View>
        )}

        {/* Botão Iniciar */}
        <TouchableOpacity
          onPress={onIniciar}
          style={{
            backgroundColor: "#16a34a",
            borderRadius: 12,
            padding: 13,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            shadowColor: "#16a34a",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Ionicons name="flash-outline" size={17} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: FONT.md }}>
            Iniciar Treino
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Home() {
  const { usuario } = useAuth();

  // ── Dados reais ──
  const [aguaMl, setAguaMl]               = useState(0);
  const [calConsumidas, setCalConsumidas]  = useState(0);
  const [calGastas, setCalGastas]         = useState(0);
  const [treinosHoje, setTreinosHoje]     = useState(0);
  const [treinoDeHoje, setTreinoDeHoje]   = useState<Rotina | null>(null);
  const [posts, setPosts]                 = useState<Post[]>([]);

  // ── UI ──
  const [carregando, setCarregando]         = useState(true);
  const [carregandoPosts, setCarregandoPosts] = useState(false);
  const [modalTreino, setModalTreino]       = useState(false);

  // ── Metas do perfil ──
  const metaCalorias = usuario?.metaCalorias ?? 2000;
  const metaAguaMl   = usuario?.metaAgua ?? calcularMetaAgua(usuario?.peso, usuario?.sexo);

  // ─── Carregar ao focar ────────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      if (usuario) carregarTudo();
    }, [usuario])
  );

  async function carregarTudo() {
    setCarregando(true);
    try {
      await Promise.all([
        carregarNutricao(),
        carregarAtividade(),
        carregarTreinoHoje(),
        carregarFeed(),
      ]);
    } catch (e) {
      console.error("Erro ao carregar home:", e);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarNutricao() {
    try {
      const registro = await carregarRegistroHoje();
      setAguaMl(registro?.water ?? 0);

      let totalCal = 0;
      (registro?.refeicoes ?? []).forEach((ref: any) => {
        (ref.alimentos ?? []).forEach((al: any) => {
          const fator = Number(al.quantidadeEscolhida ?? 100) / 100;
          totalCal += Number(al.caloriasP100g ?? al.calorias ?? 0) * fator;
        });
      });
      setCalConsumidas(totalCal);
    } catch (e) {
      console.error(e);
    }
  }

  async function carregarAtividade() {
    try {
      const [cal, treinos] = await Promise.all([
        caloriasGastasHoje(),
        carregarTreinosHoje(),
      ]);
      setCalGastas(cal);
      setTreinosHoje(treinos.length);
    } catch (e) {
      console.error(e);
    }
  }

  async function carregarTreinoHoje() {
    if (!usuario) return;
    try {
      const rotinas = await buscarRotinasDoUsuario(usuario.uid);
      const hoje = diaDeHoje();

      const rotinaHoje =
        rotinas.find((r) => r.tipo === "academia" && r.dias?.includes(hoje as any)) ??
        rotinas.find((r) => r.dias?.includes(hoje as any)) ??
        null;

      setTreinoDeHoje(rotinaHoje);
    } catch (e) {
      console.error(e);
    }
  }

  async function carregarFeed() {
    if (!usuario?.grupoCodigo) { setPosts([]); return; }
    setCarregandoPosts(true);
    try {
      const grupo = await buscarGrupoDoUsuario(usuario.grupoCodigo);
      if (!grupo) { setPosts([]); return; }
      const feed = await buscarPostsDoGrupo(grupo.id);
      setPosts(feed);
    } catch (e) {
      console.error(e);
      setPosts([]);
    } finally {
      setCarregandoPosts(false);
    }
  }

  // ─── Callback do modal de treino ──────────────────────────────────────────

  function aoTreinoConcluido(calorias: number) {
    // Atualiza imediatamente os contadores sem recarregar tudo
    setCalGastas((prev) => prev + calorias);
    setTreinosHoje((prev) => prev + 1);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Header
          name={usuario?.nome ?? "Usuário"}
          subtitle={formatarData()}
        />

        {/* Resumo do dia */}
        <DaySummaryCard
          aguaMl={aguaMl}
          metaAguaMl={metaAguaMl}
          calConsumidas={calConsumidas}
          metaCalorias={metaCalorias}
          calGastas={calGastas}
          treinosHoje={treinosHoje}
        />

        {/* Treino de hoje */}
        <TreinoDeHoje
          rotina={treinoDeHoje}
          onIniciar={() => setModalTreino(true)}
        />

        {/* Feed do grupo */}
        <View style={{ marginTop: SPACING.xl }}>
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginHorizontal: SPACING.lg,
            marginBottom: SPACING.md,
          }}>
            <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
              Feed do Grupo
            </Text>
            {posts.length > 0 && (
              <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
                {posts.length} post{posts.length !== 1 ? "s" : ""}
              </Text>
            )}
          </View>

          {carregandoPosts ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : !usuario?.grupoCodigo ? (
            <View style={{
              marginHorizontal: SPACING.lg,
              backgroundColor: COLORS.card,
              borderRadius: 14,
              padding: SPACING.lg,
              alignItems: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}>
              <Ionicons name="people-outline" size={32} color={COLORS.border} />
              <Text style={{ color: COLORS.textSecondary, fontSize: FONT.md, textAlign: "center" }}>
                Você não faz parte de nenhum grupo.
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm, textAlign: "center" }}>
                Vá até a aba Grupo para criar ou entrar em um.
              </Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={{
              marginHorizontal: SPACING.lg,
              backgroundColor: COLORS.card,
              borderRadius: 14,
              padding: SPACING.lg,
              alignItems: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}>
              <Ionicons name="chatbubbles-outline" size={32} color={COLORS.border} />
              <Text style={{ color: COLORS.textSecondary, fontSize: FONT.md, textAlign: "center" }}>
                Nenhum post nas últimas 24h.
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm, textAlign: "center" }}>
                Compartilhe seu treino na aba Grupo!
              </Text>
            </View>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </View>
      </ScrollView>

      {/* Modal de iniciar treino */}
      <ModalIniciarAtividade
        visivel={modalTreino}
        rotina={treinoDeHoje}
        onFechar={() => setModalTreino(false)}
        onConcluido={aoTreinoConcluido}
      />
    </>
  );
}
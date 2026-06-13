// app/(tabs)/nutricao.tsx

import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Header from "../../src/components/Header";
import { useAuth } from "../../src/context/AuthContext";
import { getFoods } from "../../src/services/api";
import {
  carregarHistoricoCompleto,
  carregarRegistroHoje,
  getHojeString,
  salvarRegistroHoje,
} from "../../src/services/nutritionStorage";
import { COLORS, FONT, SPACING } from "../../src/styles/theme";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface Alimento {
  id: number;
  nome: string;
  caloriasP100g: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  categoria?: string;
}

interface AlimentoRefeicao extends Alimento {
  quantidadeEscolhida: number;
}

interface Refeicao {
  id: string;
  nome: string;
  horario: string;
  alimentos: AlimentoRefeicao[];
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Nutricao() {
  const { usuario } = useAuth();

  // ── Metas do perfil ──
  const metaCalorias = usuario?.metaCalorias ?? 2000;
  const metaAguaMl   = usuario?.metaAgua ?? calcularMetaAgua();

  function calcularMetaAgua(): number {
    if (!usuario?.peso) return 2000;
    const base = usuario.peso * 35;
    return Math.round(base);
  }

  // ── Alimentos da API ──
  const [foods, setFoods]           = useState<Alimento[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [erroBusca, setErroBusca]   = useState(false);
  const [search, setSearch]         = useState("");

  // ── Modais ──
  const [mealModalVisible, setMealModalVisible]   = useState(false);
  const [foodModalVisible, setFoodModalVisible]   = useState(false);
  const [mostrarHistorico, setMostrarHistorico]   = useState(false);

  // ── Nova refeição ──
  const [nomeRefeicao, setNomeRefeicao]                       = useState("");
  const [alimentosDaNovaRefeicao, setAlimentosDaNovaRefeicao] = useState<AlimentoRefeicao[]>([]);
  const [alimentoSelecionado, setAlimentoSelecionado]         = useState<Alimento | null>(null);
  const [gramas, setGramas]                                   = useState("100");

  // ── Estado do dia ──
  const [refeicoes, setRefeicoes]               = useState<Refeicao[]>([]);
  const [historicoCompleto, setHistoricoCompleto] = useState<any[]>([]);
  const [water, setWater]                       = useState(0);

  const addWater    = () => setWater((p) => Math.min(p + 250, metaAguaMl + 2000));
  const removeWater = () => setWater((p) => Math.max(p - 250, 0));

  // ─── Macros totais do dia ─────────────────────────────────────────────────

  function macrosDoDia() {
    let cal = 0, prot = 0, carb = 0, fat = 0;
    refeicoes.forEach((ref) => {
      ref.alimentos.forEach((food) => {
        const fator = food.quantidadeEscolhida / 100;
        cal  += food.caloriasP100g * fator;
        prot += food.proteina * fator;
        carb += food.carboidrato * fator;
        fat  += food.gordura * fator;
      });
    });
    return { cal, prot, carb, fat };
  }

  const { cal: calDia, prot, carb, fat } = macrosDoDia();
  const pctCalorias = metaCalorias > 0 ? Math.min((calDia / metaCalorias) * 100, 100) : 0;
  const pctAgua     = metaAguaMl  > 0 ? Math.min((water / metaAguaMl)    * 100, 100) : 0;

  // ─── Carregar dados ───────────────────────────────────────────────────────

  async function carregarAlimentos() {
    setLoadingFoods(true);
    setErroBusca(false);
    try {
      const lista = await getFoods();
      if (Array.isArray(lista) && lista.length > 0) {
        setFoods(lista);
      } else {
        setErroBusca(true);
      }
    } catch (e) {
      console.error("Erro ao carregar alimentos:", e);
      setErroBusca(true);
    } finally {
      setLoadingFoods(false);
    }
  }

  async function carregarDiaAtual() {
    const registro = await carregarRegistroHoje();
    if (registro) {
      setWater(registro.water ?? 0);
      setRefeicoes(registro.refeicoes ?? []);
    }
    const hist = await carregarHistoricoCompleto();
    setHistoricoCompleto(hist);
  }

  // Carrega alimentos na montagem
  useEffect(() => { carregarAlimentos(); }, []);

  // Recarrega dados do dia ao focar na aba
  useFocusEffect(useCallback(() => { carregarDiaAtual(); }, []));

  // Salva automaticamente ao mudar água ou refeições
  useEffect(() => {
    if (loadingFoods) return;
    salvarRegistroHoje({ data: getHojeString(), water, refeicoes });
  }, [water, refeicoes]);

  // ─── Ações ────────────────────────────────────────────────────────────────

  function abrirCriarRefeicao() {
    setNomeRefeicao("");
    setAlimentosDaNovaRefeicao([]);
    setMealModalVisible(true);
  }

  function confirmarAlimento() {
    if (!alimentoSelecionado) return;
    const qtd = parseFloat(gramas) || 100;
    setAlimentosDaNovaRefeicao((prev) => [
      ...prev,
      { ...alimentoSelecionado, quantidadeEscolhida: qtd },
    ]);
    setFoodModalVisible(false);
    setAlimentoSelecionado(null);
    setGramas("100");
  }

  function salvarRefeicao() {
    if (!nomeRefeicao.trim()) return;
    const agora = new Date();
    const horario = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    const nova: Refeicao = {
      id: String(Date.now()),
      nome: nomeRefeicao.trim(),
      horario,
      alimentos: alimentosDaNovaRefeicao,
    };
    setRefeicoes((prev) => [...prev, nova]);
    setMealModalVisible(false);
  }

  function removerRefeicao(id: string) {
    setRefeicoes((prev) => prev.filter((r) => r.id !== id));
  }

  const foodsFiltrados = foods.filter((f) =>
    f.nome?.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Header
        name={usuario?.nome ?? "Usuário"}
        subtitle="Acompanhe sua alimentação e hidratação"
      />

      {/* ── Card Calorias ── */}
      <View style={{
        marginHorizontal: SPACING.lg,
        marginTop: -20,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: SPACING.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
      }}>
        <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text, marginBottom: 12 }}>
          Consumo Calórico
        </Text>

        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 36, fontWeight: "800", color: COLORS.primary }}>
            {calDia.toFixed(0)}
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm, marginTop: 2 }}>
            de {metaCalorias} kcal
          </Text>
        </View>

        <View style={{ height: 8, backgroundColor: COLORS.border, borderRadius: 10, marginBottom: 14 }}>
          <View style={{ width: `${pctCalorias}%`, height: 8, backgroundColor: COLORS.primary, borderRadius: 10 }} />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 }}>
          {[
            { label: "Proteínas", valor: prot, cor: "#3b82f6" },
            { label: "Carbos",    valor: carb, cor: "#f97316" },
            { label: "Gorduras",  valor: fat,  cor: "#a855f7" },
          ].map((item) => (
            <View key={item.label} style={{ alignItems: "center" }}>
              <Text style={{ fontSize: FONT.lg, fontWeight: "700", color: item.cor }}>
                {item.valor.toFixed(1)}g
              </Text>
              <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Card Hidratação ── */}
      <View style={{
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.lg,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}>
        <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text, marginBottom: 12 }}>
          Hidratação
        </Text>

        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 36, fontWeight: "800", color: "#3b82f6" }}>
            {water >= 1000 ? `${(water / 1000).toFixed(1)}L` : `${water}ml`}
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm, marginTop: 2 }}>
            Meta: {(metaAguaMl / 1000).toFixed(1)}L
            {usuario?.peso ? ` (${usuario.peso}kg × 35ml)` : ""}
          </Text>
        </View>

        <View style={{ height: 8, backgroundColor: COLORS.border, borderRadius: 10, marginBottom: 16 }}>
          <View style={{ width: `${pctAgua}%`, height: 8, backgroundColor: "#3b82f6", borderRadius: 10 }} />
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={removeWater} style={{
            flex: 1, backgroundColor: COLORS.background, padding: 12,
            borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: "center",
          }}>
            <Text style={{ color: COLORS.textSecondary, fontWeight: "600" }}>−250ml</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={addWater} style={{
            flex: 1, backgroundColor: "#3b82f6", padding: 12, borderRadius: 10, alignItems: "center",
          }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>+250ml</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Refeições ── */}
      <View style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
            Refeições
          </Text>
          <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
            {refeicoes.length} registradas
          </Text>
        </View>

        <TouchableOpacity
          onPress={abrirCriarRefeicao}
          style={{
            backgroundColor: COLORS.primary,
            padding: 14,
            borderRadius: 12,
            marginBottom: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>+ Registrar Refeição</Text>
        </TouchableOpacity>

        {refeicoes.length === 0 && (
          <View style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: SPACING.lg,
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.border,
          }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: FONT.md, textAlign: "center" }}>
              Nenhuma refeição registrada hoje.
            </Text>
          </View>
        )}

        {refeicoes.map((meal) => {
          const calRefeicao = meal.alimentos.reduce(
            (acc, f) => acc + f.caloriasP100g * (f.quantidadeEscolhida / 100), 0
          );
          return (
            <View key={meal.id} style={{
              backgroundColor: COLORS.card,
              borderRadius: 14,
              padding: SPACING.lg,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
                    {meal.nome}
                  </Text>
                  <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 2 }}>
                    {meal.horario}  ·  {calRefeicao.toFixed(0)} kcal
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removerRefeicao(meal.id)}
                  style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#ef4444", fontSize: 14 }}>✕</Text>
                </TouchableOpacity>
              </View>

              {meal.alimentos.length > 0 && (
                <View style={{ marginTop: 8, gap: 3 }}>
                  {meal.alimentos.map((item, i) => (
                    <Text key={i} style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
                      • {item.nome} ({item.quantidadeEscolhida}g)  —  {(item.caloriasP100g * item.quantidadeEscolhida / 100).toFixed(0)} kcal
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* ── Histórico ── */}
      <View style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.sm }}>
        <TouchableOpacity
          onPress={async () => {
            const hist = await carregarHistoricoCompleto();
            setHistoricoCompleto(hist);
            setMostrarHistorico((p) => !p);
          }}
          style={{ paddingVertical: 12, alignItems: "center" }}
        >
          <Text style={{ fontWeight: "600", color: COLORS.textSecondary, fontSize: FONT.sm }}>
            {mostrarHistorico ? "Ocultar histórico" : "Ver histórico semanal"}
          </Text>
        </TouchableOpacity>

        {mostrarHistorico && (
          <View style={{ gap: 6 }}>
            {historicoCompleto.filter((item) => item.data !== getHojeString()).length === 0 ? (
              <Text style={{ color: COLORS.textSecondary, textAlign: "center", fontSize: FONT.sm }}>
                Nenhum registro anterior.
              </Text>
            ) : (
              historicoCompleto
                .filter((item) => item.data !== getHojeString())
                .map((item, i) => {
                  const totalCal = (item.refeicoes ?? []).reduce(
                    (acc: number, r: any) =>
                      acc + (r.alimentos ?? []).reduce(
                        (s: number, f: any) => s + (f.caloriasP100g ?? 0) * ((f.quantidadeEscolhida ?? 100) / 100), 0
                      ), 0
                  );
                  return (
                    <View key={i} style={{
                      backgroundColor: COLORS.card,
                      padding: 12,
                      borderRadius: 10,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}>
                      <Text style={{ fontWeight: "600", fontSize: FONT.sm, color: COLORS.text }}>
                        {item.data.split("-").reverse().join("/")}
                      </Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm }}>
                        {totalCal.toFixed(0)} kcal  ·  {item.water ?? 0}ml
                      </Text>
                    </View>
                  );
                })
            )}
          </View>
        )}
      </View>

      {/* ══ MODAL 1: Criar Refeição ══ */}
      <Modal visible={mealModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: 20, maxHeight: "85%" }}>
            <Text style={{ fontSize: FONT.xl, fontWeight: "700", marginBottom: 14 }}>Nova Refeição</Text>

            <TextInput
              value={nomeRefeicao}
              onChangeText={setNomeRefeicao}
              placeholder="Nome (ex: Café da Manhã)"
              placeholderTextColor={COLORS.textSecondary}
              style={{
                borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
                padding: 12, marginBottom: 14, color: COLORS.text,
              }}
            />

            <Text style={{ fontWeight: "600", marginBottom: 6, color: COLORS.text }}>
              Alimentos ({alimentosDaNovaRefeicao.length})
            </Text>

            <ScrollView style={{ maxHeight: 160, marginBottom: 12 }}>
              {alimentosDaNovaRefeicao.length === 0 ? (
                <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm }}>
                  Nenhum alimento adicionado.
                </Text>
              ) : (
                alimentosDaNovaRefeicao.map((item, i) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                    <Text style={{ color: COLORS.text, fontSize: FONT.sm }}>
                      {item.nome} ({item.quantidadeEscolhida}g)
                    </Text>
                    <TouchableOpacity onPress={() =>
                      setAlimentosDaNovaRefeicao((prev) => prev.filter((_, idx) => idx !== i))
                    }>
                      <Text style={{ color: "#ef4444", fontSize: FONT.sm }}>remover</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => { setSearch(""); setFoodModalVisible(true); }}
              style={{ backgroundColor: COLORS.background, padding: 12, borderRadius: 10, marginBottom: 16, alignItems: "center", borderWidth: 1, borderColor: COLORS.border }}
            >
              <Text style={{ fontWeight: "600", color: COLORS.primary }}>+ Adicionar Alimento</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setMealModalVisible(false)} style={{ flex: 1, backgroundColor: COLORS.background, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ textAlign: "center", fontWeight: "600", color: COLORS.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={salvarRefeicao} style={{ flex: 1, backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 }}>
                <Text style={{ textAlign: "center", fontWeight: "700", color: "#fff" }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ MODAL 2: Selecionar Alimento ══ */}
      <Modal visible={foodModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: 20, maxHeight: "80%" }}>

            {!alimentoSelecionado ? (
              <>
                <Text style={{ fontSize: FONT.xl, fontWeight: "700", marginBottom: 12 }}>Selecionar Alimento</Text>

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar alimento..."
                  placeholderTextColor={COLORS.textSecondary}
                  style={{
                    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
                    padding: 10, marginBottom: 12, color: COLORS.text,
                  }}
                />

                {loadingFoods ? (
                  <View style={{ alignItems: "center", paddingVertical: 32, gap: 10 }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ color: COLORS.textSecondary }}>Carregando alimentos...</Text>
                  </View>
                ) : erroBusca ? (
                  <View style={{ alignItems: "center", paddingVertical: 24, gap: 10 }}>
                    <Text style={{ color: "#ef4444", fontWeight: "600" }}>
                      Erro ao carregar alimentos.
                    </Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm, textAlign: "center" }}>
                      Verifique se a API está rodando em {"\n"}http://192.168.1.11:3000
                    </Text>
                    <TouchableOpacity onPress={carregarAlimentos} style={{ backgroundColor: COLORS.primary, padding: 10, borderRadius: 10 }}>
                      <Text style={{ color: "#fff", fontWeight: "600" }}>Tentar novamente</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={foodsFiltrados}
                    keyExtractor={(item) => String(item.id)}
                    style={{ maxHeight: 320 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => setAlimentoSelecionado(item)}
                        style={{
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: COLORS.border,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View>
                          <Text style={{ fontWeight: "600", color: COLORS.text }}>{item.nome}</Text>
                          {item.categoria && (
                            <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, textTransform: "capitalize" }}>
                              {item.categoria.replace(/_/g, " ")}
                            </Text>
                          )}
                        </View>
                        <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: FONT.sm }}>
                          {item.caloriasP100g} kcal/100g
                        </Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <Text style={{ color: COLORS.textSecondary, textAlign: "center", paddingVertical: 20 }}>
                        Nenhum alimento encontrado.
                      </Text>
                    }
                  />
                )}

                <TouchableOpacity
                  onPress={() => setFoodModalVisible(false)}
                  style={{ marginTop: 12, backgroundColor: COLORS.background, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border }}
                >
                  <Text style={{ textAlign: "center", fontWeight: "600", color: COLORS.text }}>Voltar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ fontSize: FONT.xl, fontWeight: "700", marginBottom: 4, color: COLORS.text }}>
                  {alimentoSelecionado.nome}
                </Text>
                <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>
                  {alimentoSelecionado.caloriasP100g} kcal / 100g
                </Text>

                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                  {[
                    { label: "Prot.", valor: alimentoSelecionado.proteina },
                    { label: "Carb.", valor: alimentoSelecionado.carboidrato },
                    { label: "Gord.", valor: alimentoSelecionado.gordura },
                  ].map((m) => (
                    <View key={m.label} style={{ flex: 1, backgroundColor: COLORS.background, borderRadius: 8, padding: 8, alignItems: "center", borderWidth: 1, borderColor: COLORS.border }}>
                      <Text style={{ fontWeight: "700", color: COLORS.text }}>{m.valor}g</Text>
                      <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>{m.label}</Text>
                    </View>
                  ))}
                </View>

                <Text style={{ fontWeight: "600", marginBottom: 8, color: COLORS.text }}>Quantidade (g)</Text>
                <TextInput
                  value={gramas}
                  onChangeText={setGramas}
                  keyboardType="numeric"
                  placeholder="100"
                  style={{
                    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
                    padding: 12, marginBottom: 16, fontWeight: "700", fontSize: 20,
                    textAlign: "center", color: COLORS.text,
                  }}
                />

                {/* Preview de calorias */}
                <View style={{ backgroundColor: "#eff6ff", borderRadius: 10, padding: 10, marginBottom: 16, alignItems: "center" }}>
                  <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                    {((parseFloat(gramas) || 0) * alimentoSelecionado.caloriasP100g / 100).toFixed(0)} kcal para {gramas || "0"}g
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity onPress={() => setAlimentoSelecionado(null)} style={{ flex: 1, backgroundColor: COLORS.background, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border }}>
                    <Text style={{ textAlign: "center", fontWeight: "600", color: COLORS.text }}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmarAlimento} style={{ flex: 1, backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 }}>
                    <Text style={{ textAlign: "center", fontWeight: "700", color: "#fff" }}>Adicionar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
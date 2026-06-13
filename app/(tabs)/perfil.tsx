// app/(tabs)/perfil.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Header from "../../src/components/Header";
import { useAuth } from "../../src/context/AuthContext";
import { atualizarPerfil, logoutUsuario } from "../../src/services/authService";
import { buscarGrupoDoUsuario, buscarMembrosDoGrupo } from "../../src/services/grupoService";
import {
  calcularSequencia,
  caloriasGastasSemana,
  totalTreinosRealizados,
} from "../../src/services/workoutStorage";
import { COLORS, FONT, SPACING } from "../../src/styles/theme";
import { Grupo, TipoExercicio, Usuario } from "../../src/types";

// ─── Constantes ───────────────────────────────────────────────────────────────

const nomesAtividades: Record<TipoExercicio, string> = {
  academia: "Academia",
  corrida:  "Corrida",
  ciclismo: "Ciclismo",
  natacao:  "Natação",
  lutas:    "Lutas",
  danca:    "Dança",
  pilates:  "Pilates",
};

const ATIVIDADES_DISPONIVEIS: TipoExercicio[] = [
  "academia", "corrida", "ciclismo", "natacao", "lutas", "danca", "pilates",
];

// Cálculo automático de meta de água: 35ml/kg, ajustado por sexo
function calcularMetaAgua(peso?: number, sexo?: "masculino" | "feminino"): number {
  if (!peso) return 2000;
  const base = peso * 35;
  return sexo === "feminino" ? Math.round(base * 0.9) : Math.round(base);
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Perfil() {
  const router = useRouter();
  const { usuario, atualizarUsuarioLocal } = useAuth();

  // ── Estatísticas ──
  const [sequencia, setSequencia]         = useState(0);
  const [totalTreinos, setTotalTreinos]   = useState(0);
  const [calSemana, setCalSemana]         = useState(0);

  // ── Grupo ──
  const [grupo, setGrupo]     = useState<Grupo | null>(null);
  const [membros, setMembros] = useState<Usuario[]>([]);

  // ── Modais ──
  const [modalEditar, setModalEditar]     = useState(false);
  const [salvando, setSalvando]           = useState(false);
  const [uploadando, setUploadando]       = useState(false);

  // ── Formulário de edição ──
  const [formNome, setFormNome]               = useState("");
  const [formAltura, setFormAltura]           = useState("");
  const [formPeso, setFormPeso]               = useState("");
  const [formSexo, setFormSexo]               = useState<"masculino" | "feminino">("masculino");
  const [formMensagem, setFormMensagem]       = useState("");
  const [formMetaCalorias, setFormMetaCalorias] = useState("");
  const [formAtividades, setFormAtividades]   = useState<TipoExercicio[]>([]);

  // ─── Carregar dados ao focar ──────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      carregarEstatisticas();
      carregarGrupo();
    }, [usuario])
  );

  async function carregarEstatisticas() {
    const [seq, total, cal] = await Promise.all([
      calcularSequencia(),
      totalTreinosRealizados(),
      caloriasGastasSemana(),
    ]);
    setSequencia(seq);
    setTotalTreinos(total);
    setCalSemana(cal);
  }

  async function carregarGrupo() {
    if (!usuario?.grupoCodigo) { setGrupo(null); setMembros([]); return; }
    try {
      const g = await buscarGrupoDoUsuario(usuario.grupoCodigo);
      setGrupo(g);
      if (g) {
        const m = await buscarMembrosDoGrupo(g.membros);
        setMembros(m);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // ─── Foto de perfil ───────────────────────────────────────────────────────

  async function selecionarFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso à sua galeria para alterar a foto de perfil."
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: false,
    });

    if (resultado.canceled || !resultado.assets?.[0]?.uri) return;

    const uri = resultado.assets[0].uri;
    await salvarFotoLocalmente(uri);
  }

  async function tirarFoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos de acesso à câmera.");
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (resultado.canceled || !resultado.assets?.[0]?.uri) return;

    const uri = resultado.assets[0].uri;
    await salvarFotoLocalmente(uri);
  }

  async function salvarFotoLocalmente(uri: string) {
    if (!usuario) return;
    setUploadando(true);
    try {
      // Salva no AsyncStorage (sem Firebase Storage para não precisar de configuração extra)
      await AsyncStorage.setItem(`@staerk_foto_${usuario.uid}`, uri);

      // Atualiza Firestore com a URI (funciona em desenvolvimento)
      await atualizarPerfil(usuario.uid, { fotoPerfil: uri });

      atualizarUsuarioLocal({ ...usuario, fotoPerfil: uri });
      Alert.alert("Foto atualizada!", "Sua foto de perfil foi salva.");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar a foto.");
      console.error(e);
    } finally {
      setUploadando(false);
    }
  }

  function abrirOpcoesFoto() {
    Alert.alert("Foto de Perfil", "Escolha uma opção", [
      { text: "Galeria de fotos", onPress: selecionarFoto },
      { text: "Tirar foto",       onPress: tirarFoto },
      ...(usuario?.fotoPerfil ? [{ text: "Remover foto", style: "destructive" as const, onPress: removerFoto }] : []),
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  async function removerFoto() {
    if (!usuario) return;
    try {
      await AsyncStorage.removeItem(`@staerk_foto_${usuario.uid}`);
      await atualizarPerfil(usuario.uid, { fotoPerfil: undefined });
      atualizarUsuarioLocal({ ...usuario, fotoPerfil: undefined });
    } catch (e) {
      console.error(e);
    }
  }

  // ─── Modal de edição ──────────────────────────────────────────────────────

  function abrirEditar() {
    setFormNome(usuario?.nome ?? "");
    setFormAltura(usuario?.altura ? String(usuario.altura) : "");
    setFormPeso(usuario?.peso ? String(usuario.peso) : "");
    setFormSexo(usuario?.sexo ?? "masculino");
    setFormMensagem(usuario?.messagemPessoal ?? "");
    setFormMetaCalorias(usuario?.metaCalorias ? String(usuario.metaCalorias) : "");
    setFormAtividades((usuario?.atividadesFavoritas as TipoExercicio[]) ?? []);
    setModalEditar(true);
  }

  async function salvarEdicao() {
    if (!usuario?.uid) return;
    if (!formNome.trim()) { Alert.alert("Atenção", "O nome é obrigatório."); return; }

    setSalvando(true);
    try {
      const pesoNum  = formPeso   ? Number(formPeso)   : undefined;
      const alturaNum = formAltura ? Number(formAltura) : undefined;
      const metaCal  = formMetaCalorias ? Number(formMetaCalorias) : undefined;
      const metaAgua = calcularMetaAgua(pesoNum, formSexo);

      const dados: Partial<Usuario> = {
        nome:               formNome.trim(),
        altura:             alturaNum,
        peso:               pesoNum,
        sexo:               formSexo,
        messagemPessoal:    formMensagem.trim() || undefined,
        metaCalorias:       metaCal,
        metaAgua:           metaAgua,
        atividadesFavoritas: formAtividades,
      };

      await atualizarPerfil(usuario.uid, dados);
      atualizarUsuarioLocal({ ...usuario, ...dados });
      setModalEditar(false);
      Alert.alert("Salvo!", "Perfil atualizado com sucesso.");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleLogout() {
  Alert.alert("Sair", "Tem certeza que deseja sair?", [
    { text: "Cancelar", style: "cancel" },
    {
      text: "Sair",
      style: "destructive",
      onPress: async () => {
        try {
          await logoutUsuario();
          router.replace("/login");
        } catch {
          Alert.alert("Erro", "Não foi possível sair.");
        }
      },
    },
  ]);
}

  function formatarMembro(dataISO?: string) {
    if (!dataISO) return "Recente";
    
    const d = new Date(dataISO);
    
    // Pega o mês curto (ex: "jun.") e tira o ponto, se houver
    const mes = d.toLocaleDateString("pt-BR", { month: "short" }).replace('.', '');
    
    // Pega o ano em 2 dígitos (ex: "26")
    const ano = d.toLocaleDateString("pt-BR", { year: "2-digit" });
    
    // Deixa a primeira letra do mês maiúscula (ex: "Jun")
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
    
    return `${mesCapitalizado} ${ano}`;
  }

  function iniciais(nome: string) {
    return nome.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  }

  const metaAguaExibida = usuario?.metaAgua ?? calcularMetaAgua(usuario?.peso, usuario?.sexo);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ paddingBottom: 40 }}>
        <Header
          name={usuario?.nome ?? "Usuário"}
          subtitle={`Desde ${formatarMembro(usuario?.criadoEm)}`}
        />

        {/* ── Avatar + Foto ── */}
        <View style={{ alignItems: "center", marginTop: -40, marginBottom: SPACING.lg }}>
          <TouchableOpacity onPress={abrirOpcoesFoto} disabled={uploadando} activeOpacity={0.85}>
            <View style={{
              width: 88, height: 88, borderRadius: 44,
              backgroundColor: COLORS.primary,
              alignItems: "center", justifyContent: "center",
              borderWidth: 4, borderColor: COLORS.card,
              shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
              overflow: "hidden",
            }}>
              {uploadando ? (
                <ActivityIndicator color="#fff" />
              ) : usuario?.fotoPerfil ? (
                <Image
                  source={{ uri: usuario.fotoPerfil }}
                  style={{ width: 88, height: 88, borderRadius: 44 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 28 }}>
                  {iniciais(usuario?.nome ?? "U")}
                </Text>
              )}
            </View>

            {/* Ícone de câmera */}
            <View style={{
              position: "absolute", bottom: 2, right: 2,
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: COLORS.primary,
              alignItems: "center", justifyContent: "center",
              borderWidth: 2, borderColor: COLORS.card,
            }}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={{ fontWeight: "700", fontSize: FONT.xl, color: COLORS.text, marginTop: 10 }}>
            {usuario?.nome ?? "Usuário"}
          </Text>
          {usuario?.messagemPessoal && (
            <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: "center", marginTop: 4, paddingHorizontal: 32 }}>
              "{usuario.messagemPessoal}"
            </Text>
          )}
        </View>

        {/* ── Estatísticas ── */}
        <View style={{
          flexDirection: "row",
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.lg,
          gap: 10,
        }}>
          {[
            { label: "Sequência", valor: `${sequencia}d`,       icon: "flame-outline" as const,         cor: "#f97316" },
            { label: "Treinos",   valor: String(totalTreinos),  icon: "barbell-outline" as const,       cor: COLORS.primary },
            { label: "kcal/sem",  valor: String(calSemana),     icon: "trending-up-outline" as const,   cor: "#22c55e" },
          ].map((item) => (
            <View key={item.label} style={{
              flex: 1, backgroundColor: COLORS.card, borderRadius: 14,
              padding: SPACING.md, alignItems: "center", gap: 4,
              borderWidth: 1, borderColor: COLORS.border,
            }}>
              <Ionicons name={item.icon} size={18} color={item.cor} />
              <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}>{item.valor}</Text>
              <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Informações Pessoais ── */}
        <View style={{
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.lg,
          backgroundColor: COLORS.card,
          borderRadius: 16,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: COLORS.border,
          gap: 10,
        }}>
          <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text, marginBottom: 4 }}>
            Informações Pessoais
          </Text>

          {[
            { label: "Altura",  valor: usuario?.altura  ? `${usuario.altura} cm`  : "—" },
            { label: "Peso",    valor: usuario?.peso    ? `${usuario.peso} kg`    : "—" },
            { label: "Sexo",    valor: usuario?.sexo    ? (usuario.sexo === "masculino" ? "Masculino" : "Feminino") : "—" },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: FONT.md }}>{item.label}</Text>
              <Text style={{ color: COLORS.text, fontWeight: "600", fontSize: FONT.md }}>{item.valor}</Text>
            </View>
          ))}
        </View>

        {/* ── Metas Diárias ── */}
        <View style={{
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.lg,
          backgroundColor: COLORS.card,
          borderRadius: 16,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: COLORS.border,
          gap: 10,
        }}>
          <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text, marginBottom: 4 }}>
            Metas Diárias
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: FONT.md }}>Calorias</Text>
            <Text style={{ color: COLORS.text, fontWeight: "600", fontSize: FONT.md }}>
              {usuario?.metaCalorias ? `${usuario.metaCalorias} kcal` : "Não definida"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: COLORS.textSecondary, fontSize: FONT.md }}>Hidratação</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm }}>
                Calculada pelo sistema
              </Text>
            </View>
            <Text style={{ color: COLORS.text, fontWeight: "600", fontSize: FONT.md }}>
              {metaAguaExibida >= 1000
                ? `${(metaAguaExibida / 1000).toFixed(1)}L`
                : `${metaAguaExibida}ml`}
            </Text>
          </View>

          {(usuario?.peso || usuario?.sexo) && (
            <View style={{
              backgroundColor: "#eff6ff",
              borderRadius: 8,
              padding: 8,
            }}>
              <Text style={{ color: COLORS.primary, fontSize: FONT.sm }}>
                Meta de água calculada com base no seu peso e sexo (35ml/kg).
                {usuario?.sexo === "feminino" ? " Ajuste feminino aplicado (−10%)." : ""}
              </Text>
            </View>
          )}
        </View>

        {/* ── Meu Grupo ── */}
        <View style={{
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.lg,
          backgroundColor: COLORS.card,
          borderRadius: 16,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}>
          <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text, marginBottom: 12 }}>
            Meu Grupo
          </Text>

          {!grupo ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: COLORS.textSecondary }}>
                Você não faz parte de nenhum grupo ainda.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/grupo" as any)}
                style={{ backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Criar ou Entrar em um Grupo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {/* Nome e código */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>{grupo.nome}</Text>
                  <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
                    Código: <Text style={{ fontWeight: "700", color: COLORS.primary }}>{grupo.codigo}</Text>
                  </Text>
                </View>
                <View style={{
                  backgroundColor: "#eff6ff",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#bfdbfe",
                }}>
                  <Text style={{ color: COLORS.primary, fontSize: FONT.sm, fontWeight: "600" }}>
                    {membros.length}/6 membros
                  </Text>
                </View>
              </View>

              {/* Membros */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {membros.map((membro) => (
                  <View key={membro.uid} style={{ alignItems: "center", gap: 4 }}>
                    <View style={{
                      width: 48, height: 48, borderRadius: 24,
                      backgroundColor: membro.uid === usuario?.uid ? COLORS.primary : "#e0e7ff",
                      alignItems: "center", justifyContent: "center",
                      overflow: "hidden",
                    }}>
                      {membro.fotoPerfil ? (
                        <Image
                          source={{ uri: membro.fotoPerfil }}
                          style={{ width: 48, height: 48 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{
                          color: membro.uid === usuario?.uid ? "#fff" : COLORS.primary,
                          fontWeight: "700", fontSize: FONT.sm,
                        }}>
                          {iniciais(membro.nome ?? "U")}
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
                      {membro.nome.split(" ")[0]}
                      {membro.uid === usuario?.uid ? " (você)" : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Atividades Favoritas ── */}
        {usuario?.atividadesFavoritas && usuario.atividadesFavoritas.length > 0 && (
          <View style={{
            marginHorizontal: SPACING.lg,
            marginBottom: SPACING.lg,
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}>
            <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text, marginBottom: 12 }}>
              Atividades Favoritas
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {usuario.atividadesFavoritas.map((at) => (
                <View key={at} style={{
                  backgroundColor: "#eff6ff",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#bfdbfe",
                }}>
                  <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: FONT.sm }}>
                    {nomesAtividades[at as TipoExercicio] ?? at}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Ações ── */}
        <View style={{
          marginHorizontal: SPACING.lg,
          backgroundColor: COLORS.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: COLORS.border,
          overflow: "hidden",
        }}>
          <TouchableOpacity
            onPress={abrirEditar}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="person-outline" size={18} color={COLORS.primary} />
              <View>
                <Text style={{ fontWeight: "600", color: COLORS.text, fontSize: FONT.md }}>Editar Perfil</Text>
                <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
                  Dados pessoais, metas e atividades
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={abrirOpcoesFoto}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
              <View>
                <Text style={{ fontWeight: "600", color: COLORS.text, fontSize: FONT.md }}>Foto de Perfil</Text>
                <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
                  {usuario?.fotoPerfil ? "Alterar ou remover foto" : "Adicionar foto"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: SPACING.lg }}
          >
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={{ fontWeight: "600", color: "#ef4444", fontSize: FONT.md }}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ══ MODAL DE EDIÇÃO ══ */}
      <Modal visible={modalEditar} transparent animationType="fade" onRequestClose={() => setModalEditar(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: SPACING.lg }}>
          <View style={{
            backgroundColor: COLORS.card,
            borderRadius: 24,
            width: "100%",
            maxHeight: "90%",
            overflow: "hidden",
          }}>
            {/* Header */}
            <View style={{
              flexDirection: "row", justifyContent: "space-between", alignItems: "center",
              padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
            }}>
              <Text style={{ fontSize: FONT.xl, fontWeight: "700", color: COLORS.text }}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setModalEditar(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: SPACING.lg, gap: 14 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Nome */}
              <View>
                <Text style={S.label}>Nome *</Text>
                <TextInput value={formNome} onChangeText={setFormNome}
                  placeholder="Seu nome" placeholderTextColor={COLORS.textSecondary} style={S.input} />
              </View>

              {/* Altura + Peso */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={S.label}>Altura (cm)</Text>
                  <TextInput value={formAltura} onChangeText={setFormAltura}
                    placeholder="175" keyboardType="numeric" placeholderTextColor={COLORS.textSecondary} style={S.input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.label}>Peso (kg)</Text>
                  <TextInput value={formPeso} onChangeText={setFormPeso}
                    placeholder="70" keyboardType="numeric" placeholderTextColor={COLORS.textSecondary} style={S.input} />
                </View>
              </View>

              {/* Sexo */}
              <View>
                <Text style={S.label}>Sexo</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {(["masculino", "feminino"] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setFormSexo(s)}
                      style={[S.chip, formSexo === s && S.chipAtivo, { flex: 1 }]}
                    >
                      <Text style={[S.chipText, formSexo === s && S.chipTextAtivo]}>
                        {s === "masculino" ? "Masculino" : "Feminino"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Meta de calorias */}
              <View>
                <Text style={S.label}>Meta de calorias diária (kcal)</Text>
                <TextInput
                  value={formMetaCalorias}
                  onChangeText={setFormMetaCalorias}
                  placeholder="Ex: 2000"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textSecondary}
                  style={S.input}
                />
              </View>

              {/* Preview meta água */}
              {(formPeso || formSexo) && (
                <View style={{
                  backgroundColor: "#eff6ff",
                  borderRadius: 10,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: "#bfdbfe",
                }}>
                  <Text style={{ color: COLORS.primary, fontSize: FONT.sm }}>
                    Meta de água calculada automaticamente:{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {(() => {
                        const ml = calcularMetaAgua(
                          formPeso ? Number(formPeso) : undefined,
                          formSexo
                        );
                        return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
                      })()}
                    </Text>
                    {" "}(35ml/kg{formSexo === "feminino" ? ", ajuste feminino" : ""})
                  </Text>
                </View>
              )}

              {/* Mensagem pessoal */}
              <View>
                <Text style={S.label}>Mensagem pessoal (visível ao grupo)</Text>
                <TextInput
                  value={formMensagem}
                  onChangeText={setFormMensagem}
                  placeholder='Ex: "Focado em hipertrofia esse semestre!"'
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  maxLength={100}
                  style={[S.input, { minHeight: 70, textAlignVertical: "top" }]}
                />
                <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: "right" }}>
                  {formMensagem.length}/100
                </Text>
              </View>

              {/* Atividades favoritas */}
              <View>
                <Text style={S.label}>Atividades Favoritas</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {ATIVIDADES_DISPONIVEIS.map((at) => {
                    const sel = formAtividades.includes(at);
                    return (
                      <TouchableOpacity
                        key={at}
                        onPress={() =>
                          setFormAtividades((prev) =>
                            sel ? prev.filter((a) => a !== at) : [...prev, at]
                          )
                        }
                        style={[S.chip, sel && S.chipAtivo]}
                      >
                        <Text style={[S.chipText, sel && S.chipTextAtivo]}>
                          {nomesAtividades[at]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Botões */}
              <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setModalEditar(false)}
                  style={[S.btn, { flex: 1, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border }]}
                >
                  <Text style={{ color: COLORS.text, fontWeight: "600" }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={salvarEdicao}
                  disabled={salvando}
                  style={[S.btn, { flex: 2, backgroundColor: salvando ? "#93c5fd" : COLORS.primary }]}
                >
                  {salvando
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ color: "#fff", fontWeight: "700" }}>Salvar</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Estilos locais ───────────────────────────────────────────────────────────

const S = {
  label: {
    fontSize: FONT.sm,
    fontWeight: "600" as const,
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    fontSize: FONT.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  chipAtivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    fontWeight: "500" as const,
  },
  chipTextAtivo: {
    color: "#fff",
    fontWeight: "600" as const,
  },
  btn: {
    height: 48,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};
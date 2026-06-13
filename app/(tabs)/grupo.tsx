// app/(tabs)/grupo.tsx

import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
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
import {
  buscarGrupoDoUsuario,
  buscarMembrosDoGrupo,
  criarGrupo,
  entrarNoGrupo,
} from "../../src/services/grupoService";
import {
  buscarPostsDoGrupo,
  comentarPost,
  criarPost,
  curtirPost,
} from "../../src/services/postService";
import { COLORS, FONT, SPACING } from "../../src/styles/theme";
import { Grupo, Post, TipoExercicio, Usuario } from "../../src/types";

// ─── Constantes ───────────────────────────────────────────────────────────────

const ATIVIDADES: TipoExercicio[] = [
  "academia", "corrida", "ciclismo", "natacao", "lutas", "danca", "pilates",
];

const nomesAtividades: Record<TipoExercicio, string> = {
  academia: "Academia",
  corrida:  "Corrida",
  ciclismo: "Ciclismo",
  natacao:  "Natação",
  lutas:    "Lutas",
  danca:    "Dança",
  pilates:  "Pilates",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function iniciais(nome: string) {
  return nome.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function GrupoScreen() {
  const { usuario, atualizarUsuarioLocal } = useAuth();

  const [grupo, setGrupo]       = useState<Grupo | null>(null);
  const [membros, setMembros]   = useState<Usuario[]>([]);
  const [posts, setPosts]       = useState<Post[]>([]);
  const [carregando, setCarregando] = useState(true);

  // ── Modais ──
  const [perfilModal, setPerfilModal]         = useState<Usuario | null>(null);
  const [postModal, setPostModal]             = useState(false);
  const [comentarioModal, setComentarioModal] = useState<Post | null>(null);
  const [modalCriar, setModalCriar]           = useState(false);
  const [modalEntrar, setModalEntrar]         = useState(false);

  // ── Forms ──
  const [textoPost, setTextoPost]           = useState("");
  const [tipoAtividade, setTipoAtividade]   = useState<TipoExercicio>("academia");
  const [textoComentario, setTextoComentario] = useState("");
  const [nomeGrupo, setNomeGrupo]           = useState("");
  const [codigoEntrar, setCodigoEntrar]     = useState("");

  // ── Loading individual ──
  const [publicando, setPublicando]         = useState(false);

  // ─── Carregar dados ──────────────────────────────────────────────────────

  async function carregarTudo() {
    setCarregando(true);
    try {
      if (!usuario?.grupoCodigo) {
        setGrupo(null); setMembros([]); setPosts([]);
        return;
      }

      const g = await buscarGrupoDoUsuario(usuario.grupoCodigo);
      if (!g) { setGrupo(null); return; }

      setGrupo(g);

      const [m, feed] = await Promise.all([
        buscarMembrosDoGrupo(g.membros),
        buscarPostsDoGrupo(g.id),
      ]);

      setMembros(m);
      setPosts(feed);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(useCallback(() => { carregarTudo(); }, [usuario]));

  // ─── Ações ────────────────────────────────────────────────────────────────

  async function copiarCodigo() {
    if (!grupo?.codigo) return;
    await Clipboard.setStringAsync(grupo.codigo);
    Alert.alert("Copiado!", "Código do grupo copiado.");
  }

  async function publicarPost() {
    if (!grupo || !usuario) return;
    if (!textoPost.trim()) { Alert.alert("Atenção", "Digite uma mensagem."); return; }
    if (textoPost.length > 300) { Alert.alert("Limite", "Máximo de 300 caracteres."); return; }

    setPublicando(true);
    try {
      await criarPost(grupo.id, usuario.uid, usuario.nome, textoPost, tipoAtividade, usuario.fotoPerfil);
      setTextoPost(""); setTipoAtividade("academia");
      setPostModal(false);
      await carregarTudo();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível publicar.");
    } finally {
      setPublicando(false);
    }
  }

  async function handleCurtir(post: Post) {
    if (!usuario) return;
    const jaCurtiu = post.curtidas.includes(usuario.uid);
    await curtirPost(post.id, usuario.uid, jaCurtiu);
    await carregarTudo();
  }

  async function enviarComentario() {
    if (!usuario || !comentarioModal || !textoComentario.trim()) return;
    try {
      await comentarPost(comentarioModal.id, usuario.uid, usuario.nome, textoComentario.trim());
      setTextoComentario(""); setComentarioModal(null);
      await carregarTudo();
    } catch {
      Alert.alert("Erro", "Não foi possível comentar.");
    }
  }

  async function handleCriarGrupo() {
    if (!usuario) return;
    if (!nomeGrupo.trim()) { Alert.alert("Atenção", "Digite um nome para o grupo."); return; }
    try {
      const g = await criarGrupo(nomeGrupo.trim(), usuario.uid);
      atualizarUsuarioLocal({ ...usuario, grupoCodigo: g.codigo, grupoId: g.id });
      setModalCriar(false); setNomeGrupo("");
      Alert.alert("Grupo criado!", `Código: ${g.codigo}`);
    } catch {
      Alert.alert("Erro", "Não foi possível criar o grupo.");
    }
  }

  async function handleEntrarGrupo() {
    if (!usuario) return;
    try {
      const g = await entrarNoGrupo(codigoEntrar.trim(), usuario.uid);
      atualizarUsuarioLocal({ ...usuario, grupoCodigo: g.codigo, grupoId: g.id });
      setModalEntrar(false); setCodigoEntrar("");
      Alert.alert("Entrou!", `Bem-vindo ao grupo ${g.nome}.`);
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ─── Sem grupo ────────────────────────────────────────────────────────────

  if (!grupo) {
    return (
      <>
        <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
          <Header name={usuario?.nome ?? "Usuário"} subtitle="Seu grupo" />

          <View style={{ margin: SPACING.lg, backgroundColor: COLORS.card, padding: SPACING.lg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <View style={{ alignItems: "center", marginBottom: SPACING.lg }}>
              <Ionicons name="people-outline" size={48} color={COLORS.border} />
              <Text style={{ fontSize: FONT.xl, fontWeight: "700", color: COLORS.text, marginTop: 12 }}>
                Nenhum grupo
              </Text>
              <Text style={{ color: COLORS.textSecondary, textAlign: "center", marginTop: 6 }}>
                Crie um grupo privado ou entre com um código para compartilhar treinos com amigos.
              </Text>
            </View>

            <TouchableOpacity onPress={() => setModalCriar(true)} style={{ backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, marginBottom: 10 }}>
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>Criar Grupo</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalEntrar(true)} style={{ borderWidth: 1, borderColor: COLORS.primary, padding: 14, borderRadius: 12 }}>
              <Text style={{ textAlign: "center", color: COLORS.primary, fontWeight: "700" }}>Entrar com Código</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modais de criar/entrar */}
        <ModalCriarGrupo />
        <ModalEntrarGrupo />
      </>
    );
  }

  // ─── Com grupo ────────────────────────────────────────────────────────────

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ paddingBottom: 40 }}>
        <Header name={usuario?.nome ?? "Usuário"} subtitle="Seu grupo" />

        {/* Card do grupo */}
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
          {/* Nome + código */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <View>
              <Text style={{ fontSize: FONT.xl, fontWeight: "700", color: COLORS.text }}>{grupo.nome}</Text>
              <TouchableOpacity onPress={copiarCodigo} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm }}>
                  Código: <Text style={{ fontWeight: "700", color: COLORS.primary }}>{grupo.codigo}</Text>
                </Text>
                <Ionicons name="copy-outline" size={13} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={{
              backgroundColor: "#eff6ff", paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 20, borderWidth: 1, borderColor: "#bfdbfe",
            }}>
              <Text style={{ color: COLORS.primary, fontSize: FONT.sm, fontWeight: "600" }}>
                {membros.length}/6
              </Text>
            </View>
          </View>

          {/* Avatares dos membros */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {membros.map((membro) => (
              <TouchableOpacity key={membro.uid} onPress={() => setPerfilModal(membro)}>
                <View style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: membro.uid === usuario?.uid ? COLORS.primary : "#e0e7ff",
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 2,
                  borderColor: membro.uid === usuario?.uid ? COLORS.primary : COLORS.border,
                  overflow: "hidden",
                }}>
                  {membro.fotoPerfil ? (
                    <Image source={{ uri: membro.fotoPerfil }} style={{ width: 52, height: 52 }} resizeMode="cover" />
                  ) : (
                    <Text style={{ color: membro.uid === usuario?.uid ? "#fff" : COLORS.primary, fontWeight: "700", fontSize: FONT.sm }}>
                      {iniciais(membro.nome ?? "U")}
                    </Text>
                  )}
                </View>
                <Text style={{ marginTop: 4, textAlign: "center", fontSize: FONT.sm, color: COLORS.textSecondary }}>
                  {membro.nome.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão compartilhar treino */}
        <View style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
          <TouchableOpacity
            onPress={() => setPostModal(true)}
            style={{
              backgroundColor: COLORS.primary,
              padding: 14,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="share-social-outline" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: FONT.lg }}>
              Compartilhar Treino
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feed */}
        <View style={{ marginTop: SPACING.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
            <Text style={{ fontWeight: "700", fontSize: FONT.lg, color: COLORS.text }}>
              Feed do Grupo
            </Text>
            <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
              Últimas 24h
            </Text>
          </View>

          {posts.length === 0 ? (
            <View style={{
              marginHorizontal: SPACING.lg,
              backgroundColor: COLORS.card,
              borderRadius: 14,
              padding: SPACING.xl,
              alignItems: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}>
              <Ionicons name="chatbubbles-outline" size={36} color={COLORS.border} />
              <Text style={{ color: COLORS.textSecondary, textAlign: "center" }}>
                Nenhum treino compartilhado nas últimas 24h.
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm, textAlign: "center" }}>
                Seja o primeiro a motivar o grupo!
              </Text>
            </View>
          ) : (
            posts.map((post) => (
              <View key={post.id} style={{
                marginHorizontal: SPACING.lg,
                marginBottom: SPACING.md,
                backgroundColor: COLORS.card,
                borderRadius: 16,
                padding: SPACING.lg,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}>
                {/* Autor */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: COLORS.primary,
                    alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {post.autorFoto ? (
                      <Image source={{ uri: post.autorFoto }} style={{ width: 36, height: 36 }} resizeMode="cover" />
                    ) : (
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: FONT.sm }}>
                        {iniciais(post.autorNome)}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", color: COLORS.text, fontSize: FONT.md }}>{post.autorNome}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 }}>
                      <View style={{
                        backgroundColor: "#eff6ff",
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: "#bfdbfe",
                      }}>
                        <Text style={{ color: COLORS.primary, fontSize: FONT.sm, fontWeight: "600", textTransform: "capitalize" }}>
                          {nomesAtividades[post.tipoAtividade] ?? post.tipoAtividade}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
                    {(() => {
                      const diff = Date.now() - new Date(post.criadoEm).getTime();
                      const m = Math.floor(diff / 60000);
                      if (m < 1) return "agora";
                      if (m < 60) return `${m}min`;
                      return `${Math.floor(m / 60)}h`;
                    })()}
                  </Text>
                </View>

                {/* Texto */}
                <Text style={{ color: COLORS.text, fontSize: FONT.md, lineHeight: 20, marginBottom: 10 }}>
                  {post.texto}
                </Text>

                {/* Ações */}
                <View style={{ flexDirection: "row", gap: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => handleCurtir(post)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                  >
                    <Ionicons
                      name={post.curtidas.includes(usuario?.uid ?? "") ? "heart" : "heart-outline"}
                      size={17}
                      color={post.curtidas.includes(usuario?.uid ?? "") ? "#ef4444" : COLORS.textSecondary}
                    />
                    <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm }}>{post.curtidas.length}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setComentarioModal(post)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm }}>{post.comentarios.length}</Text>
                  </TouchableOpacity>
                </View>

                {/* Comentários */}
                {post.comentarios.length > 0 && (
                  <View style={{ marginTop: 10, gap: 6 }}>
                    {[...post.comentarios]
                      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
                      .map((c, i) => (
                        <View key={i} style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 8 }}>
                          <Text style={{ fontWeight: "700", fontSize: FONT.sm, color: COLORS.text }}>{c.autorNome}</Text>
                          <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 2 }}>{c.texto}</Text>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ══ Modal: Perfil do membro ══ */}
      <Modal visible={!!perfilModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.55)", padding: 20 }}>
          <View style={{ backgroundColor: COLORS.card, borderRadius: 20, width: "100%", overflow: "hidden" }}>
            {/* Header colorido */}
            <View style={{ backgroundColor: "#eff6ff", padding: SPACING.lg, alignItems: "center", gap: 8 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 3, borderColor: "#fff" }}>
                {perfilModal?.fotoPerfil ? (
                  <Image source={{ uri: perfilModal.fotoPerfil }} style={{ width: 72, height: 72 }} resizeMode="cover" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 28 }}>
                    {iniciais(perfilModal?.nome ?? "U")}
                  </Text>
                )}
              </View>
              <Text style={{ fontWeight: "800", fontSize: 20, color: COLORS.text }}>{perfilModal?.nome}</Text>
              {perfilModal?.messagemPessoal && (
                <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: "center", fontStyle: "italic" }}>
                  "{perfilModal.messagemPessoal}"
                </Text>
              )}
            </View>

            {/* Informações */}
            <View style={{ padding: SPACING.lg, gap: 10 }}>
              {[
                { label: "Altura",  valor: perfilModal?.altura ? `${perfilModal.altura} cm` : "—" },
                { label: "Peso",    valor: perfilModal?.peso   ? `${perfilModal.peso} kg`   : "—" },
                { label: "Sexo",    valor: perfilModal?.sexo   ? (perfilModal.sexo === "masculino" ? "Masculino" : "Feminino") : "—" },
                {
                  label: "Atividades",
                  valor: perfilModal?.atividadesFavoritas?.length
                    ? perfilModal.atividadesFavoritas.map((a) => nomesAtividades[a as TipoExercicio] ?? a).join(", ")
                    : "—",
                },
              ].map((item) => (
                <View key={item.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONT.md }}>{item.label}</Text>
                  <Text style={{ color: COLORS.text, fontWeight: "600", fontSize: FONT.md, flex: 1, textAlign: "right" }}>
                    {item.valor}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => setPerfilModal(null)}
                style={{ backgroundColor: COLORS.primary, padding: 12, borderRadius: 12, alignItems: "center", marginTop: 8 }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ Modal: Novo Post ══ */}
      <Modal visible={postModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)", padding: 20 }}>
          <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: SPACING.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ fontWeight: "700", fontSize: FONT.xl, color: COLORS.text }}>
                Compartilhar Treino
              </Text>
              <TouchableOpacity onPress={() => setPostModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tipo de atividade */}
            <Text style={{ fontSize: FONT.sm, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Atividade
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {ATIVIDADES.map((at) => (
                  <TouchableOpacity
                    key={at}
                    onPress={() => setTipoAtividade(at)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: tipoAtividade === at ? COLORS.primary : COLORS.background,
                      borderWidth: 1,
                      borderColor: tipoAtividade === at ? COLORS.primary : COLORS.border,
                    }}
                  >
                    <Text style={{
                      color: tipoAtividade === at ? "#fff" : COLORS.text,
                      fontWeight: tipoAtividade === at ? "600" : "400",
                      fontSize: FONT.sm,
                    }}>
                      {nomesAtividades[at]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Texto */}
            <Text style={{ fontSize: FONT.sm, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Mensagem ({textoPost.length}/300)
            </Text>
            <TextInput
              value={textoPost}
              onChangeText={setTextoPost}
              placeholder="Como foi seu treino hoje?"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={300}
              style={{
                borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
                minHeight: 100, padding: 12, marginBottom: 16,
                textAlignVertical: "top", color: COLORS.text, fontSize: FONT.md,
              }}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setPostModal(false)}
                style={{ flex: 1, backgroundColor: COLORS.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border }}
              >
                <Text style={{ textAlign: "center", fontWeight: "600", color: COLORS.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={publicarPost}
                disabled={publicando}
                style={{ flex: 2, backgroundColor: publicando ? "#93c5fd" : COLORS.primary, padding: 12, borderRadius: 12 }}
              >
                {publicando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ textAlign: "center", fontWeight: "700", color: "#fff" }}>Publicar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ Modal: Comentário ══ */}
      <Modal visible={!!comentarioModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)", padding: 20 }}>
          <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: SPACING.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontWeight: "700", fontSize: FONT.xl, color: COLORS.text }}>Comentar</Text>
              <TouchableOpacity onPress={() => { setComentarioModal(null); setTextoComentario(""); }}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={textoComentario}
              onChangeText={setTextoComentario}
              placeholder="Escreva um comentário... (máx. 100 caracteres)"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={100}
              style={{
                borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
                padding: 12, marginBottom: 12, color: COLORS.text,
              }}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setComentarioModal(null); setTextoComentario(""); }}
                style={{ flex: 1, backgroundColor: COLORS.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border }}
              >
                <Text style={{ textAlign: "center", fontWeight: "600", color: COLORS.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={enviarComentario}
                style={{ flex: 2, backgroundColor: COLORS.primary, padding: 12, borderRadius: 12 }}
              >
                <Text style={{ textAlign: "center", fontWeight: "700", color: "#fff" }}>Comentar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modais de criar/entrar */}
      <ModalCriarGrupo />
      <ModalEntrarGrupo />
    </>
  );

  // ─── Sub-modais ──────────────────────────────────────────────────────────

  function ModalCriarGrupo() {
    return (
      <Modal visible={modalCriar} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)", padding: 20 }}>
          <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: SPACING.lg }}>
            <Text style={{ fontWeight: "700", fontSize: FONT.xl, marginBottom: 14, color: COLORS.text }}>Criar Grupo</Text>
            <TextInput
              value={nomeGrupo}
              onChangeText={setNomeGrupo}
              placeholder="Nome do grupo"
              placeholderTextColor={COLORS.textSecondary}
              style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 16, color: COLORS.text }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setModalCriar(false)} style={{ flex: 1, backgroundColor: COLORS.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ textAlign: "center", fontWeight: "600", color: COLORS.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCriarGrupo} style={{ flex: 2, backgroundColor: COLORS.primary, padding: 12, borderRadius: 12 }}>
                <Text style={{ textAlign: "center", fontWeight: "700", color: "#fff" }}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function ModalEntrarGrupo() {
    return (
      <Modal visible={modalEntrar} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)", padding: 20 }}>
          <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: SPACING.lg }}>
            <Text style={{ fontWeight: "700", fontSize: FONT.xl, marginBottom: 14, color: COLORS.text }}>Entrar em Grupo</Text>
            <TextInput
              value={codigoEntrar}
              onChangeText={setCodigoEntrar}
              placeholder="Código de 6 caracteres"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="characters"
              style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 16, color: COLORS.text }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setModalEntrar(false)} style={{ flex: 1, backgroundColor: COLORS.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ textAlign: "center", fontWeight: "600", color: COLORS.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEntrarGrupo} style={{ flex: 2, backgroundColor: COLORS.primary, padding: 12, borderRadius: 12 }}>
                <Text style={{ textAlign: "center", fontWeight: "700", color: "#fff" }}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}
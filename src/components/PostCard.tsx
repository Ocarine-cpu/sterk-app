// src/components/PostCard.tsx
// Compatível com o tipo Post do Firestore (src/types/index.ts)

import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS, FONT, SPACING } from "../styles/theme";
import { Post } from "../types";

// Formata a data ISO para exibição relativa simples
function formatarData(isoString: string): string {
  try {
    const data = new Date(isoString);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1)   return "agora";
    if (diffMin < 60)  return `${diffMin}min atrás`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)    return `${diffH}h atrás`;
    return data.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

// Gera as iniciais do nome para o avatar
function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PostCard({ post }: { post: Post }) {
  const numCurtidas   = Array.isArray(post.curtidas)   ? post.curtidas.length   : 0;
  const numComentarios = Array.isArray(post.comentarios) ? post.comentarios.length : 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>

        {/* Avatar com iniciais */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciais(post.autorNome)}</Text>
        </View>

        <View style={{ flex: 1 }}>

          {/* Header do post */}
          <View style={styles.header}>
            <Text style={styles.user}>{post.autorNome}</Text>
            <Text style={styles.time}>{formatarData(post.criadoEm)}</Text>
          </View>

          {/* Tipo de atividade */}
          <View style={styles.badgeWrap}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{post.tipoAtividade}</Text>
            </View>
          </View>

          {/* Texto do post */}
          <Text style={styles.caption}>{post.texto}</Text>

          {/* Ações */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.action}>
              <Ionicons name="heart-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.actionText}>{numCurtidas}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.action}>
              <Ionicons name="chatbubble-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.actionText}>{numComentarios}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: FONT.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  user: {
    fontWeight: "700",
    fontSize: FONT.md,
    color: COLORS.text,
  },
  time: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
  },
  badgeWrap: {
    flexDirection: "row",
    marginBottom: 6,
  },
  badge: {
    backgroundColor: "#eff6ff",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  badgeText: {
    fontSize: FONT.sm,
    color: COLORS.primary,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  caption: {
    fontSize: FONT.md,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.lg,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: FONT.md,
    color: COLORS.textSecondary,
  },
});

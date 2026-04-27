import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, FONT, SPACING } from "../styles/theme";
import { Post } from "../types/Post";

export default function PostCard({ post }: { post: Post }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.avatar}</Text>
        </View>

        <View style={{ flex: 1 }}>
          
          <View style={styles.header}>
            <Text style={styles.user}>{post.user}</Text>
            <Text style={styles.time}>{post.timestamp}</Text>
          </View>

          <Text style={styles.caption}>{post.caption}</Text>

          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{post.activity}</Text>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>{post.duration}</Text>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>{post.calories} kcal</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.action}>
              <Ionicons name="heart-outline" size={16} color="#999" />
              <Text style={styles.actionText}>{post.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.action}>
              <Ionicons name="chatbubble-outline" size={16} color="#999" />
              <Text style={styles.actionText}>{post.comments}</Text>
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
    elevation: 3,
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
  },

  avatarText: {
    color: "#fff",
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },

  user: {
    fontWeight: "700",
    fontSize: FONT.lg,
    color: COLORS.text,
  },

  time: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
  },

  caption: {
    fontSize: FONT.lg,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  badges: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },

  badge: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },

  badgeText: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
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
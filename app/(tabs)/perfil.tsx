import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Header from "../../src/components/Header";
import { COLORS, FONT, SPACING } from "../../src/styles/theme";

export default function Profile() {
  const userStats = {
    name: "Davi",
    memberSince: "Janeiro 2024",
    streak: 12,
    totalWorkouts: 45,
    totalCalories: 85000,
  };

  return (
    <ScrollView style={{ backgroundColor: COLORS.background }}>

      {/* HEADER PADRÃO */}
      <Header
        name={userStats.name}
        subtitle={`Membro desde ${userStats.memberSince}`}
      />

      {/* STATS */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: -SPACING.xl,
        paddingHorizontal: SPACING.lg
      }}>
        {[
          { label: "Dias", value: userStats.streak },
          { label: "Treinos", value: userStats.totalWorkouts },
          { label: "Calorias", value: `${Math.round(userStats.totalCalories / 1000)}k` }
        ].map((item, index) => (
          <View key={index} style={{
            flex: 1,
            backgroundColor: COLORS.card,
            padding: SPACING.md,
            marginHorizontal: 4,
            borderRadius: 12
          }}>
            <Text style={{
              fontSize: FONT.xl,
              fontWeight: "700",
              color: COLORS.text,
              textAlign: "center"
            }}>
              {item.value}
            </Text>

            <Text style={{
              fontSize: FONT.sm,
              color: COLORS.textSecondary,
              textAlign: "center"
            }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* ATIVIDADE */}
      <View style={{
        margin: SPACING.lg,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: SPACING.lg
      }}>
        <Text style={{ fontWeight: "700", marginBottom: 10 }}>
          Atividade Recente
        </Text>

        {["Hoje", "Ontem", "2 dias atrás"].map((item, index) => (
          <View key={index} style={{
            flexDirection: "row",
            marginBottom: 10
          }}>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: COLORS.primary,
              marginTop: 6,
              marginRight: 8
            }} />

            <View>
              <Text>Treino feito</Text>
              <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
                {item}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* FAVORITOS */}
      <View style={{
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: SPACING.lg
      }}>
        <Text style={{ fontWeight: "700", marginBottom: 10 }}>
          Atividades Favoritas
        </Text>

        {["Musculação", "Corrida", "Muay Thai"].map((item, index) => (
          <View key={index} style={{
            padding: SPACING.sm,
            backgroundColor: COLORS.background,
            borderRadius: 10,
            marginBottom: 6
          }}>
            <Text>{item}</Text>
          </View>
        ))}
      </View>

      {/* CONFIG */}
      <View style={{
        margin: SPACING.lg,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: SPACING.lg
      }}>
        {["Editar Perfil", "Metas e Objetivos", "Notificações"].map((item, index) => (
          <TouchableOpacity key={index} style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: "500" }}>{item}</Text>
            <Text style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
              Configurar
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity>
          <Text style={{ color: "red", marginTop: 10 }}>
            Sair
          </Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}
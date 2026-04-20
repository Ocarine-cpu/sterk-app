import {
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import Header from "../../src/components/Header";
import { COLORS, FONT, SPACING } from "../../src/styles/theme";

export default function Workouts() {

  const workouts = [
    {
      id: 1,
      name: "Treino A - Peito",
      duration: "45 min",
      day: "Segunda",
      exercises: 8,
      completed: true,
    },
    {
      id: 2,
      name: "Treino B - Costas",
      duration: "50 min",
      day: "Quarta",
      exercises: 9,
      completed: false,
    },
    {
      id: 3,
      name: "Treino C - Pernas",
      duration: "60 min",
      day: "Sexta",
      exercises: 7,
      completed: false,
    },
  ];

  return (
    <ScrollView style={{ backgroundColor: COLORS.background }}>

      <Header
        name="Davi"
        subtitle="Organize sua rotina semanal"
      />

      <TouchableOpacity style={{
        margin: SPACING.lg,
        backgroundColor: COLORS.primary,
        padding: 14,
        borderRadius: 12,
        alignItems: "center"
      }}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          + Criar Treino
        </Text>
      </TouchableOpacity>

      <View style={{ marginHorizontal: SPACING.lg, gap: 12 }}>
        {workouts.map((workout) => (
          <View
            key={workout.id}
            style={{
              backgroundColor: COLORS.card,
              padding: SPACING.lg,
              borderRadius: 16
            }}
          >
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <Text style={{
                fontSize: FONT.lg,
                fontWeight: "700",
                color: COLORS.text
              }}>
                {workout.name}
              </Text>

              {workout.completed && (
                <Text style={{
                  color: COLORS.primary,
                  fontSize: FONT.sm,
                  fontWeight: "600"
                }}>
                  Concluído
                </Text>
              )}
            </View>

            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 8
            }}>
              <Text style={{ color: COLORS.textSecondary }}>
                ⏱ {workout.duration}
              </Text>

              <Text style={{ color: COLORS.textSecondary }}>
                📅 {workout.day}
              </Text>
            </View>

            <Text style={{
              marginTop: 4,
              color: COLORS.textSecondary
            }}>
              {workout.exercises} exercícios
            </Text>

            <TouchableOpacity style={{
              marginTop: 12,
              backgroundColor: COLORS.primary,
              padding: 10,
              borderRadius: 10
            }}>
              <Text style={{
                color: "#fff",
                textAlign: "center",
                fontWeight: "600"
              }}>
                Iniciar Treino
              </Text>
            </TouchableOpacity>

          </View>
        ))}
      </View>

    </ScrollView>
  );
}
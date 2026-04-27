import { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import Header from "../../src/components/Header";
import { COLORS, FONT, SPACING } from "../../src/styles/theme";

export default function Nutrition() {

  const [water, setWater] = useState(1800);
  const waterGoal = 3000;

  const addWater = () => {
    setWater((prev) => Math.min(prev + 250, waterGoal));
  };

  const calories = {
    consumed: 1850,
    burned: 450,
    goal: 2500,
  };

  const netCalories = calories.consumed - calories.burned;
  const caloriePercent = (netCalories / calories.goal) * 100;
  const waterPercent = (water / waterGoal) * 100;

  const meals = [
    {
      id: 1,
      name: "Café da Manhã",
      time: "07:30",
      foods: ["Ovos", "Aveia", "Banana"],
      calories: 450,
    },
    {
      id: 2,
      name: "Almoço",
      time: "12:30",
      foods: ["Arroz", "Frango", "Salada"],
      calories: 650,
    },
  ];

  return (
    <ScrollView style={{ backgroundColor: COLORS.background }}>

      <Header
        name="Davi"
        subtitle="Acompanhe sua alimentação e hidratação"
      />

      {/* CALORIAS */}
      <View style={{
        margin: SPACING.lg,
        padding: SPACING.lg,
        backgroundColor: COLORS.card,
        borderRadius: 16
      }}>
        <Text style={{
          fontSize: FONT.lg,
          fontWeight: "700",
          marginBottom: 10
        }}>
          Consumo de Calorias
        </Text>

        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Text style={{
            fontSize: 32,
            fontWeight: "700",
            color: COLORS.primary
          }}>
            {netCalories}
          </Text>

          <Text style={{ color: COLORS.textSecondary }}>
            de {calories.goal} kcal
          </Text>
        </View>

        <View style={{
          height: 6,
          backgroundColor: COLORS.border,
          borderRadius: 4
        }}>
          <View style={{
            width: `${caloriePercent}%`,
            height: "100%",
            backgroundColor: COLORS.primary,
            borderRadius: 4
          }} />
        </View>
      </View>

      {/* HIDRATAÇÃO */}
      <View style={{
        marginHorizontal: SPACING.lg,
        padding: SPACING.lg,
        backgroundColor: COLORS.card,
        borderRadius: 16
      }}>
        <Text style={{ fontSize: FONT.lg, fontWeight: "700" }}>
          Hidratação
        </Text>

        <Text style={{ color: COLORS.textSecondary }}>
          {water}ml / {waterGoal}ml
        </Text>

        <View style={{
          height: 6,
          backgroundColor: COLORS.border,
          borderRadius: 4,
          marginTop: 10
        }}>
          <View style={{
            width: `${waterPercent}%`,
            height: "100%",
            backgroundColor: COLORS.primary
          }} />
        </View>

        <TouchableOpacity
          onPress={addWater}
          style={{
            marginTop: 10,
            backgroundColor: COLORS.primary,
            padding: 10,
            borderRadius: 10
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            +250ml
          </Text>
        </TouchableOpacity>
      </View>

      {/* REFEIÇÕES */}
      <View style={{ margin: SPACING.lg }}>
        <Text style={{ fontSize: FONT.lg, fontWeight: "700" }}>
          Refeições
        </Text>

        {meals.map((meal) => (
          <View key={meal.id} style={{
            marginTop: 10,
            padding: SPACING.md,
            backgroundColor: COLORS.card,
            borderRadius: 12
          }}>
            <Text style={{ fontWeight: "700" }}>
              {meal.name} ({meal.time})
            </Text>

            <Text style={{
              color: COLORS.textSecondary,
              marginTop: 4
            }}>
              {meal.foods.join(" • ")}
            </Text>

            <Text style={{
              marginTop: 4,
              fontWeight: "600",
              color: COLORS.textSecondary
            }}>
              {meal.calories} kcal
            </Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}
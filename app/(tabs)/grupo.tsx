import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

import Header from "../../src/components/Header";
import { COLORS, FONT, SPACING } from "../../src/styles/theme";

export default function Grupo() {
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const MAX_MEMBERS = 6;

  const group = {
    name: "Treino Pesado 💪",
    members: [
      { id: 1, name: "Davi", initial: "DV", color: "#4f46e5", workouts: 5 },
      { id: 2, name: "Richard", initial: "RD", color: "#7c3aed", workouts: 3 },
      { id: 3, name: "Vitor", initial: "VT", color: "#22c55e", workouts: 4 },
    ]
  };

  const remainingSlots = MAX_MEMBERS - group.members.length;

  const openModal = (user: any) => {
    setSelectedUser(user);
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setSelectedUser(null));
  };

  useEffect(() => {
    if (selectedUser) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedUser]);

  const ranking = [...group.members].sort(
    (a, b) => b.workouts - a.workouts
  );

  return (
    <>
      <ScrollView style={{ backgroundColor: COLORS.background }}>

        {/* HEADER PADRÃO */}
        <Header
          name="Davi"
          subtitle="Seu grupo de treino"
        />

        {/* CARD DO GRUPO */}
        <View style={{
          margin: SPACING.lg,
          padding: SPACING.lg,
          borderRadius: 16,
          backgroundColor: COLORS.card,
        }}>
          <Text style={{
            fontSize: FONT.lg,
            fontWeight: "700",
            color: COLORS.text
          }}>
            {group.name}
          </Text>

          <Text style={{
            color: COLORS.textSecondary,
            marginBottom: 12
          }}>
            {group.members.length}/{MAX_MEMBERS} membros
          </Text>

          {/* MEMBROS */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            {group.members.map((member) => (
              <TouchableOpacity
                key={member.id}
                onPress={() => openModal(member)}
                style={{ alignItems: "center" }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: member.color,
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {member.initial}
                  </Text>
                </View>

                <Text style={{
                  fontSize: FONT.sm,
                  color: COLORS.text
                }}>
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}

            {/* ADICIONAR */}
            {group.members.length < MAX_MEMBERS && (
              <TouchableOpacity style={{ alignItems: "center" }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: COLORS.border,
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Text style={{ fontSize: 20 }}>+</Text>
                </View>

                <Text style={{
                  fontSize: FONT.sm,
                  color: COLORS.textSecondary
                }}>
                  Adicionar
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* AVISO SUAVE */}
          <Text style={{
            marginTop: 12,
            fontSize: FONT.sm,
            color: COLORS.primary,
            backgroundColor: "#eef2ff",
            padding: 10,
            borderRadius: 10
          }}>
            {remainingSlots > 0
              ? `Você ainda pode adicionar ${remainingSlots} pessoa(s)`
              : "Grupo completo 🚀"}
          </Text>
        </View>

        {/* ESTATÍSTICAS */}
        <View style={{
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.md,
          backgroundColor: COLORS.card,
          borderRadius: 16,
          padding: SPACING.lg,
        }}>
          <Text style={{
            fontWeight: "700",
            marginBottom: 10,
            color: COLORS.text
          }}>
            Estatísticas do Grupo
          </Text>

          <Text style={{ color: COLORS.textSecondary }}>
            Total de treinos: {group.members.reduce((acc, m) => acc + m.workouts, 0)}
          </Text>

          <Text style={{ color: COLORS.textSecondary }}>
            Média por membro: {(group.members.reduce((acc, m) => acc + m.workouts, 0) / group.members.length).toFixed(1)}
          </Text>
        </View>

        {/* RANKING */}
        <View style={{
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.xl,
          backgroundColor: COLORS.card,
          borderRadius: 16,
          padding: SPACING.lg,
        }}>
          <Text style={{
            fontWeight: "700",
            marginBottom: 10,
            color: COLORS.text
          }}>
            Ranking da Semana
          </Text>

          {ranking.map((member, index) => (
            <View key={member.id} style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 6
            }}>
              <Text style={{ color: COLORS.text }}>
                {index + 1}º - {member.name}
              </Text>
              <Text style={{ color: COLORS.textSecondary }}>
                {member.workouts} treinos
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* MODAL */}
      <Modal visible={!!selectedUser} transparent animationType="none">
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            opacity: opacityAnim
          }}>
            <TouchableWithoutFeedback>
              <Animated.View style={{
                width: "85%",
                backgroundColor: COLORS.card,
                borderRadius: 20,
                padding: SPACING.lg,
                transform: [{ scale: scaleAnim }]
              }}>

                {/* FECHAR */}
                <TouchableOpacity
                  onPress={closeModal}
                  style={{ position: "absolute", right: 15, top: 15 }}
                >
                  <Text style={{ fontSize: 18 }}>✕</Text>
                </TouchableOpacity>

                {selectedUser && (
                  <>
                    <View style={{ alignItems: "center", marginBottom: 16 }}>
                      <View style={{
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        backgroundColor: selectedUser.color,
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Text style={{ color: "#fff", fontSize: 22 }}>
                          {selectedUser.initial}
                        </Text>
                      </View>

                      <Text style={{
                        fontSize: 18,
                        fontWeight: "700",
                        marginTop: 8,
                        color: COLORS.text
                      }}>
                        {selectedUser.name}
                      </Text>

                      <Text style={{
                        fontSize: 12,
                        color: COLORS.textSecondary
                      }}>
                        Membro do grupo
                      </Text>
                    </View>

                    <TouchableOpacity style={{
                      backgroundColor: COLORS.primary,
                      padding: 12,
                      borderRadius: 10
                    }}>
                      <Text style={{
                        color: "#fff",
                        textAlign: "center"
                      }}>
                        Ver treinos
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
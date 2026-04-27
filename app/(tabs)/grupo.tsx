import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../src/components/Header";
import { COLORS, FONT, SPACING } from "../../src/styles/theme";

type Participante = {
  nome: string;
  turno: string;
  turma: string;
  unidade: string;
  grupo: string;
};

export default function Grupo() {
  const [selecionado, setSelecionado] = useState<Participante | null>(null);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const participantes: Participante[] = [
    {
      nome: "Richard soares",
      turno: "Noite",
      turma: "ADS0301N",
      unidade: "CG1",
      grupo: "Grupo Onze",
    },
    {
      nome: "Davi amaro",
      turno: "Noite",
      turma: "ADS0301N",
      unidade: "CG1",
      grupo: "Grupo Onze",
    },
    {
      nome: "Vitor rodrigues",
      turno: "Noite",
      turma: "ADS0301N",
      unidade: "CG1",
      grupo: "Grupo Onze",
    },
  ];

  useEffect(() => {
    if (selecionado) {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selecionado]);

  function getIniciais(nome: string) {
    return nome
      .split(" ")
      .map((parte) => parte[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function fecharModal() {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelecionado(null);
    });
  }

  return (
    <ScrollView style={{ backgroundColor: COLORS.background }}>
      <Header name="Grupo Onze" subtitle="Participantes do projeto" />

      <View
        style={{
          margin: SPACING.lg,
          backgroundColor: COLORS.card,
          borderRadius: 18,
          padding: SPACING.lg,
        }}
      >
        <Text
          style={{
            fontSize: FONT.lg,
            fontWeight: "700",
            color: COLORS.text,
            marginBottom: 8,
          }}
        >
          Integrantes
        </Text>

        <Text
          style={{
            color: COLORS.textSecondary,
            marginBottom: SPACING.lg,
          }}
        >
          Toque em um participante para ver as informações.
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          {participantes.map((pessoa, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelecionado(pessoa)}
              activeOpacity={0.75}
              style={{ alignItems: "center", flex: 1 }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: COLORS.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 22,
                    fontWeight: "800",
                  }}
                >
                  {getIniciais(pessoa.nome)}
                </Text>
              </View>

              <Text
                style={{
                  color: COLORS.text,
                  fontSize: FONT.sm,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                {pessoa.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal
        visible={selecionado !== null}
        transparent
        animationType="none"
        onRequestClose={fecharModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Animated.View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 18,
              padding: SPACING.lg,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <Text
              style={{
                color: COLORS.text,
                fontSize: FONT.xl,
                fontWeight: "800",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {selecionado?.nome}
            </Text>

            <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>
              Turno: {selecionado?.turno}
            </Text>

            <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>
              Turma: {selecionado?.turma}
            </Text>

            <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>
              Unidade: {selecionado?.unidade}
            </Text>

            <Text style={{ color: COLORS.textSecondary, marginBottom: 16 }}>
              Grupo: {selecionado?.grupo}
            </Text>

            <TouchableOpacity
              onPress={fecharModal}
              activeOpacity={0.8}
              style={{
                backgroundColor: COLORS.primary,
                paddingVertical: 14,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Fechar
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

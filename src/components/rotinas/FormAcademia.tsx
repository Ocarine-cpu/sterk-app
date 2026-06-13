// src/components/rotinas/FormAcademia.tsx

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  DadosAcademia,
  ExercicioAcademia,
} from "../../types";

import ModalSelecionarExercicio from "./ModalSelecionarExercicio";

interface Props {
  dados: DadosAcademia;
  onChange: (dados: DadosAcademia) => void;
  focos?: string[]; // Adicionado conforme solicitado
}

export default function FormAcademia({
  dados,
  onChange,
  focos = [], // Desestruturado com valor padrão
}: Props) {
  const [modalVisible, setModalVisible] =
    useState(false);

  function adicionarExercicio(
    exercicio: ExercicioAcademia
  ) {
    onChange({
      ...dados,
      exercicios: [
        ...dados.exercicios,
        exercicio,
      ],
    });

    setModalVisible(false);
  }

  function removerExercicio(index: number) {
    const novaLista =
      dados.exercicios.filter(
        (_, i) => i !== index
      );

    onChange({
      ...dados,
      exercicios: novaLista,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Exercícios
      </Text>

      {dados.exercicios.length === 0 && (
        <Text style={styles.semExercicios}>
          Nenhum exercício adicionado.
        </Text>
      )}

      {dados.exercicios.map(
        (exercicio, index) => (
          <View
            key={`${exercicio.nome}-${index}`}
            style={styles.card}
          >
            <View style={styles.info}>
              <Text style={styles.nome}>
                {exercicio.nome}
              </Text>

              {!!exercicio.grupoMuscular && (
                <Text style={styles.grupo}>
                  {exercicio.grupoMuscular}
                </Text>
              )}

              <Text style={styles.series}>
                {exercicio.series} séries •{" "}
                {exercicio.repeticoes} reps
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                removerExercicio(index)
              }
            >
              <Text style={styles.remover}>
                Remover
              </Text>
            </TouchableOpacity>
          </View>
        )
      )}

      <TouchableOpacity
        style={styles.botao}
        onPress={() =>
          setModalVisible(true)
        }
      >
        <Text style={styles.botaoTexto}>
          + Adicionar Exercício
        </Text>
      </TouchableOpacity>

      <ModalSelecionarExercicio
        visible={modalVisible}
        focos={focos} 
        onClose={() =>
          setModalVisible(false)
        }
        onSelect={adicionarExercicio}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },

  titulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  semExercicios: {
    color: "#666",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  info: {
    flex: 1,
  },

  nome: {
    fontSize: 16,
    fontWeight: "700",
  },

  grupo: {
    marginTop: 2,
    color: "#666",
  },

  series: {
    marginTop: 4,
    color: "#444",
  },

  remover: {
    color: "#ef4444",
    fontWeight: "700",
  },

  botao: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },

  botaoTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
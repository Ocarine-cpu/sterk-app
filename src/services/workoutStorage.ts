// src/services/workoutStorage.ts
// Armazena histórico de treinos concluídos no AsyncStorage.
// Usado para: estatísticas do perfil, calorias gastas, sequência de dias.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { TreinoConcluido } from "../types";

const STORAGE_KEY = "@staerk_workout_history";

function getHojeString(): string {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// ─── Salvar treino concluído ──────────────────────────────────────────────────
export async function salvarTreinoConcluido(
  treino: Omit<TreinoConcluido, "id" | "concluidoEm" | "data">
): Promise<TreinoConcluido> {
  const historico = await carregarHistoricoTreinos();

  const novo: TreinoConcluido = {
    ...treino,
    id: `treino_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    data: getHojeString(),
    concluidoEm: new Date().toISOString(),
  };

  historico.unshift(novo);

  // Mantém apenas 90 dias
  const cortado = historico.slice(0, 90);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cortado));

  return novo;
}

// ─── Carregar todo o histórico ────────────────────────────────────────────────
export async function carregarHistoricoTreinos(): Promise<TreinoConcluido[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ─── Treinos de hoje ──────────────────────────────────────────────────────────
export async function carregarTreinosHoje(): Promise<TreinoConcluido[]> {
  const historico = await carregarHistoricoTreinos();
  const hoje = getHojeString();
  return historico.filter((t) => t.data === hoje);
}

// ─── Total de calorias gastas hoje ───────────────────────────────────────────
export async function caloriasGastasHoje(): Promise<number> {
  const treinos = await carregarTreinosHoje();
  return treinos.reduce((acc, t) => acc + (t.caloriasGastas ?? 0), 0);
}

// ─── Total de calorias gastas na semana ──────────────────────────────────────
export async function caloriasGastasSemana(): Promise<number> {
  const historico = await carregarHistoricoTreinos();
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
  return historico
    .filter((t) => new Date(t.concluidoEm) >= seteDiasAtras)
    .reduce((acc, t) => acc + (t.caloriasGastas ?? 0), 0);
}

// ─── Total de treinos realizados ─────────────────────────────────────────────
export async function totalTreinosRealizados(): Promise<number> {
  const historico = await carregarHistoricoTreinos();
  return historico.length;
}

// ─── Sequência atual de dias consecutivos ────────────────────────────────────
export async function calcularSequencia(): Promise<number> {
  const historico = await carregarHistoricoTreinos();
  if (historico.length === 0) return 0;

  // Pega datas únicas ordenadas decrescentemente
  const datasUnicas = [...new Set(historico.map((t) => t.data))].sort(
    (a, b) => b.localeCompare(a)
  );

  const hoje = getHojeString();
  let sequencia = 0;
  let dataEsperada = hoje;

  for (const data of datasUnicas) {
    if (data === dataEsperada) {
      sequencia++;
      // Subtrai 1 dia
      const d = new Date(data + "T12:00:00");
      d.setDate(d.getDate() - 1);
      dataEsperada = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }

  return sequencia;
}
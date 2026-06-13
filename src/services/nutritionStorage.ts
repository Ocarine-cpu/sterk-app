// src/services/nutritionStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@staerk_nutrition_history";

export function getHojeString() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`; // Retorna a data local exata: YYYY-MM-DD
}

export async function carregarHistoricoCompleto() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log("Erro ao carregar histórico:", error);
    return [];
  }
}

export async function carregarRegistroHoje() {
  const historico = await carregarHistoricoCompleto();
  const hoje = getHojeString();
  
  const registroHoje = historico.find((item: any) => item.data === hoje);
  
  if (!registroHoje) {
    return {
      data: hoje,
      water: 0,
      refeicoes: [] 
    };
  }
  
  return registroHoje;
}

export async function salvarRegistroHoje(dadosHoje: any) {
  try {
    const historico = await carregarHistoricoCompleto();
    const hoje = getHojeString();

    // Filtra tirando o dia de hoje antigo e adiciona o atualizado no topo
    let historicoAtualizado = historico.filter((item: any) => item.data !== hoje);
    historicoAtualizado.unshift(dadosHoje);

    // Mantém apenas os últimos 7 dias no histórico
    if (historicoAtualizado.length > 7) {
      historicoAtualizado = historicoAtualizado.slice(0, 7);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(historicoAtualizado));
  } catch (error) {
    console.log("Erro ao salvar no histórico:", error);
  }
}

// FUNÇÃO AUXILIAR PARA LIMPAR FANTASMAS DE TESTE
export async function resetarBancoLocalTotalmente() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.log(e);
  }
}
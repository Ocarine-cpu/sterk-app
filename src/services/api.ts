// src/services/api.ts

const BASE_URL = "https://staerk-api-production.up.railway.app";

// ==================== POSTS ====================

export async function getPosts() {
  const response = await fetch(`${BASE_URL}/posts`);

  if (!response.ok) {
    throw new Error("Erro ao buscar posts");
  }

  return response.json();
}

// ==================== ALIMENTOS ====================

export async function getFoods() {
  const response = await fetch(`${BASE_URL}/foods`);

  if (!response.ok) {
    throw new Error("Erro ao buscar alimentos");
  }

  const data = await response.json();

  // A API retorna { foods: [...] } mas às vezes pode vir sem a chave
  return data.foods ?? data ?? [];
}

// ==================== EXERCÍCIOS ====================

export async function getExercises() {
  const response = await fetch(`${BASE_URL}/exercises`);

  if (!response.ok) {
    throw new Error("Erro ao buscar exercícios");
  }

  const data = await response.json();

  return data.exercises ?? [];
}

export async function getExercisesByMuscle(
  grupoMuscular: string
) {
  const response = await fetch(
    `${BASE_URL}/exercises?grupoMuscular=${encodeURIComponent(
      grupoMuscular
    )}`
  );

  // A API retorna 404 quando nenhum exercício é encontrado para o filtro.
  // Nesse caso tratamos como lista vazia em vez de lançar erro.
  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error("Erro ao buscar exercícios");
  }

  const data = await response.json();

  return data.exercises ?? [];
}

export async function getExerciseById(
  id: number
) {
  const response = await fetch(
    `${BASE_URL}/exercises/${id}`
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar exercício");
  }

  return response.json();
}

// ==================== ROTINAS PRONTAS ====================

export async function getRoutines() {
  const response = await fetch(
    `${BASE_URL}/routines`
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar rotinas");
  }

  return response.json();
}

// ==================== ATIVIDADES ====================

export async function getActivities() {
  const response = await fetch(
    `${BASE_URL}/activities`
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar atividades");
  }

  return response.json();
}

// ==================== HIDRATAÇÃO ====================

export async function calcularHidratacao(
  peso: number
) {
  const response = await fetch(
    `${BASE_URL}/hydration/calculate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        peso,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao calcular hidratação");
  }

  return response.json();
}

// ==================== CALORIAS ====================

export async function calcularCalorias(
  atividade: string,
  tempoMinutos: number,
  pesoKg: number,
  distanciaKm?: number
) {
  const response = await fetch(
    `${BASE_URL}/calories/calculate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        atividade,
        tempoMinutos,
        pesoKg,
        distanciaKm,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao calcular calorias");
  }

  return response.json();
}
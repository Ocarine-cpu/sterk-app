const EXERCISE_DB_URL = "https://exercisedb.p.rapidapi.com";

const EXERCISE_DB_HEADERS = {
  "X-RapidAPI-Key": "0c3adf7d38msh2d848fed8b9d652p15cfdbjsn1758045423bb'",
  "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
};

export async function buscarExercicios() {
  const resposta = await fetch(`${EXERCISE_DB_URL}/exercises?limit=20`, {
    method: "GET",
    headers: EXERCISE_DB_HEADERS,
  });

  if (!resposta.ok) {
    throw new Error("Erro ao buscar exercícios");
  }

  return resposta.json();
}

export async function buscarExerciciosPorMusculo(musculo: string) {
  const resposta = await fetch(
    `${EXERCISE_DB_URL}/exercises/target/${musculo}`,
    {
      method: "GET",
      headers: EXERCISE_DB_HEADERS,
    },
  );

  if (!resposta.ok) {
    throw new Error("Erro ao buscar exercícios por músculo");
  }

  return resposta.json();
}

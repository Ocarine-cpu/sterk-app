const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org";

export async function buscarAlimentos(nome: string) {
  const resposta = await fetch(
    `${OPEN_FOOD_FACTS_URL}/cgi/search.pl?search_terms=${nome}&search_simple=1&action=process&json=1`,
  );

  if (!resposta.ok) {
    throw new Error("Erro ao buscar alimentos");
  }

  return resposta.json();
}

import { useState } from "react";

import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function nutricao() {
  const [buscaAlimento, setBuscaAlimento] = useState("");
  const [alimentos, setAlimentos] = useState<any[]>([]);
  const [carregandoAlimentos, setCarregandoAlimentos] = useState(false);

  const [quantidades, setQuantidades] = useState<{ [key: string]: string }>({});
  const [refeicao, setRefeicao] = useState<any[]>([]);

  async function pesquisarAlimento() {
    if (!buscaAlimento.trim()) return;

    setCarregandoAlimentos(true);

    try {
      const resposta = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${buscaAlimento}&search_simple=1&action=process&json=1`,
      );

      const dados = await resposta.json();
      setAlimentos(dados.products || []);
    } catch (error) {
      console.log("Erro ao buscar alimentos:", error);
    } finally {
      setCarregandoAlimentos(false);
    }
  }

  function adicionarAlimento(item: any, index: number) {
    const chave = String(item.code || index);
    const quantidade = Number(quantidades[chave]);

    if (!quantidade || quantidade <= 0) {
      alert("Digite a quantidade em gramas.");
      return;
    }

    const calorias100g = Number(item.nutriments?.["energy-kcal_100g"]) || 0;
    const proteinas100g = Number(item.nutriments?.proteins_100g) || 0;
    const carbo100g = Number(item.nutriments?.carbohydrates_100g) || 0;
    const gorduras100g = Number(item.nutriments?.fat_100g) || 0;

    const alimentoCalculado = {
      id: Date.now(),
      nome: item.product_name || "Nome não informado",
      quantidade,
      calorias: (calorias100g * quantidade) / 100,
      proteinas: (proteinas100g * quantidade) / 100,
      carboidratos: (carbo100g * quantidade) / 100,
      gorduras: (gorduras100g * quantidade) / 100,
    };

    setRefeicao((listaAtual) => [...listaAtual, alimentoCalculado]);
  }

  function removerAlimento(id: number) {
    setRefeicao((listaAtual) => listaAtual.filter((item) => item.id !== id));
  }

  const totalCalorias = refeicao.reduce(
    (total, item) => total + item.calorias,
    0,
  );
  const totalProteinas = refeicao.reduce(
    (total, item) => total + item.proteinas,
    0,
  );
  const totalCarboidratos = refeicao.reduce(
    (total, item) => total + item.carboidratos,
    0,
  );
  const totalGorduras = refeicao.reduce(
    (total, item) => total + item.gorduras,
    0,
  );

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "#0B0F14",
      }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 40,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 8,
        }}
      >
        Dieta
      </Text>

      <Text
        style={{
          color: "#AAB2C0",
          fontSize: 15,
          marginBottom: 20,
        }}
      >
        Pesquise alimentos, informe a quantidade consumida e monte sua refeição.
      </Text>

      <View
        style={{
          backgroundColor: "#151B23",
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "#273140",
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 12,
          }}
        >
          Buscar alimento
        </Text>

        <TextInput
          placeholder="Ex: pão, ovo, arroz"
          placeholderTextColor="#7C8797"
          value={buscaAlimento}
          onChangeText={setBuscaAlimento}
          style={{
            backgroundColor: "#0B0F14",
            color: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#354052",
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
          }}
        />

        <TouchableOpacity
          onPress={pesquisarAlimento}
          style={{
            backgroundColor: "#2F80ED",
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            Buscar
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          backgroundColor: "#151B23",
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "#273140",
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 12,
          }}
        >
          Total da refeição
        </Text>

        <Text style={{ color: "#DDE3EC", marginBottom: 4 }}>
          Calorias: {totalCalorias.toFixed(1)} kcal
        </Text>

        <Text style={{ color: "#DDE3EC", marginBottom: 4 }}>
          Proteínas: {totalProteinas.toFixed(1)} g
        </Text>

        <Text style={{ color: "#DDE3EC", marginBottom: 4 }}>
          Carboidratos: {totalCarboidratos.toFixed(1)} g
        </Text>

        <Text style={{ color: "#DDE3EC" }}>
          Gorduras: {totalGorduras.toFixed(1)} g
        </Text>
      </View>

      {refeicao.length > 0 && (
        <View
          style={{
            backgroundColor: "#151B23",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#273140",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            Alimentos adicionados
          </Text>

          {refeicao.map((item) => (
            <View
              key={item.id}
              style={{
                borderTopWidth: 1,
                borderTopColor: "#273140",
                paddingTop: 10,
                marginTop: 10,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                {item.nome}
              </Text>

              <Text style={{ color: "#DDE3EC" }}>
                Quantidade: {item.quantidade} g
              </Text>

              <Text style={{ color: "#DDE3EC" }}>
                Calorias: {item.calorias.toFixed(1)} kcal
              </Text>

              <TouchableOpacity
                onPress={() => removerAlimento(item.id)}
                style={{
                  backgroundColor: "#D64545",
                  padding: 8,
                  borderRadius: 8,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                  Remover
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {carregandoAlimentos && (
        <View style={{ marginTop: 20, alignItems: "center" }}>
          <ActivityIndicator size="large" />
          <Text
            style={{
              color: "#AAB2C0",
              marginTop: 10,
            }}
          >
            Buscando alimentos...
          </Text>
        </View>
      )}

      {!carregandoAlimentos &&
        alimentos.map((item, index) => {
          const chave = String(item.code || index);

          return (
            <View
              key={chave}
              style={{
                backgroundColor: "#151B23",
                marginBottom: 16,
                padding: 15,
                borderWidth: 1,
                borderColor: "#273140",
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 10,
                }}
              >
                {item.product_name || "Nome não informado"}
              </Text>

              {item.image_url && (
                <Image
                  source={{ uri: item.image_url }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 10,
                    marginBottom: 12,
                  }}
                />
              )}

              <Text style={{ color: "#DDE3EC", marginBottom: 4 }}>
                Calorias por 100g:{" "}
                {item.nutriments?.["energy-kcal_100g"] || "N/A"} kcal
              </Text>

              <Text style={{ color: "#DDE3EC", marginBottom: 4 }}>
                Proteínas por 100g: {item.nutriments?.proteins_100g || "N/A"} g
              </Text>

              <TextInput
                placeholder="Quantidade em gramas"
                placeholderTextColor="#7C8797"
                keyboardType="numeric"
                value={quantidades[chave] || ""}
                onChangeText={(texto) =>
                  setQuantidades((atual) => ({
                    ...atual,
                    [chave]: texto,
                  }))
                }
                style={{
                  backgroundColor: "#0B0F14",
                  color: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#354052",
                  padding: 10,
                  borderRadius: 10,
                  marginTop: 10,
                  marginBottom: 10,
                }}
              />

              <TouchableOpacity
                onPress={() => adicionarAlimento(item, index)}
                style={{
                  backgroundColor: "#27AE60",
                  padding: 12,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "bold",
                  }}
                >
                  Adicionar à refeição
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

      {!carregandoAlimentos && alimentos.length === 0 && (
        <Text
          style={{
            color: "#7C8797",
            textAlign: "center",
            marginTop: 20,
          }}
        >
          Pesquise um alimento para montar sua refeição.
        </Text>
      )}
    </ScrollView>
  );
}

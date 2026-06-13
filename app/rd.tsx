import { StyleSheet, Text, View } from "react-native";

export default function Richard() {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>Richard</Text>

      <Text>Curso: Análise e Desenvolvimento de Sistemas</Text>
      <Text>Turno: Noite</Text>
      <Text>Unidade: UNISUAM</Text>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  name: {
    fontSize: 28,
    marginBottom: 20,
  },

});
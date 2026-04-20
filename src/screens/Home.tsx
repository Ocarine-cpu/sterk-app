import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>Stærk</Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/dr")}
      >
        <Text style={styles.buttonText}>Davi</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/rd")}
      >
        <Text style={styles.buttonText}>Richard</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/vt")}
      >
        <Text style={styles.buttonText}>Vitor</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,    // Ocupa toda a tela
    justifyContent: "center",
    alignItems: "center"
  },

  title: {
    fontSize: 32,
    marginBottom: 40
  },

  button: {
    backgroundColor: "#333",
    padding: 15,
    margin: 10,
    borderRadius: 8
  },

  buttonText: {
    color: "#fff"
  }

})
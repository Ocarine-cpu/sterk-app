import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function TabLayout() {
  const { logado, setLogado } = useAuth();
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const pedirLogin = (e: any) => {
    if (!logado) {
      e.preventDefault();
      setMostrarLogin(true);
    }
  };

  function entrar() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Preencha e-mail e senha.");
      return;
    }

    setLogado(true);
    setMostrarLogin(false);
    setEmail("");
    setSenha("");
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#4f46e5",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: {
            backgroundColor: "#0f1115",
            borderTopColor: "#1f2937",
            height: 68,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="rotinas"
          options={{
            title: "Rotinas",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell" size={size} color={color} />
            ),
          }}
          listeners={{ tabPress: pedirLogin }}
        />

        <Tabs.Screen
          name="nutricao"
          options={{
            title: "Nutrição",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant" size={size} color={color} />
            ),
          }}
          listeners={{ tabPress: pedirLogin }}
        />

        <Tabs.Screen
          name="grupo"
          options={{
            title: "Grupo",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
          listeners={{ tabPress: pedirLogin }}
        />

        <Tabs.Screen
          name="perfil"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
          listeners={{ tabPress: pedirLogin }}
        />

        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>

      <Modal visible={mostrarLogin} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.box}>
            <Text style={styles.title}>Stærk</Text>
            <Text style={styles.subtitle}>
              Faça login para acessar esta aba
            </Text>

            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#888"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={entrar}>
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMostrarLogin(false);
                router.push("/cadastro" as any);
              }}
            >
              <Text style={styles.link}>Cadastrar-se</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMostrarLogin(false)}>
              <Text style={styles.cancel}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 24,
  },
  box: {
    backgroundColor: "#0f1115",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2a2f3a",
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#1a1d24",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2a2f3a",
  },
  button: {
    backgroundColor: "#4f46e5",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  link: {
    color: "#8b5cf6",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  cancel: {
    color: "#9ca3af",
    textAlign: "center",
    fontSize: 14,
  },
});

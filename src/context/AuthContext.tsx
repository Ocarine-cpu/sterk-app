// src/context/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { Usuario } from "../types";

import {
  buscarPerfil,
  observarSessao,
} from "../services/authService";

interface AuthContextData {
  usuario: Usuario | null;
  logado: boolean;
  carregando: boolean;

  atualizarUsuarioLocal: (
    usuario: Usuario
  ) => void;
}

const AuthContext = createContext<AuthContextData>({
  usuario: null,
  logado: false,
  carregando: true,

  atualizarUsuarioLocal: () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    const unsub = observarSessao(
      async (firebaseUser) => {
        if (firebaseUser) {
          const perfil =
            await buscarPerfil(
              firebaseUser.uid
            );

          setUsuario(perfil);
        } else {
          setUsuario(null);
        }

        setCarregando(false);
      }
    );

    return unsub;
  }, []);

  function atualizarUsuarioLocal(
    novoUsuario: Usuario
  ) {
    setUsuario(novoUsuario);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        logado: !!usuario,
        carregando,
        atualizarUsuarioLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
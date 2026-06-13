// src/services/authService.ts
// Autenticação com Firebase Auth + criação do perfil no Firestore

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";
import { Usuario } from "../types";

// ─── CADASTRO ────────────────────────────────────────────────────────────────
export async function cadastrarUsuario(
  nome: string,
  email: string,
  senha: string
): Promise<Usuario> {
  const credencial = await createUserWithEmailAndPassword(
    auth,
    email,
    senha
  );

  const uid = credencial.user.uid;

  const novoUsuario: Usuario = {
    uid,
    nome,
    email,
    criadoEm: new Date().toISOString(),
  };

  await setDoc(
    doc(db, "usuarios", uid),
    novoUsuario
  );

  return novoUsuario;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export async function loginUsuario(
  email: string,
  senha: string
): Promise<Usuario> {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  const uid = credencial.user.uid;

  // Busca o perfil completo do Firestore
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) {
    throw new Error("Perfil de usuário não encontrado.");
  }

  return snap.data() as Usuario;
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export async function logoutUsuario(): Promise<void> {
  await signOut(auth);
}

// ─── OBSERVADOR DE SESSÃO ─────────────────────────────────────────────────────
// Use no seu contexto de auth para saber se o usuário está logado
export function observarSessao(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ─── BUSCAR PERFIL ────────────────────────────────────────────────────────────
export async function buscarPerfil(uid: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? (snap.data() as Usuario) : null;
}

// ─── ATUALIZAR PERFIL ─────────────────────────────────────────────────────────
export async function atualizarPerfil(
  uid: string,
  dados: Partial<Usuario>
): Promise<void> {
  await updateDoc(
    doc(db, "usuarios", uid),
    dados
  );
}
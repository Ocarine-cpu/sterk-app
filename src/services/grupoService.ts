// src/services/grupoService.ts
// Gerenciamento dos grupos privados (máx 6 membros)

import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { Grupo, Usuario } from "../types";

// Gera um código aleatório de 6 caracteres maiúsculos
function gerarCodigo(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── CRIAR GRUPO ──────────────────────────────────────────────────────────────
export async function criarGrupo(
  nomeGrupo: string,
  usuarioUid: string
): Promise<Grupo> {
  const id = `grupo_${Date.now()}`;
  const codigo = gerarCodigo();

  const grupo: Grupo = {
    id,
    codigo,
    nome: nomeGrupo,
    membros: [usuarioUid],
    criadoPor: usuarioUid,
    criadoEm: new Date().toISOString(),
  };

  await setDoc(doc(db, "grupos", id), grupo);

  // Atualiza o usuário com o código e ID do grupo
  await updateDoc(doc(db, "usuarios", usuarioUid), {
    grupoCodigo: codigo,
    grupoId: id,
  });

  return grupo;
}

// ─── ENTRAR NO GRUPO ──────────────────────────────────────────────────────────
export async function entrarNoGrupo(
  codigo: string,
  usuarioUid: string
): Promise<Grupo> {
  // Busca o grupo pelo código
  const q = query(
    collection(db, "grupos"),
    where("codigo", "==", codigo.toUpperCase())
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("Código de grupo inválido.");
  }

  const grupoDoc = snap.docs[0];
  const grupo = grupoDoc.data() as Grupo;

  if (grupo.membros.length >= 6) {
    throw new Error("Este grupo já está cheio (máximo 6 membros).");
  }

  if (grupo.membros.includes(usuarioUid)) {
    throw new Error("Você já faz parte deste grupo.");
  }

  // Adiciona o usuário ao grupo
  await updateDoc(doc(db, "grupos", grupo.id), {
    membros: arrayUnion(usuarioUid),
  });

  // Atualiza o usuário com as informações do grupo vinculado
  await updateDoc(doc(db, "usuarios", usuarioUid), {
    grupoCodigo: grupo.codigo,
    grupoId: grupo.id,
  });

  return { ...grupo, membros: [...grupo.membros, usuarioUid] };
}

// ─── BUSCAR GRUPO DO USUÁRIO ──────────────────────────────────────────────────
export async function buscarGrupoDoUsuario(
  codigo: string
): Promise<Grupo | null> {
  const q = query(
    collection(db, "grupos"),
    where("codigo", "==", codigo)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as Grupo);
}

// ─── BUSCAR MEMBROS DO GRUPO ──────────────────────────────────────────────────
export async function buscarMembrosDoGrupo(
  membrosUids: string[]
): Promise<Usuario[]> {
  const perfis = await Promise.all(
    membrosUids.map(async (uid) => {
      const snap = await getDoc(doc(db, "usuarios", uid));
      return snap.exists() ? (snap.data() as Usuario) : null;
    })
  );
  return perfis.filter(Boolean) as Usuario[];
}

// ─────────────────────────────────────────────────────────────
// BUSCAR GRUPO PELO ID
// ─────────────────────────────────────────────────────────────
export async function buscarGrupoPorId(
  grupoId: string
): Promise<Grupo | null> {
  const snap = await getDoc(
    doc(db, "grupos", grupoId)
  );

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as Grupo;
}

// ─────────────────────────────────────────────────────────────
// BUSCAR GRUPO PELO CÓDIGO
// ─────────────────────────────────────────────────────────────
export async function buscarGrupoPorCodigo(
  codigo: string
): Promise<Grupo | null> {
  const q = query(
    collection(db, "grupos"),
    where(
      "codigo",
      "==",
      codigo.toUpperCase()
    )
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    return null;
  }

  return snap.docs[0].data() as Grupo;
}
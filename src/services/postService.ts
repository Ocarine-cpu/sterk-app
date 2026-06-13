// src/services/postService.ts
// Feed social do grupo (posts, curtidas e comentários)
//
// CORREÇÃO CRÍTICA: O Firestore exige índice composto quando se combina
// where("campo") com orderBy("outro campo"). Para evitar o erro de índice,
// buscamos apenas por grupoId e filtramos/ordenamos no cliente.

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../config/firebaseConfig";
import { Comentario, Post, TipoExercicio } from "../types";

// ─── CRIAR POST ───────────────────────────────────────────────────────────────
export async function criarPost(
  grupoId: string,
  autorUid: string,
  autorNome: string,
  texto: string,
  tipoAtividade: TipoExercicio,
  autorFoto?: string
): Promise<void> {
  const agora = new Date();
  const expiresAt = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

  await addDoc(collection(db, "posts"), {
    autorUid,
    autorNome,
    autorFoto: autorFoto ?? null,
    grupoId,
    texto,
    tipoAtividade,
    curtidas: [],
    comentarios: [],
    criadoEm: agora.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}

// ─── LISTAR POSTS DO GRUPO ────────────────────────────────────────────────────
// Usa apenas where("grupoId") para evitar exigência de índice composto.
// Filtragem de expiresAt e ordenação são feitas no cliente.
export async function buscarPostsDoGrupo(grupoId: string): Promise<Post[]> {
  const agora = new Date().toISOString();

  const q = query(
    collection(db, "posts"),
    where("grupoId", "==", grupoId)
  );

  const snap = await getDocs(q);

  return snap.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Post, "id">),
    }))
    .filter((post) => post.expiresAt > agora)            // filtra expirados
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)); // mais recentes primeiro
}

// ─── CURTIR / DESCURTIR POST ──────────────────────────────────────────────────
export async function curtirPost(
  postId: string,
  usuarioUid: string,
  jaCurtiu: boolean
): Promise<void> {
  const ref = doc(db, "posts", postId);
  await updateDoc(ref, {
    curtidas: jaCurtiu ? arrayRemove(usuarioUid) : arrayUnion(usuarioUid),
  });
}

// ─── ADICIONAR COMENTÁRIO ─────────────────────────────────────────────────────
export async function comentarPost(
  postId: string,
  autorUid: string,
  autorNome: string,
  texto: string
): Promise<void> {
  const comentario: Comentario = {
    autorUid,
    autorNome,
    texto,
    criadoEm: new Date().toISOString(),
  };
  const ref = doc(db, "posts", postId);
  await updateDoc(ref, {
    comentarios: arrayUnion(comentario),
  });
}
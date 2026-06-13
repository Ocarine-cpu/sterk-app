// src/services/rotinaService.ts

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../config/firebaseConfig";

import {
  DadosAcademia,
  ExercicioAcademia,
  Rotina,
} from "../types";

// ─────────────────────────────────────────────────────────────
// SALVAR ROTINA
// ─────────────────────────────────────────────────────────────

export async function salvarRotina(
  rotina: Omit<Rotina, "id">
): Promise<Rotina> {
  const existentes =
    await buscarRotinasDoUsuario(
      rotina.usuarioUid
    );

  if (existentes.length >= 5) {
    throw new Error(
      "Você já atingiu o limite de 5 rotinas."
    );
  }

  const ref = await addDoc(
    collection(db, "rotinas"),
    rotina
  );

  return {
    id: ref.id,
    ...rotina,
  };
}

// ─────────────────────────────────────────────────────────────
// BUSCAR ROTINAS DO USUÁRIO
// ─────────────────────────────────────────────────────────────

export async function buscarRotinasDoUsuario(
  uid: string
): Promise<Rotina[]> {
  const q = query(
    collection(db, "rotinas"),
    where("usuarioUid", "==", uid)
  );

  const snap = await getDocs(q);

  return snap.docs.map(
    (d) =>
      ({
        id: d.id,
        ...d.data(),
      } as Rotina)
  );
}

// ─────────────────────────────────────────────────────────────
// BUSCAR ROTINAS PÚBLICAS DO GRUPO
// ─────────────────────────────────────────────────────────────

export async function buscarRotinasPublicasDoGrupo(
  membrosUids: string[]
): Promise<Rotina[]> {
  if (membrosUids.length === 0) {
    return [];
  }

  const q = query(
    collection(db, "rotinas"),
    where("usuarioUid", "in", membrosUids),
    where("publica", "==", true)
  );

  const snap = await getDocs(q);

  return snap.docs.map(
    (d) =>
      ({
        id: d.id,
        ...d.data(),
      } as Rotina)
  );
}

// ─────────────────────────────────────────────────────────────
// COPIAR ROTINA
// ─────────────────────────────────────────────────────────────

export async function copiarRotina(
  rotina: Rotina,
  novoUsuarioUid: string
): Promise<Rotina> {
  const copia: Omit<Rotina, "id"> = {
    ...rotina,
    usuarioUid: novoUsuarioUid,
    nome: `${rotina.nome} (copiada)`,
    publica: false,
    criadoEm: new Date().toISOString(),
  };

  return salvarRotina(copia);
}

// ─────────────────────────────────────────────────────────────
// DELETAR ROTINA
// ─────────────────────────────────────────────────────────────

export async function deletarRotina(
  rotinaId: string
): Promise<void> {
  await deleteDoc(
    doc(db, "rotinas", rotinaId)
  );
}

// ─────────────────────────────────────────────────────────────
// BUSCAR ROTINA POR ID
// ─────────────────────────────────────────────────────────────

export async function buscarRotinaPorId(
  rotinaId: string
): Promise<Rotina | null> {
  try {
    const ref = doc(
      db,
      "rotinas",
      rotinaId
    );

    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return null;
    }

    return {
      id: snap.id,
      ...snap.data(),
    } as Rotina;
  } catch (error) {
    console.error(
      "Erro ao buscar rotina por ID:",
      error
    );

    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// ATUALIZAR ROTINA COMPLETA
// ─────────────────────────────────────────────────────────────

export async function atualizarRotina(
  rotinaId: string,
  dadosAtualizados: Partial<Rotina>
): Promise<void> {
  const ref = doc(
    db,
    "rotinas",
    rotinaId
  );

  await updateDoc(
    ref,
    dadosAtualizados as any
  );
}

// ─────────────────────────────────────────────────────────────
// ADICIONAR EXERCÍCIO À ROTINA DE ACADEMIA
// ─────────────────────────────────────────────────────────────

export async function adicionarExercicioRotina(
  rotinaId: string,
  exercicio: ExercicioAcademia
): Promise<void> {
  const rotina =
    await buscarRotinaPorId(
      rotinaId
    );

  if (!rotina) {
    throw new Error(
      "Rotina não encontrada."
    );
  }

  if (rotina.tipo !== "academia") {
    throw new Error(
      "Somente rotinas de academia aceitam exercícios."
    );
  }

  const dadosAcademia =
    rotina.dados as DadosAcademia;

  const exerciciosAtuais =
    dadosAcademia.exercicios ?? [];

  const novosExercicios = [
    ...exerciciosAtuais,
    exercicio,
  ];

  const ref = doc(
    db,
    "rotinas",
    rotinaId
  );

  await updateDoc(ref, {
    dados: {
      ...dadosAcademia,
      exercicios: novosExercicios,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// REMOVER EXERCÍCIO DA ROTINA
// ─────────────────────────────────────────────────────────────

export async function removerExercicioRotina(
  rotinaId: string,
  indice: number
): Promise<void> {
  const rotina =
    await buscarRotinaPorId(
      rotinaId
    );

  if (!rotina) {
    throw new Error(
      "Rotina não encontrada."
    );
  }

  if (rotina.tipo !== "academia") {
    return;
  }

  const dadosAcademia =
    rotina.dados as DadosAcademia;

  const lista =
    (dadosAcademia.exercicios ?? []).filter(
      (_, i) => i !== indice
    );

  const ref = doc(
    db,
    "rotinas",
    rotinaId
  );

  await updateDoc(ref, {
    dados: {
      ...dadosAcademia,
      exercicios: lista,
    },
  });
}
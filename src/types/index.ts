// src/types/index.ts
// Schemas de dados do Stærk — todos os tipos usados no Firestore e AsyncStorage

// ─── USUÁRIO ─────────────────────────────────────────────────────────────────
export interface Usuario {
  uid: string;
  nome: string;
  email: string;

  fotoPerfil?: string;

  grupoCodigo?: string;
  grupoId?: string;

  altura?: number;
  peso?: number;
  sexo?: "masculino" | "feminino";

  // Metas diárias (definidas no perfil)
  metaCalorias?: number;      // kcal a consumir por dia (ex: 2000)
  metaAgua?: number;          // ml calculado automaticamente pelo sistema

  // Campo pessoal visível para o grupo
  messagemPessoal?: string;   // ex: "Foco em hipertrofia esse semestre"

  // Meta antiga (texto livre) — mantida para não quebrar usuários existentes
  meta?: string;

  atividadesFavoritas?: TipoExercicio[];

  criadoEm: string;
}

// ─── GRUPO PRIVADO ────────────────────────────────────────────────────────────
export interface Grupo {
  id: string;
  codigo: string;
  nome: string;
  membros: string[];
  criadoPor: string;
  criadoEm: string;
  fotoGrupo?: string;
}

// ─── POST (FEED 24H) ──────────────────────────────────────────────────────────
export interface Post {
  id: string;
  autorUid: string;
  autorNome: string;
  autorFoto?: string;
  grupoId: string;
  texto: string;
  tipoAtividade: TipoExercicio;
  curtidas: string[];
  comentarios: Comentario[];
  expiresAt: string;
  criadoEm: string;
}

export interface Comentario {
  autorUid: string;
  autorNome: string;
  texto: string;
  criadoEm: string;
}

// ─── ROTINA DE TREINO ─────────────────────────────────────────────────────────
export type DiaSemana =
  | "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export type TipoExercicio =
  | "academia" | "corrida" | "ciclismo"
  | "natacao"  | "lutas"   | "danca" | "pilates";

// ─── ACADEMIA ────────────────────────────────────────────────────────────────
export interface ExercicioAcademia {
  id?: number;
  nome: string;
  grupoMuscular?: string;
  series: number;
  repeticoes: number;

  // Informações detalhadas vindas da API (opcionais — preenchidas ao adicionar
  // o exercício via busca, para que possam ser consultadas depois também)
  descricao?: string;
  instrucoes?: string[];
  equipamento?: string;
  dificuldade?: string;
  seriesSugeridas?: string;
  repsSugeridas?: string;
  descansoSugerido?: string;
}

export interface DadosAcademia {
  foco: string[];
  exercicios: ExercicioAcademia[];
}

// ─── CORRIDA ─────────────────────────────────────────────────────────────────
export interface DadosCorrida {
  distancia: number;
  tempo: number;
}

// ─── CICLISMO ────────────────────────────────────────────────────────────────
export interface DadosCiclismo {
  distancia: number;
  tempo: number;
  terreno: string;
}

// ─── NATAÇÃO ─────────────────────────────────────────────────────────────────
export interface DadosNatacao {
  distancia: number;
  tempo: number;
  estilo: string;
}

// ─── LUTAS ───────────────────────────────────────────────────────────────────
export interface DadosLuta {
  estilo: string;
  duracao: number;
}

// ─── PILATES ─────────────────────────────────────────────────────────────────
export interface DadosPilates {
  estilo: string;
  duracao: number;
}

// ─── DANÇA ───────────────────────────────────────────────────────────────────
export interface DadosDanca {
  estilo: string;
  duracao: number;
}

// ─── UNION DOS DADOS DE ROTINA ────────────────────────────────────────────────
export type DadosRotina =
  | DadosAcademia
  | DadosLuta
  | DadosCorrida
  | DadosCiclismo
  | DadosNatacao
  | DadosPilates
  | DadosDanca;

// ─── ROTINA ───────────────────────────────────────────────────────────────────
export interface Rotina {
  id: string;
  usuarioUid: string;
  nome: string;
  tipo: TipoExercicio;
  dias: DiaSemana[];
  horario?: string;
  intensidade?: "leve" | "moderada" | "intensa";
  dados: DadosRotina;
  publica: boolean;
  criadoEm: string;
}

// ─── TREINO CONCLUÍDO (AsyncStorage) ─────────────────────────────────────────
export interface TreinoConcluido {
  id: string;               // UUID local
  rotinaId: string;
  rotinaNome: string;
  tipo: TipoExercicio;
  duracaoMin: number;
  caloriasGastas: number;
  data: string;             // YYYY-MM-DD
  concluidoEm: string;      // ISO
}

// ─── NUTRIÇÃO (AsyncStorage) ─────────────────────────────────────────────────
export type RefeicaoTipo = "cafe" | "almoco" | "lanche" | "janta";

export interface ItemAlimento {
  nome: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  quantidade: number;
}

export interface Refeicao {
  tipo: RefeicaoTipo;
  itens: ItemAlimento[];
}

export interface RegistroDiario {
  data: string;
  usuarioUid: string;
  refeicoes: Refeicao[];
  aguaConsumida: number;
  metaAgua: number;
  metaCalorias: number;
}
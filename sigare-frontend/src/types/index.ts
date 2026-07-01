export type TipoUtilizador = 'organizador' | 'fornecedor' | 'administrador' | 'gestor_municipal';

export interface Utilizador {
  id_utilizador: string;
  nome: string;
  email: string;
  tipo: TipoUtilizador;
  telefone?: string;
  criado_em: string;
}

export interface AuthPayload {
  idUtilizador: string;
  tipo: TipoUtilizador;
  nome: string;
  exp: number;
}

export interface Categoria {
  id_categoria: string;
  nome: string;
}

export interface Fornecedor {
  id_fornecedor: string;
  id_utilizador: string;
  nome: string;
  contacto?: string;
  endereco?: string;
  validado: boolean;
}

export interface Recurso {
  id_recurso: string;
  nome: string;
  descricao?: string;
  endereco?: string;
  preco: number;
  preco_hora?: number;
  preco_dia?: number;
  quantidade: number;
  quantidade_disponivel?: number;
  foto_url?: string;
  disponibilidade: boolean;
  id_fornecedor: string;
  id_categoria: string;
  categoria?: Categoria;
  fornecedor?: Fornecedor;
  criado_em: string;
}

export type EstadoReserva = 'pendente' | 'confirmada' | 'rejeitada' | 'em_andamento' | 'terminada' | 'devolvida';

export interface Reserva {
  id_reserva: string;
  data_reserva: string;
  hora_inicio?: string;
  horas: number;
  local_evento?: string;
  estado: EstadoReserva;
  id_utilizador: string;
  id_recurso: string;
  recurso?: Recurso;
  utilizador?: { nome: string; email: string; telefone?: string };
  criado_em: string;
}

export interface Notificacao {
  id_notificacao: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  id_utilizador: string;
  id_reserva?: string;
  criado_em: string;
}

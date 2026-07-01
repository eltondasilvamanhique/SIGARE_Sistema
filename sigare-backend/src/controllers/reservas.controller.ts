import { Response } from 'express';
import { z } from 'zod';
import { EstadoReserva } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

function calcularPrecoTotal(
  recurso: { preco: unknown; preco_hora: unknown; preco_dia: unknown },
  horas: number,
  quantidade: number,
): number {
  let precoUnit: number;
  if (recurso.preco_hora) {
    precoUnit =
      horas <= 8
        ? Number(recurso.preco_hora) * horas
        : Number(recurso.preco_dia ?? Number(recurso.preco_hora) * 8);
  } else {
    precoUnit = Number(recurso.preco);
  }
  return Math.round(precoUnit * quantidade * 100) / 100;
}

const reservaSchema = z.object({
  id_recurso: z.string().uuid(),
  data_reserva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Hora de início obrigatória no formato HH:MM.' }),
  horas: z.number().int().min(1).max(24).default(1),
  quantidade_solicitada: z.number().int().min(1).default(1),
  local_evento: z.string().min(3).max(300).optional(),
});

export async function criarReserva(req: AuthRequest, res: Response): Promise<void> {
  const parsed = reservaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ mensagem: 'Dados inválidos.', erros: parsed.error.flatten() });
    return;
  }
  const { id_recurso, data_reserva, hora_inicio, horas, quantidade_solicitada, local_evento } = parsed.data;
  const data = new Date(data_reserva);

  // Validar: não pode reservar no passado
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (data < hoje) {
    res.status(400).json({ mensagem: 'Não é possível reservar para uma data que já passou.' });
    return;
  }
  if (data.getTime() === hoje.getTime()) {
    const agora = new Date();
    const [h, m] = hora_inicio.split(':').map(Number);
    const horaEvento = new Date();
    horaEvento.setHours(h, m, 0, 0);
    if (horaEvento <= agora) {
      res.status(400).json({ mensagem: 'A hora de início selecionada já passou. Escolha uma hora futura.' });
      return;
    }
  }

  // RF06 — verificação de conflito considerando quantidade disponível
  const recurso = await prisma.recurso.findUnique({ where: { id_recurso } });
  if (!recurso) { res.status(404).json({ mensagem: 'Recurso não encontrado.' }); return; }

  // Somar quantidades já reservadas nessa data
  const reservasActivas = await prisma.reserva.aggregate({
    where: { id_recurso, data_reserva: data, estado: { notIn: ['rejeitada', 'devolvida'] } },
    _sum: { quantidade_solicitada: true },
  });
  const totalReservado = reservasActivas._sum.quantidade_solicitada ?? 0;

  if (totalReservado + quantidade_solicitada > recurso.quantidade) {
    const disponiveis = recurso.quantidade - totalReservado;
    res.status(409).json({
      mensagem: disponiveis <= 0
        ? `Todas as unidades deste recurso já estão reservadas para esta data.`
        : `Apenas ${disponiveis} unidade${disponiveis > 1 ? 's' : ''} disponível${disponiveis > 1 ? 'is' : ''} para esta data.`,
    });
    return;
  }

  // Combinar data + hora_inicio numa DateTime
  const [h, m] = hora_inicio.split(':').map(Number);
  const horaInicioDate = new Date(data);
  horaInicioDate.setHours(h, m, 0, 0);

  const reserva = await prisma.reserva.create({
    data: {
      id_utilizador: req.user!.idUtilizador,
      id_recurso,
      data_reserva: data,
      hora_inicio: horaInicioDate,
      horas,
      quantidade_solicitada,
      local_evento: local_evento ?? null,
    },
    include: { recurso: { include: { fornecedor: true } } },
  });

  // Notificação ao fornecedor
  await prisma.notificacao.create({
    data: {
      mensagem: `Nova reserva recebida para o recurso "${reserva.recurso.nome}" na data ${data_reserva}.`,
      tipo: 'nova_reserva',
      id_utilizador: reserva.recurso.fornecedor.id_utilizador,
      id_reserva: reserva.id_reserva,
    },
  });

  const preco_total = calcularPrecoTotal(recurso, horas, quantidade_solicitada);
  res.status(201).json({ ...reserva, preco_total });
}

export async function cancelarReserva(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);

  const reserva = await prisma.reserva.findUnique({
    where: { id_reserva: id },
    include: { recurso: { include: { fornecedor: true } } },
  });
  if (!reserva) { res.status(404).json({ mensagem: 'Reserva não encontrada.' }); return; }

  // Só o organizador dono pode cancelar
  if (reserva.id_utilizador !== req.user!.idUtilizador) {
    res.status(403).json({ mensagem: 'Sem permissão para cancelar esta reserva.' });
    return;
  }

  // Só pendente ou confirmada
  if (!['pendente', 'confirmada'].includes(reserva.estado)) {
    res.status(400).json({
      mensagem: `Não é possível cancelar uma reserva com estado "${reserva.estado}".`,
    });
    return;
  }

  // Deve faltar pelo menos 2 horas para o início do evento
  if (reserva.hora_inicio) {
    const dataReserva = new Date(reserva.data_reserva);
    const horaInicio = new Date(reserva.hora_inicio);
    const inicioEvento = new Date(dataReserva);
    inicioEvento.setHours(horaInicio.getUTCHours(), horaInicio.getUTCMinutes(), 0, 0);
    const agora = new Date();
    const diffMs = inicioEvento.getTime() - agora.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);
    if (diffHoras < 2) {
      res.status(400).json({
        mensagem: 'Não é possível cancelar com menos de 2 horas de antecedência.',
      });
      return;
    }
  }

  await prisma.reserva.update({
    where: { id_reserva: id },
    data: { estado: 'rejeitada' },
  });

  // Notificação ao fornecedor
  await prisma.notificacao.create({
    data: {
      mensagem: `A reserva do recurso "${reserva.recurso.nome}" foi cancelada pelo organizador.`,
      tipo: 'reserva_cancelada',
      id_utilizador: reserva.recurso.fornecedor.id_utilizador,
      id_reserva: id,
    },
  });

  res.json({ mensagem: 'Reserva cancelada com sucesso.' });
}

export async function listarReservas(req: AuthRequest, res: Response): Promise<void> {
  const { tipo, idUtilizador } = req.user!;

  let where = {};
  if (tipo === 'organizador') {
    where = { id_utilizador: idUtilizador };
  } else if (tipo === 'fornecedor') {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id_utilizador: idUtilizador },
    });
    if (!fornecedor) { res.json([]); return; }
    where = { recurso: { id_fornecedor: fornecedor.id_fornecedor } };
  }
  // administrador vê todas (where = {})

  const reservas = await prisma.reserva.findMany({
    where,
    include: { recurso: { include: { categoria: true } }, utilizador: true, avaliacao: true },
    orderBy: { criado_em: 'desc' },
  });
  res.json(reservas);
}

export async function decidirReserva(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { estado } = req.body as { estado: 'confirmada' | 'rejeitada' };

  if (!['confirmada', 'rejeitada'].includes(estado)) {
    res.status(400).json({ mensagem: 'Estado inválido.' });
    return;
  }

  const reserva = await prisma.reserva.findUnique({
    where: { id_reserva: id },
    include: { recurso: { include: { fornecedor: true } } },
  });
  if (!reserva) { res.status(404).json({ mensagem: 'Reserva não encontrada.' }); return; }

  if (reserva.recurso.fornecedor.id_utilizador !== req.user!.idUtilizador) {
    res.status(403).json({ mensagem: 'Sem permissão.' });
    return;
  }

  const atualizada = await prisma.reserva.update({
    where: { id_reserva: String(id) },
    data: { estado },
  });

  const msgMap: Record<string, string> = {
    confirmada: `A sua reserva para "${reserva.recurso.nome}" foi confirmada! Pode ver o recibo no painel.`,
    rejeitada:  `A sua reserva para "${reserva.recurso.nome}" foi rejeitada pelo fornecedor.`,
  };

  await prisma.notificacao.create({
    data: {
      mensagem: msgMap[estado],
      tipo: `reserva_${estado}`,
      id_utilizador: reserva.id_utilizador,
      id_reserva: String(id),
    },
  });

  res.json(atualizada);
}

// Transições de estado pelo fornecedor: em_andamento → terminada → devolvida
export async function avancarEstado(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);

  const reserva = await prisma.reserva.findUnique({
    where: { id_reserva: id },
    include: { recurso: { include: { fornecedor: true } } },
  });
  if (!reserva) { res.status(404).json({ mensagem: 'Reserva não encontrada.' }); return; }

  if (reserva.recurso.fornecedor.id_utilizador !== req.user!.idUtilizador) {
    res.status(403).json({ mensagem: 'Sem permissão.' }); return;
  }

  const transicoes: Record<string, string> = {
    confirmada:   'em_andamento',
    em_andamento: 'terminada',
    terminada:    'devolvida',
  };

  const proximoEstado = transicoes[reserva.estado];
  if (!proximoEstado) {
    res.status(400).json({ mensagem: `Não é possível avançar o estado "${reserva.estado}".` }); return;
  }

  const atualizada = await prisma.reserva.update({
    where: { id_reserva: id },
    data: { estado: proximoEstado as EstadoReserva },
  });

  const msgMap: Record<string, string> = {
    em_andamento: `O seu evento com "${reserva.recurso.nome}" está em andamento.`,
    terminada:    `O evento com "${reserva.recurso.nome}" foi marcado como terminado.`,
    devolvida:    `O fornecedor confirmou a devolução do material de "${reserva.recurso.nome}".`,
  };

  await prisma.notificacao.create({
    data: {
      mensagem: msgMap[proximoEstado],
      tipo: `reserva_${proximoEstado}`,
      id_utilizador: reserva.id_utilizador,
      id_reserva: id,
    },
  });

  res.json(atualizada);
}

// Recibo completo da reserva
export async function getRecibo(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);

  const reserva = await prisma.reserva.findUnique({
    where: { id_reserva: id },
    include: {
      utilizador: true,
      recurso: {
        include: {
          categoria: true,
          fornecedor: { include: { utilizador: true } },
        },
      },
      alocacoes: { include: { funcionario: true } },
    },
  });

  if (!reserva) { res.status(404).json({ mensagem: 'Reserva não encontrada.' }); return; }

  // Apenas o próprio organizador ou o fornecedor do recurso podem ver o recibo
  const isFornecedor = reserva.recurso.fornecedor.id_utilizador === req.user!.idUtilizador;
  const isOrganizador = reserva.id_utilizador === req.user!.idUtilizador;
  if (!isFornecedor && !isOrganizador) {
    res.status(403).json({ mensagem: 'Sem permissão.' }); return;
  }

  res.json(reserva);
}

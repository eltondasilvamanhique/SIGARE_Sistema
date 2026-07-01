import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const reclamacaoSchema = z.object({
  assunto:   z.string().min(5).max(150),
  descricao: z.string().min(10).max(1000),
});

// POST /api/reservas/:id/reclamar — organizador cria reclamação
export async function criarReclamacao(req: AuthRequest, res: Response): Promise<void> {
  const id_reserva = String(req.params.id);
  const parsed = reclamacaoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ mensagem: 'Dados inválidos.', erros: parsed.error.flatten() });
    return;
  }

  const reserva = await prisma.reserva.findUnique({
    where: { id_reserva },
    include: { recurso: { include: { fornecedor: true } } },
  });
  if (!reserva) { res.status(404).json({ mensagem: 'Reserva não encontrada.' }); return; }
  if (reserva.id_utilizador !== req.user!.idUtilizador) {
    res.status(403).json({ mensagem: 'Sem permissão.' }); return;
  }
  if (!['confirmada', 'em_andamento', 'terminada', 'devolvida'].includes(reserva.estado)) {
    res.status(400).json({ mensagem: 'Só é possível reclamar de reservas confirmadas ou concluídas.' }); return;
  }

  const reclamacao = await prisma.reclamacao.create({
    data: {
      id_reserva,
      id_utilizador: req.user!.idUtilizador,
      assunto:   parsed.data.assunto,
      descricao: parsed.data.descricao,
    },
  });

  // Notificar administrador (primeiro encontrado)
  const admin = await prisma.utilizador.findFirst({ where: { tipo: 'administrador' } });
  if (admin) {
    await prisma.notificacao.create({
      data: {
        mensagem: `Nova reclamação sobre a reserva de "${reserva.recurso.nome}": ${parsed.data.assunto}`,
        tipo: 'nova_reclamacao',
        id_utilizador: admin.id_utilizador,
        id_reserva,
      },
    });
  }

  // Notificar fornecedor
  await prisma.notificacao.create({
    data: {
      mensagem: `Foi submetida uma reclamação sobre o recurso "${reserva.recurso.nome}": ${parsed.data.assunto}`,
      tipo: 'nova_reclamacao',
      id_utilizador: reserva.recurso.fornecedor.id_utilizador,
      id_reserva,
    },
  });

  res.status(201).json(reclamacao);
}

// GET /api/reclamacoes — admin vê todas; organizador vê as suas; fornecedor vê das suas reservas
export async function listarReclamacoes(req: AuthRequest, res: Response): Promise<void> {
  const { tipo, idUtilizador } = req.user!;

  let where = {};
  if (tipo === 'organizador') {
    where = { id_utilizador: idUtilizador };
  } else if (tipo === 'fornecedor') {
    const fornecedor = await prisma.fornecedor.findUnique({ where: { id_utilizador: idUtilizador } });
    if (!fornecedor) { res.json([]); return; }
    where = { reserva: { recurso: { id_fornecedor: fornecedor.id_fornecedor } } };
  }

  const reclamacoes = await prisma.reclamacao.findMany({
    where,
    include: {
      utilizador: { select: { nome: true, email: true } },
      reserva: { include: { recurso: { select: { nome: true } } } },
    },
    orderBy: { criado_em: 'desc' },
  });
  res.json(reclamacoes);
}

// PATCH /api/reclamacoes/:id — admin responde e muda estado
export async function responderReclamacao(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { estado, resposta } = req.body as { estado?: string; resposta?: string };

  const estadosValidos = ['aberta', 'em_analise', 'resolvida', 'arquivada'];
  if (estado && !estadosValidos.includes(estado)) {
    res.status(400).json({ mensagem: 'Estado inválido.' }); return;
  }

  const reclamacao = await prisma.reclamacao.findUnique({
    where: { id_reclamacao: id },
    include: { reserva: { include: { recurso: true } } },
  });
  if (!reclamacao) { res.status(404).json({ mensagem: 'Reclamação não encontrada.' }); return; }

  const atualizada = await prisma.reclamacao.update({
    where: { id_reclamacao: id },
    data: {
      ...(estado    ? { estado }    : {}),
      ...(resposta  ? { resposta }  : {}),
    },
    include: {
      utilizador: { select: { nome: true, email: true } },
      reserva: { include: { recurso: { select: { nome: true } } } },
    },
  });

  // Notificar organizador sobre resposta
  if (resposta || estado === 'resolvida') {
    const msg = estado === 'resolvida'
      ? `A sua reclamação sobre "${reclamacao.reserva.recurso.nome}" foi marcada como resolvida.`
      : `O administrador respondeu à sua reclamação sobre "${reclamacao.reserva.recurso.nome}".`;
    await prisma.notificacao.create({
      data: {
        mensagem: msg,
        tipo: 'reclamacao_respondida',
        id_utilizador: reclamacao.id_utilizador,
        id_reserva: reclamacao.id_reserva,
      },
    });
  }

  res.json(atualizada);
}

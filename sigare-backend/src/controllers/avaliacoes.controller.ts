import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const avaliacaoSchema = z.object({
  nota: z.number().int().min(1).max(5),
  comentario: z.string().max(500).optional(),
});

// POST /reservas/:id/avaliar
export async function criarAvaliacao(req: AuthRequest, res: Response): Promise<void> {
  const id_reserva = String(req.params.id);

  const parsed = avaliacaoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ mensagem: 'Nota inválida. Deve ser entre 1 e 5.' });
    return;
  }

  const reserva = await prisma.reserva.findUnique({
    where: { id_reserva },
    include: { avaliacao: true },
  });
  if (!reserva) { res.status(404).json({ mensagem: 'Reserva não encontrada.' }); return; }

  if (reserva.id_utilizador !== req.user!.idUtilizador) {
    res.status(403).json({ mensagem: 'Sem permissão para avaliar esta reserva.' });
    return;
  }

  if (!['terminada', 'devolvida'].includes(reserva.estado)) {
    res.status(400).json({ mensagem: 'Só pode avaliar reservas terminadas ou devolvidas.' });
    return;
  }

  if (reserva.avaliacao) {
    res.status(409).json({ mensagem: 'Esta reserva já foi avaliada.' });
    return;
  }

  const avaliacao = await prisma.avaliacao.create({
    data: {
      id_reserva,
      id_utilizador: req.user!.idUtilizador,
      id_recurso: reserva.id_recurso,
      nota: parsed.data.nota,
      comentario: parsed.data.comentario ?? null,
    },
  });

  res.status(201).json(avaliacao);
}

// GET /recursos/:id/avaliacoes
export async function listarAvaliacoes(req: AuthRequest, res: Response): Promise<void> {
  const id_recurso = String(req.params.id);

  const avaliacoes = await prisma.avaliacao.findMany({
    where: { id_recurso },
    include: { utilizador: { select: { nome: true } } },
    orderBy: { criado_em: 'desc' },
  });

  const total = avaliacoes.length;
  const media = total > 0
    ? Math.round((avaliacoes.reduce((s, a) => s + a.nota, 0) / total) * 10) / 10
    : null;

  res.json({ media, total, avaliacoes });
}

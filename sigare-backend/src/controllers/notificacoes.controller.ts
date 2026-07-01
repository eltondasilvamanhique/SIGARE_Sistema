import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export async function listarNotificacoes(req: AuthRequest, res: Response): Promise<void> {
  const notificacoes = await prisma.notificacao.findMany({
    where: { id_utilizador: req.user!.idUtilizador },
    orderBy: { criado_em: 'desc' },
  });
  res.json(notificacoes);
}

export async function marcarLida(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);
  const notificacao = await prisma.notificacao.findUnique({ where: { id_notificacao: id } });
  if (!notificacao || notificacao.id_utilizador !== req.user!.idUtilizador) {
    res.status(404).json({ mensagem: 'Notificação não encontrada.' });
    return;
  }
  const atualizada = await prisma.notificacao.update({
    where: { id_notificacao: String(id) },
    data: { lida: true },
  });
  res.json(atualizada);
}

export async function marcarTodasLidas(req: AuthRequest, res: Response): Promise<void> {
  await prisma.notificacao.updateMany({
    where: { id_utilizador: req.user!.idUtilizador, lida: false },
    data: { lida: true },
  });
  res.json({ mensagem: 'Todas marcadas como lidas.' });
}

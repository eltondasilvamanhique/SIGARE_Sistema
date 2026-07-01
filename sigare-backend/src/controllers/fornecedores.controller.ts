import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function listarFornecedores(_req: Request, res: Response): Promise<void> {
  const fornecedores = await prisma.fornecedor.findMany({
    include: { utilizador: { select: { nome: true, email: true, bloqueado: true } } },
    orderBy: { validado: 'asc' },
  });
  res.json(fornecedores);
}

export async function validarFornecedor(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const fornecedor = await prisma.fornecedor.findUnique({ where: { id_fornecedor: id } });
  if (!fornecedor) { res.status(404).json({ mensagem: 'Fornecedor não encontrado.' }); return; }

  const atualizado = await prisma.fornecedor.update({
    where: { id_fornecedor: String(id) },
    data: { validado: true },
  });
  res.json(atualizado);
}

export async function bloquearFornecedor(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id_fornecedor: id },
    include: { utilizador: true },
  });
  if (!fornecedor) { res.status(404).json({ mensagem: 'Fornecedor não encontrado.' }); return; }

  const novoBloqueado = !fornecedor.utilizador.bloqueado;
  await prisma.utilizador.update({
    where: { id_utilizador: fornecedor.id_utilizador },
    data: { bloqueado: novoBloqueado },
  });

  res.json({ bloqueado: novoBloqueado });
}

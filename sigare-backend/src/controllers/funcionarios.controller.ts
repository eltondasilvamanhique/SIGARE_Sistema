import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const funcionarioSchema = z.object({
  nome: z.string().min(2).max(120),
  contacto: z.string().max(60).optional(),
  funcao: z.string().max(80).optional(),
});

async function getFornecedor(idUtilizador: string) {
  return prisma.fornecedor.findUnique({ where: { id_utilizador: idUtilizador } });
}

export async function listarFuncionarios(req: AuthRequest, res: Response): Promise<void> {
  const fornecedor = await getFornecedor(req.user!.idUtilizador);
  if (!fornecedor) { res.status(403).json({ mensagem: 'Fornecedor não encontrado.' }); return; }

  const funcionarios = await prisma.funcionario.findMany({
    where: { id_fornecedor: fornecedor.id_fornecedor },
    orderBy: { nome: 'asc' },
  });
  res.json(funcionarios);
}

export async function criarFuncionario(req: AuthRequest, res: Response): Promise<void> {
  const parsed = funcionarioSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ mensagem: 'Dados inválidos.', erros: parsed.error.flatten() }); return; }

  const fornecedor = await getFornecedor(req.user!.idUtilizador);
  if (!fornecedor) { res.status(403).json({ mensagem: 'Fornecedor não encontrado.' }); return; }

  const funcionario = await prisma.funcionario.create({
    data: { ...parsed.data, id_fornecedor: fornecedor.id_fornecedor },
  });
  res.status(201).json(funcionario);
}

export async function eliminarFuncionario(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);
  const fornecedor = await getFornecedor(req.user!.idUtilizador);
  if (!fornecedor) { res.status(403).json({ mensagem: 'Fornecedor não encontrado.' }); return; }

  const func = await prisma.funcionario.findUnique({ where: { id_funcionario: id } });
  if (!func || func.id_fornecedor !== fornecedor.id_fornecedor) {
    res.status(404).json({ mensagem: 'Funcionário não encontrado.' }); return;
  }

  await prisma.funcionario.delete({ where: { id_funcionario: id } });
  res.status(204).send();
}

export async function listarAlocacoes(req: AuthRequest, res: Response): Promise<void> {
  const id_reserva = String(req.params.id);
  const alocacoes = await prisma.alocacao.findMany({
    where: { id_reserva },
    include: { funcionario: true },
    orderBy: { criado_em: 'asc' },
  });
  res.json(alocacoes);
}

export async function alocarFuncionario(req: AuthRequest, res: Response): Promise<void> {
  const id_reserva = String(req.params.id);
  const { id_funcionario, funcao_no_evento } = req.body as { id_funcionario: string; funcao_no_evento?: string };

  if (!id_funcionario) { res.status(400).json({ mensagem: 'id_funcionario obrigatório.' }); return; }

  const fornecedor = await getFornecedor(req.user!.idUtilizador);
  if (!fornecedor) { res.status(403).json({ mensagem: 'Fornecedor não encontrado.' }); return; }

  // Verificar que o funcionário pertence ao fornecedor
  const func = await prisma.funcionario.findUnique({ where: { id_funcionario } });
  if (!func || func.id_fornecedor !== fornecedor.id_fornecedor) {
    res.status(403).json({ mensagem: 'Funcionário não pertence a este fornecedor.' }); return;
  }

  // Verificar conflito de horário do funcionário
  const reservaAlvo = await prisma.reserva.findUnique({ where: { id_reserva } });
  if (!reservaAlvo) { res.status(404).json({ mensagem: 'Reserva não encontrada.' }); return; }

  if (reservaAlvo.hora_inicio) {
    const inicioAlvo = new Date(reservaAlvo.hora_inicio);
    const fimAlvo = new Date(inicioAlvo.getTime() + reservaAlvo.horas * 3600000);

    const alocacoesDia = await prisma.alocacao.findMany({
      where: {
        id_funcionario,
        id_reserva: { not: id_reserva },
        reserva: {
          data_reserva: reservaAlvo.data_reserva,
          estado: { notIn: ['rejeitada', 'devolvida'] },
        },
      },
      include: { reserva: true },
    });

    for (const aloc of alocacoesDia) {
      if (!aloc.reserva.hora_inicio) continue;
      const outroInicio = new Date(aloc.reserva.hora_inicio);
      const outroFim = new Date(outroInicio.getTime() + aloc.reserva.horas * 3600000);
      if (inicioAlvo < outroFim && outroInicio < fimAlvo) {
        res.status(409).json({
          mensagem: `"${func.nome}" já está alocado para outro evento das ${outroInicio.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} às ${outroFim.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} nesse dia.`,
        });
        return;
      }
    }
  }

  const alocacao = await prisma.alocacao.create({
    data: { id_funcionario, id_reserva, funcao_no_evento: funcao_no_evento ?? func.funcao ?? null },
    include: { funcionario: true },
  });
  res.status(201).json(alocacao);
}

export async function removerAlocacao(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);
  const fornecedor = await getFornecedor(req.user!.idUtilizador);
  if (!fornecedor) { res.status(403).json({ mensagem: 'Fornecedor não encontrado.' }); return; }

  await prisma.alocacao.delete({ where: { id_alocacao: id } });
  res.status(204).send();
}

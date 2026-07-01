import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const recursoSchema = z.object({
  nome: z.string().min(2).max(150),
  descricao: z.string().optional(),
  endereco: z.string().max(300).optional(),
  preco: z.number().positive(),
  preco_hora: z.number().positive().optional(),
  preco_dia: z.number().positive().optional(),
  quantidade: z.number().int().positive().optional(),
  foto_url: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  id_categoria: z.string().uuid(),
  disponibilidade: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export async function listarRecursos(req: AuthRequest, res: Response): Promise<void> {
  const { q, categoria, data, pagina: paginaStr, limite: limiteStr } = req.query as Record<string, string | undefined>;

  const usarPaginacao = paginaStr !== undefined;
  const pagina = Math.max(1, parseInt(paginaStr ?? '1', 10) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(limiteStr ?? '20', 10) || 20));

  const where = {
    ...(q ? { nome: { contains: q, mode: 'insensitive' as const } } : {}),
    ...(categoria ? { id_categoria: categoria } : {}),
  };

  const include = {
    categoria: true,
    fornecedor: true,
    avaliacoes: { select: { nota: true } },
  };

  function calcMedia(avaliacoes: { nota: number }[]) {
    if (!avaliacoes.length) return null;
    return Math.round((avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length) * 10) / 10;
  }

  const [recursos, total] = await Promise.all([
    prisma.recurso.findMany({
      where,
      include,
      orderBy: { criado_em: 'desc' },
      ...(usarPaginacao ? { take: limite, skip: (pagina - 1) * limite } : {}),
    }),
    usarPaginacao ? prisma.recurso.count({ where }) : Promise.resolve(0),
  ]);

  let resultado;

  if (!data) {
    resultado = recursos.map(r => ({
      ...r,
      quantidade_disponivel: r.quantidade,
      media_avaliacao: calcMedia(r.avaliacoes),
      total_avaliacoes: r.avaliacoes.length,
    }));
  } else {
    const ids = recursos.map(r => r.id_recurso);
    const reservasPorRecurso = await prisma.reserva.groupBy({
      by: ['id_recurso'],
      where: {
        data_reserva: new Date(data),
        id_recurso: { in: ids },
        estado: { notIn: ['rejeitada', 'devolvida'] },
      },
      _sum: { quantidade_solicitada: true },
    });

    const reservadoMap: Record<string, number> = {};
    for (const r of reservasPorRecurso) {
      reservadoMap[r.id_recurso] = r._sum.quantidade_solicitada ?? 0;
    }

    resultado = recursos.map(r => ({
      ...r,
      quantidade_disponivel: Math.max(0, r.quantidade - (reservadoMap[r.id_recurso] ?? 0)),
      media_avaliacao: calcMedia(r.avaliacoes),
      total_avaliacoes: r.avaliacoes.length,
    }));
  }

  if (usarPaginacao) {
    res.json({ data: resultado, total, pagina, totalPaginas: Math.ceil(total / limite) });
  } else {
    res.json(resultado);
  }
}

export async function obterRecurso(req: AuthRequest, res: Response): Promise<void> {
  const recurso = await prisma.recurso.findUnique({
    where: { id_recurso: String(req.params.id) },
    include: { categoria: true, fornecedor: true },
  });
  if (!recurso) { res.status(404).json({ mensagem: 'Recurso não encontrado.' }); return; }
  res.json(recurso);
}

export async function criarRecurso(req: AuthRequest, res: Response): Promise<void> {
  const parsed = recursoSchema.safeParse(req.body);
  if (!parsed.success) {
    const campos = parsed.error.flatten().fieldErrors;
    const primeiro = Object.entries(campos)[0];
    const mensagem = primeiro
      ? `Campo "${primeiro[0]}": ${primeiro[1]?.[0] ?? 'inválido'}`
      : 'Dados inválidos.';
    res.status(400).json({ mensagem, erros: parsed.error.flatten() });
    return;
  }

  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id_utilizador: req.user!.idUtilizador },
  });
  if (!fornecedor) {
    res.status(403).json({ mensagem: 'Fornecedor não encontrado.' });
    return;
  }
  if (!fornecedor.validado) {
    res.status(403).json({ mensagem: 'A sua conta de fornecedor ainda não foi validada.' });
    return;
  }

  const recurso = await prisma.recurso.create({
    data: {
      nome: parsed.data.nome,
      descricao: parsed.data.descricao,
      endereco: parsed.data.endereco ?? null,
      preco: parsed.data.preco,
      preco_hora: parsed.data.preco_hora ?? null,
      preco_dia: parsed.data.preco_dia ?? null,
      quantidade: parsed.data.quantidade ?? 1,
      foto_url: parsed.data.foto_url || null,
      id_fornecedor: fornecedor.id_fornecedor,
      id_categoria: parsed.data.id_categoria,
      disponibilidade: parsed.data.disponibilidade ?? true,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    },
    include: { categoria: true },
  });
  res.status(201).json(recurso);
}

export async function atualizarRecurso(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);
  const parsed = recursoSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ mensagem: 'Dados inválidos.' });
    return;
  }

  const recurso = await prisma.recurso.findUnique({ where: { id_recurso: id } });
  if (!recurso) { res.status(404).json({ mensagem: 'Recurso não encontrado.' }); return; }

  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id_utilizador: req.user!.idUtilizador },
  });
  if (!fornecedor || fornecedor.id_fornecedor !== recurso.id_fornecedor) {
    res.status(403).json({ mensagem: 'Sem permissão para editar este recurso.' });
    return;
  }

  const atualizado = await prisma.recurso.update({
    where: { id_recurso: String(id) },
    data: parsed.data,
    include: { categoria: true },
  });
  res.json(atualizado);
}

export async function obterDisponibilidade(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);
  const mes = String(req.query.mes ?? ''); // formato YYYY-MM

  const recurso = await prisma.recurso.findUnique({ where: { id_recurso: id } });
  if (!recurso) { res.status(404).json({ mensagem: 'Recurso não encontrado.' }); return; }

  // Determinar início e fim do mês
  const [ano, m] = mes.split('-').map(Number);
  if (!ano || !m) { res.status(400).json({ mensagem: 'Parâmetro mes inválido. Use YYYY-MM.' }); return; }
  // Usar UTC para evitar problemas de timezone
  const inicio = new Date(Date.UTC(ano, m - 1, 1));
  const fim = new Date(Date.UTC(ano, m, 0)); // último dia do mês em UTC

  // Somar quantidades reservadas por dia nesse mês
  const reservas = await prisma.reserva.groupBy({
    by: ['data_reserva'],
    where: {
      id_recurso: id,
      data_reserva: { gte: inicio, lte: fim },
      estado: { notIn: ['rejeitada', 'devolvida'] },
    },
    _sum: { quantidade_solicitada: true },
  });

  const reservadoMap: Record<string, number> = {};
  for (const r of reservas) {
    const key = r.data_reserva.toISOString().slice(0, 10);
    reservadoMap[key] = r._sum.quantidade_solicitada ?? 0;
  }

  // Gerar array de dias do mês
  const dias = [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  for (let d = 1; d <= fim.getUTCDate(); d++) {
    const data = new Date(Date.UTC(ano, m - 1, d));
    const key = data.toISOString().slice(0, 10);
    const reservado = reservadoMap[key] ?? 0;
    const disponivel = Math.max(0, recurso.quantidade - reservado);
    dias.push({
      data: key,
      passado: data < hoje,
      quantidade_reservada: reservado,
      quantidade_disponivel: disponivel,
      esgotado: disponivel === 0,
      parcial: reservado > 0 && disponivel > 0,
    });
  }

  res.json({ id_recurso: id, mes, quantidade_total: recurso.quantidade, dias });
}

export async function listarMeusRecursos(req: AuthRequest, res: Response): Promise<void> {
  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id_utilizador: req.user!.idUtilizador },
  });
  if (!fornecedor) { res.status(403).json({ mensagem: 'Fornecedor não encontrado.' }); return; }

  const recursos = await prisma.recurso.findMany({
    where: { id_fornecedor: fornecedor.id_fornecedor },
    include: { categoria: true, fornecedor: true },
    orderBy: { criado_em: 'desc' },
  });

  res.json(recursos);
}

export async function listarReservasRecurso(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);

  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id_utilizador: req.user!.idUtilizador },
  });
  if (!fornecedor) { res.status(403).json({ mensagem: 'Fornecedor não encontrado.' }); return; }

  const recurso = await prisma.recurso.findUnique({ where: { id_recurso: id } });
  if (!recurso || recurso.id_fornecedor !== fornecedor.id_fornecedor) {
    res.status(403).json({ mensagem: 'Sem permissão.' }); return;
  }

  const reservas = await prisma.reserva.findMany({
    where: { id_recurso: id, estado: { notIn: ['rejeitada', 'devolvida'] } },
    include: {
      utilizador: { select: { nome: true, email: true, telefone: true } },
      alocacoes: { include: { funcionario: { select: { nome: true, funcao: true } } } },
    },
    orderBy: [{ data_reserva: 'asc' }, { hora_inicio: 'asc' }],
  });

  res.json(reservas);
}

export async function eliminarRecurso(req: AuthRequest, res: Response): Promise<void> {
  const id = String(req.params.id);

  const recurso = await prisma.recurso.findUnique({ where: { id_recurso: id } });
  if (!recurso) { res.status(404).json({ mensagem: 'Recurso não encontrado.' }); return; }

  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id_utilizador: req.user!.idUtilizador },
  });
  if (!fornecedor || fornecedor.id_fornecedor !== recurso.id_fornecedor) {
    res.status(403).json({ mensagem: 'Sem permissão.' });
    return;
  }

  await prisma.recurso.delete({ where: { id_recurso: String(id) } });
  res.status(204).send();
}

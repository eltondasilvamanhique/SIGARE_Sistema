import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export async function utilizacao(_req: AuthRequest, res: Response): Promise<void> {
  const [total_utilizadores, total_recursos, total_reservas, fornecedores_por_validar, recursos] =
    await Promise.all([
      prisma.utilizador.count(),
      prisma.recurso.count(),
      prisma.reserva.count(),
      prisma.fornecedor.count({ where: { validado: false } }),
      prisma.recurso.findMany({
        select: {
          nome: true,
          _count: { select: { reservas: true } },
          reservas: { where: { estado: 'confirmada' }, select: { id_reserva: true } },
        },
        orderBy: { reservas: { _count: 'desc' } },
        take: 20,
      }),
    ]);

  res.json({
    total_utilizadores,
    total_recursos,
    total_reservas,
    fornecedores_por_validar,
    recursos: recursos.map((r) => ({
      nome: r.nome,
      total_reservas: r._count.reservas,
      confirmadas: r.reservas.length,
    })),
  });
}

export async function gestorStats(_req: AuthRequest, res: Response): Promise<void> {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioMesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fimMesPassado = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59);

  const [
    total_reservas,
    reservas_mes,
    reservas_mes_passado,
    fornecedores_validados,
    total_fornecedores,
    total_recursos,
    total_organizadores,
    reservasPorEstado,
    topRecursos,
  ] = await Promise.all([
    prisma.reserva.count(),
    prisma.reserva.count({ where: { criado_em: { gte: inicioMes } } }),
    prisma.reserva.count({ where: { criado_em: { gte: inicioMesPassado, lte: fimMesPassado } } }),
    prisma.fornecedor.count({ where: { validado: true } }),
    prisma.fornecedor.count(),
    prisma.recurso.count(),
    prisma.utilizador.count({ where: { tipo: 'organizador' } }),
    prisma.reserva.groupBy({
      by: ['estado'],
      _count: { _all: true },
    }),
    prisma.recurso.findMany({
      select: {
        nome: true,
        categoria: { select: { nome: true } },
        _count: { select: { reservas: true } },
      },
      orderBy: { reservas: { _count: 'desc' } },
      take: 8,
    }),
  ]);

  // Reservas por mês (últimos 6 meses) — 1 query em vez de 6
  const seisAtras = new Date(agora.getFullYear(), agora.getMonth() - 5, 1);
  const todasReservasRecentes = await prisma.reserva.findMany({
    where: { criado_em: { gte: seisAtras } },
    select: { criado_em: true },
  });
  const contagemMes: Record<string, number> = {};
  for (const r of todasReservasRecentes) {
    const key = `${r.criado_em.getFullYear()}-${r.criado_em.getMonth()}`;
    contagemMes[key] = (contagemMes[key] ?? 0) + 1;
  }
  const reservasPorMes: { mes: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const inicio = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const key = `${inicio.getFullYear()}-${inicio.getMonth()}`;
    reservasPorMes.push({
      mes: inicio.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }),
      total: contagemMes[key] ?? 0,
    });
  }

  const estadoMap: Record<string, number> = {};
  for (const r of reservasPorEstado) {
    estadoMap[r.estado] = r._count._all;
  }

  res.json({
    total_reservas,
    reservas_mes,
    reservas_mes_passado,
    fornecedores_validados,
    total_fornecedores,
    total_recursos,
    total_organizadores,
    reservas_por_estado: estadoMap,
    reservas_por_mes: reservasPorMes,
    top_recursos: topRecursos.map((r) => ({
      nome: r.nome,
      categoria: r.categoria?.nome ?? '—',
      total_reservas: r._count.reservas,
    })),
  });
}

export async function fornecedorStats(req: AuthRequest, res: Response): Promise<void> {
  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id_utilizador: req.user!.idUtilizador },
  });
  if (!fornecedor) { res.status(403).json({ mensagem: 'Fornecedor não encontrado.' }); return; }

  const idFornecedor = fornecedor.id_fornecedor;
  const agora = new Date();

  // Recursos deste fornecedor com preços
  const recursos = await prisma.recurso.findMany({
    where: { id_fornecedor: idFornecedor },
    select: { id_recurso: true, nome: true, preco: true, preco_hora: true, preco_dia: true },
  });
  const idsRecursos = recursos.map((r) => r.id_recurso);
  const precoMap: Record<string, { preco: number; preco_hora: number | null; preco_dia: number | null }> = {};
  for (const r of recursos) {
    precoMap[r.id_recurso] = { preco: Number(r.preco), preco_hora: r.preco_hora ? Number(r.preco_hora) : null, preco_dia: r.preco_dia ? Number(r.preco_dia) : null };
  }

  // Todas as reservas com horas e quantidade
  const todasReservas = await prisma.reserva.findMany({
    where: { id_recurso: { in: idsRecursos } },
    select: { id_recurso: true, estado: true, horas: true, quantidade_solicitada: true, criado_em: true },
  });

  // Calcular receita por reserva
  function calcReceita(idRecurso: string, horas: number, qtd: number): number {
    const p = precoMap[idRecurso];
    if (!p) return 0;
    let precoUnit: number;
    if (p.preco_hora) {
      precoUnit = horas <= 8 ? p.preco_hora * horas : Number(p.preco_dia ?? p.preco_hora * 8);
    } else {
      precoUnit = p.preco;
    }
    return precoUnit * qtd;
  }

  // Contagem por estado
  const porEstado: Record<string, number> = {};
  for (const r of todasReservas) {
    porEstado[r.estado] = (porEstado[r.estado] ?? 0) + 1;
  }

  // Receita total (reservas confirmadas + terminadas + em_andamento + devolvidas)
  const estadosPagos = ['confirmada', 'em_andamento', 'terminada', 'devolvida'];
  let receita_total = 0;
  for (const r of todasReservas) {
    if (estadosPagos.includes(r.estado)) {
      receita_total += calcReceita(r.id_recurso, r.horas, r.quantidade_solicitada);
    }
  }

  // Receita por mês (últimos 6 meses)
  const seisAtras = new Date(agora.getFullYear(), agora.getMonth() - 5, 1);
  const receitaMes: Record<string, number> = {};
  for (const r of todasReservas) {
    if (estadosPagos.includes(r.estado) && r.criado_em >= seisAtras) {
      const key = `${r.criado_em.getFullYear()}-${r.criado_em.getMonth()}`;
      receitaMes[key] = (receitaMes[key] ?? 0) + calcReceita(r.id_recurso, r.horas, r.quantidade_solicitada);
    }
  }
  const receita_por_mes = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    receita_por_mes.push({
      mes: d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }),
      valor: Math.round((receitaMes[key] ?? 0) * 100) / 100,
    });
  }

  // Top recursos por número de reservas
  const reservasPorRecurso: Record<string, number> = {};
  for (const r of todasReservas) {
    reservasPorRecurso[r.id_recurso] = (reservasPorRecurso[r.id_recurso] ?? 0) + 1;
  }
  const top_recursos = recursos
    .map((r) => ({ nome: r.nome, total_reservas: reservasPorRecurso[r.id_recurso] ?? 0 }))
    .sort((a, b) => b.total_reservas - a.total_reservas)
    .slice(0, 5);

  res.json({
    total_recursos: recursos.length,
    total_reservas: todasReservas.length,
    receita_total: Math.round(receita_total * 100) / 100,
    reservas_por_estado: porEstado,
    receita_por_mes,
    top_recursos,
  });
}

export async function publicoStats(_req: AuthRequest, res: Response): Promise<void> {
  const [total_fornecedores, total_recursos, total_reservas_confirmadas] = await Promise.all([
    prisma.fornecedor.count({ where: { validado: true } }),
    prisma.recurso.count(),
    prisma.reserva.count({ where: { estado: { in: ['confirmada', 'em_andamento', 'terminada', 'devolvida'] } } }),
  ]);
  res.json({ total_fornecedores, total_recursos, total_reservas_confirmadas });
}

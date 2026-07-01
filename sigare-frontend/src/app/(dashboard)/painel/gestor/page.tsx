'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import Link from 'next/link';

interface GestorStats {
  total_reservas: number;
  reservas_mes: number;
  reservas_mes_passado: number;
  fornecedores_validados: number;
  total_fornecedores: number;
  total_recursos: number;
  total_organizadores: number;
  reservas_por_estado: Record<string, number>;
  reservas_por_mes: { mes: string; total: number }[];
  top_recursos: { nome: string; categoria: string; total_reservas: number }[];
}

const estadoLabel: Record<string, string> = {
  pendente:     'Pendente',
  confirmada:   'Confirmada',
  em_andamento: 'Em Andamento',
  terminada:    'Terminada',
  devolvida:    'Devolvida',
  rejeitada:    'Rejeitada',
};

const estadoCor: Record<string, string> = {
  pendente:     'bg-yellow-400',
  confirmada:   'bg-blue-500',
  em_andamento: 'bg-indigo-500',
  terminada:    'bg-green-500',
  devolvida:    'bg-slate-400',
  rejeitada:    'bg-red-400',
};

const estadoTexto: Record<string, string> = {
  pendente:     'text-yellow-700',
  confirmada:   'text-blue-700',
  em_andamento: 'text-indigo-700',
  terminada:    'text-green-700',
  devolvida:    'text-slate-600',
  rejeitada:    'text-red-600',
};

export default function PainelGestorPage() {
  const { payload, loading } = useAuth('gestor_municipal');
  const [stats, setStats] = useState<GestorStats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!payload) return;
    api.get('/relatorios/gestor')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [payload]);

  if (loading || fetching) return <p className="text-slate-400">A carregar...</p>;
  if (!stats) return <p className="text-slate-400">Sem dados disponíveis.</p>;

  const variacaoMes = stats.reservas_mes_passado > 0
    ? Math.round(((stats.reservas_mes - stats.reservas_mes_passado) / stats.reservas_mes_passado) * 100)
    : null;

  const totalPorEstado = Object.values(stats.reservas_por_estado).reduce((s, v) => s + v, 0) || 1;
  const maxMes = Math.max(...stats.reservas_por_mes.map((m) => m.total), 1);

  const kpis = [
    {
      label: 'Total de Reservas',
      valor: stats.total_reservas,
      sub: variacaoMes !== null
        ? `${variacaoMes >= 0 ? '+' : ''}${variacaoMes}% vs mês passado`
        : `${stats.reservas_mes} este mês`,
      cor: variacaoMes !== null && variacaoMes >= 0 ? 'text-green-600' : 'text-red-500',
      destaque: false,
    },
    {
      label: 'Fornecedores Activos',
      valor: stats.fornecedores_validados,
      sub: `${stats.total_fornecedores} registados`,
      cor: 'text-slate-500',
      destaque: false,
    },
    {
      label: 'Recursos Disponíveis',
      valor: stats.total_recursos,
      sub: 'Em Xai-Xai',
      cor: 'text-slate-500',
      destaque: false,
    },
    {
      label: 'Organizadores',
      valor: stats.total_organizadores,
      sub: 'Utilizadores registados',
      cor: 'text-slate-500',
      destaque: true,
    },
  ];

  return (
    <div className="max-w-5xl">
      {/* Título */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-8 rounded-full bg-[#e9b94e]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0f2554]">Painel do Gestor Municipal</h1>
          <p className="text-xs text-slate-400 mt-0.5">Câmara Municipal de Xai-Xai — Gaza, Moçambique</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-xl border p-5 ${k.destaque ? 'bg-[#fef9e7] border-[#e9b94e]' : 'bg-white border-slate-200'}`}>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{k.label}</p>
            <p className={`text-3xl font-bold mt-2 ${k.destaque ? 'text-[#c9980a]' : 'text-[#0f2554]'}`}>{k.valor}</p>
            <p className={`text-xs mt-1.5 ${k.cor}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Reservas por estado */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-bold text-[#0f2554] uppercase tracking-wide mb-4">Reservas por Estado</h2>
          <div className="flex flex-col gap-3">
            {Object.entries(estadoLabel).map(([key, label]) => {
              const count = stats.reservas_por_estado[key] ?? 0;
              const pct = Math.round((count / totalPorEstado) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-semibold ${estadoTexto[key]}`}>{label}</span>
                    <span className="text-xs text-slate-500 font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${estadoCor[key]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tendência mensal */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-bold text-[#0f2554] uppercase tracking-wide mb-4">Reservas — Últimos 6 Meses</h2>
          <div className="flex items-end gap-2 h-32">
            {stats.reservas_por_mes.map((m) => {
              const h = maxMes > 0 ? Math.max(4, Math.round((m.total / maxMes) * 100)) : 4;
              return (
                <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-500 font-medium">{m.total}</span>
                  <div
                    className="w-full rounded-t-md bg-[#0f2554] transition-all"
                    style={{ height: `${h}%`, minHeight: '4px' }}
                  />
                  <span className="text-[10px] text-slate-400">{m.mes}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top recursos */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0f2554] uppercase tracking-wide">Recursos Mais Procurados</h2>
          <Link href="/painel/gestor/relatorios" className="text-xs text-[#1e4db7] hover:underline">Ver relatório completo →</Link>
        </div>
        {stats.top_recursos.length === 0 ? (
          <p className="px-6 py-4 text-slate-400 text-sm">Sem dados ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Recurso</th>
                <th className="px-5 py-3 text-left">Categoria</th>
                <th className="px-5 py-3 text-right">Reservas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.top_recursos.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-400 font-medium">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-[#0f2554]">{r.nome}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{r.categoria}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-[#c9980a]">{r.total_reservas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

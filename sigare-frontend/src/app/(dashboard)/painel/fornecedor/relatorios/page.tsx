'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface Stats {
  total_recursos: number;
  total_reservas: number;
  receita_total: number;
  reservas_por_estado: Record<string, number>;
  receita_por_mes: { mes: string; valor: number }[];
  top_recursos: { nome: string; total_reservas: number }[];
}

const estadoLabel: Record<string, string> = {
  pendente: 'Pendentes',
  confirmada: 'Confirmadas',
  em_andamento: 'Em Andamento',
  terminada: 'Terminadas',
  devolvida: 'Devolvidas',
  rejeitada: 'Rejeitadas',
};

const estadoCor: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  em_andamento: 'bg-purple-100 text-purple-700',
  terminada: 'bg-slate-100 text-slate-600',
  devolvida: 'bg-green-100 text-green-700',
  rejeitada: 'bg-red-100 text-red-600',
};

function formatarMT(valor: number) {
  return valor.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MT';
}

export default function RelatoriosFornecedorPage() {
  const { payload, loading } = useAuth('fornecedor');
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!payload) return;
    api.get('/relatorios/fornecedor')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [payload]);

  if (loading || fetching) return <p className="text-slate-400 text-sm">A carregar relatórios...</p>;
  if (!stats) return <p className="text-red-500 text-sm">Erro ao carregar dados.</p>;

  const maxReceita = Math.max(...stats.receita_por_mes.map((m) => m.valor), 1);
  const maxReservas = Math.max(...stats.top_recursos.map((r) => r.total_reservas), 1);

  const receitaConfirmada = stats.receita_total;
  const totalAtivas = (stats.reservas_por_estado['confirmada'] ?? 0) +
    (stats.reservas_por_estado['em_andamento'] ?? 0) +
    (stats.reservas_por_estado['pendente'] ?? 0);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Relatórios</h1>
        <p className="text-sm text-slate-500 mt-0.5">Resumo da actividade dos seus recursos</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Receita Total', valor: formatarMT(receitaConfirmada), cor: 'text-green-600', icone: '💰' },
          { label: 'Total Reservas', valor: String(stats.total_reservas), cor: 'text-[#0f2554]', icone: '📋' },
          { label: 'Reservas Activas', valor: String(totalAtivas), cor: 'text-blue-600', icone: '📅' },
          { label: 'Recursos', valor: String(stats.total_recursos), cor: 'text-slate-700', icone: '📦' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{c.icone}</span>
              <p className="text-xs text-slate-500 font-medium">{c.label}</p>
            </div>
            <p className={`text-2xl font-bold ${c.cor}`}>{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Receita por mês */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Receita dos Últimos 6 Meses (MT)</h2>
          <div className="flex items-end gap-2 h-36">
            {stats.receita_por_mes.map((m) => {
              const altura = maxReceita > 0 ? Math.max(4, Math.round((m.valor / maxReceita) * 100)) : 4;
              return (
                <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {m.valor > 0 ? (m.valor >= 1000 ? (m.valor / 1000).toFixed(1) + 'k' : m.valor.toFixed(0)) : ''}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-[#0f2554] transition-all"
                    style={{ height: `${altura}%` }}
                    title={formatarMT(m.valor)}
                  />
                  <span className="text-[10px] text-slate-400">{m.mes}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reservas por estado */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Reservas por Estado</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(stats.reservas_por_estado)
              .sort((a, b) => b[1] - a[1])
              .map(([estado, total]) => (
                <div key={estado} className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${estadoCor[estado] ?? 'bg-slate-100 text-slate-600'}`}>
                    {estadoLabel[estado] ?? estado}
                  </span>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0f2554] rounded-full"
                        style={{ width: `${Math.round((total / stats.total_reservas) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-8 text-right">{total}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recursos mais pedidos */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Recursos Mais Pedidos</h2>
        {stats.top_recursos.length === 0 ? (
          <p className="text-slate-400 text-sm italic">Sem dados ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {stats.top_recursos.map((r, i) => (
              <div key={r.nome} className="flex items-center gap-4">
                <span className="w-6 text-center text-sm font-bold text-slate-400">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800">{r.nome}</span>
                    <span className="text-xs font-bold text-[#0f2554]">
                      {r.total_reservas} pedido{r.total_reservas !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((r.total_reservas / maxReservas) * 100)}%`,
                        backgroundColor: i === 0 ? '#e9b94e' : '#0f2554',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

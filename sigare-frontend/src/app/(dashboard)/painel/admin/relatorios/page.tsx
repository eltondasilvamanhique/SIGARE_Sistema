'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface Stats {
  total_utilizadores: number;
  total_recursos: number;
  total_reservas: number;
  fornecedores_por_validar: number;
  recursos: { nome: string; total_reservas: number; confirmadas: number }[];
}

export default function RelatoriosAdminPage() {
  const { payload, loading } = useAuth('administrador');
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!payload) return;
    api.get('/relatorios/utilizacao')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [payload]);

  if (loading || fetching) return <p className="text-slate-400">A carregar...</p>;

  const cards = [
    { label: 'Utilizadores', valor: stats?.total_utilizadores ?? 0, cor: 'text-blue-700' },
    { label: 'Recursos', valor: stats?.total_recursos ?? 0, cor: 'text-slate-800' },
    { label: 'Reservas Totais', valor: stats?.total_reservas ?? 0, cor: 'text-slate-800' },
    { label: 'Fornecedores por Validar', valor: stats?.fornecedores_por_validar ?? 0, cor: 'text-yellow-600' },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Relatórios Globais</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.cor}`}>{c.valor}</p>
          </div>
        ))}
      </div>

      {/* Tabela de utilização por recurso */}
      <h2 className="text-lg font-medium text-slate-700 mb-4">Utilização por Recurso</h2>
      {!stats?.recursos?.length ? (
        <p className="text-slate-400 text-sm">Sem dados de reservas ainda.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Recurso</th>
                <th className="px-5 py-3 text-right">Total Reservas</th>
                <th className="px-5 py-3 text-right">Confirmadas</th>
                <th className="px-5 py-3 text-right">Taxa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recursos.map((r, i) => {
                const taxa = r.total_reservas > 0
                  ? Math.round((r.confirmadas / r.total_reservas) * 100)
                  : 0;
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.nome}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{r.total_reservas}</td>
                    <td className="px-5 py-3 text-right text-green-600 font-medium">{r.confirmadas}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${taxa}%` }} />
                        </div>
                        <span className="text-slate-500 text-xs w-8 text-right">{taxa}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

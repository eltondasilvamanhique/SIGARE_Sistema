'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface RecursoStats {
  nome: string;
  total_reservas: number;
  confirmadas: number;
}

export default function RelatoriosGestorPage() {
  const { payload, loading } = useAuth('gestor_municipal');
  const [dados, setDados] = useState<RecursoStats[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!payload) return;
    api.get('/relatorios/utilizacao')
      .then((r) => setDados(r.data?.recursos ?? []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [payload]);

  if (loading || fetching) return <p className="text-slate-400">A carregar...</p>;

  const totalReservas = dados.reduce((s, r) => s + r.total_reservas, 0);
  const totalConfirmadas = dados.reduce((s, r) => s + r.confirmadas, 0);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Relatório de Utilização</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total de Reservas</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{totalReservas}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Reservas Confirmadas</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{totalConfirmadas}</p>
        </div>
      </div>

      <h2 className="text-lg font-medium text-slate-700 mb-4">Utilização por Recurso</h2>

      {dados.length === 0 ? (
        <p className="text-slate-400 text-sm">Sem dados disponíveis.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Recurso</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Confirmadas</th>
                <th className="px-5 py-3 text-right">Taxa de Aprovação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dados.map((r, i) => {
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
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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

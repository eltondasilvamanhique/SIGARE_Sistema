'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Reserva } from '@/types';
import Link from 'next/link';

const estadoCor: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-green-100 text-green-700',
  rejeitada: 'bg-red-100 text-red-700',
};

export default function PainelOrganizadorPage() {
  const { payload, loading } = useAuth('organizador');
  const [reservas, setReservas] = useState<Reserva[]>([]);

  useEffect(() => {
    if (!payload) return;
    api.get('/reservas').then((r) => setReservas(r.data)).catch(() => {});
  }, [payload]);

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  const pendentes = reservas.filter((r) => r.estado === 'pendente').length;
  const confirmadas = reservas.filter((r) => r.estado === 'confirmada').length;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Painel do Organizador</h1>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total de Reservas', valor: reservas.length, cor: 'text-slate-800' },
          { label: 'Pendentes', valor: pendentes, cor: 'text-yellow-600' },
          { label: 'Confirmadas', valor: confirmadas, cor: 'text-green-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.cor}`}>{card.valor}</p>
          </div>
        ))}
      </div>

      {/* Ação rápida */}
      <Link
        href="/pesquisa"
        className="inline-block mb-8 px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
      >
        + Nova Pesquisa de Recursos
      </Link>

      {/* Últimas reservas */}
      <h2 className="text-lg font-medium text-slate-700 mb-3">Últimas Reservas</h2>
      {reservas.length === 0 ? (
        <p className="text-slate-400 text-sm">Ainda não tem reservas. Pesquise recursos para começar.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Recurso</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservas.slice(0, 8).map((r) => (
                <tr key={r.id_reserva} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">{r.recurso?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{r.data_reserva}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoCor[r.estado]}`}>
                      {r.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

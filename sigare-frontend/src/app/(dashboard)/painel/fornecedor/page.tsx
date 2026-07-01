'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Recurso, Reserva } from '@/types';
import Link from 'next/link';

const estadoCor: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-green-100 text-green-700',
  rejeitada: 'bg-red-100 text-red-700',
};

export default function PainelFornecedorPage() {
  const { payload, loading } = useAuth('fornecedor');
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  useEffect(() => {
    if (!payload) return;
    api.get('/recursos/meus').then((r) => setRecursos(r.data)).catch(() => {});
    api.get('/reservas').then((r) => setReservas(r.data)).catch(() => {});
  }, [payload]);

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  const pendentes = reservas.filter((r) => r.estado === 'pendente');

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Painel do Fornecedor</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Recursos Cadastrados', valor: recursos.length, cor: 'text-slate-800' },
          { label: 'Pedidos Pendentes', valor: pendentes.length, cor: 'text-yellow-600' },
          { label: 'Reservas Confirmadas', valor: reservas.filter((r) => r.estado === 'confirmada').length, cor: 'text-green-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.cor}`}>{card.valor}</p>
          </div>
        ))}
      </div>

      <Link
        href="/painel/fornecedor/recursos/novo"
        className="inline-block mb-8 px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
      >
        + Cadastrar Recurso
      </Link>

      {pendentes.length > 0 && (
        <>
          <h2 className="text-lg font-medium text-slate-700 mb-3">Pedidos Pendentes</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Recurso</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendentes.map((r) => (
                  <tr key={r.id_reserva} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{r.recurso?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.data_reserva}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoCor[r.estado]}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/painel/fornecedor/reservas`}
                        className="text-blue-700 hover:underline text-xs"
                      >
                        Decidir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Reserva } from '@/types';
import Link from 'next/link';

const estadoConfig: Record<string, { label: string; classe: string; dot: string }> = {
  pendente:     { label: 'Pendente',     classe: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',   dot: 'bg-amber-400' },
  confirmada:   { label: 'Confirmada',   classe: 'bg-green-50 text-green-700 ring-1 ring-green-200',   dot: 'bg-green-500' },
  rejeitada:    { label: 'Rejeitada',    classe: 'bg-red-50 text-red-700 ring-1 ring-red-200',         dot: 'bg-red-500' },
  em_andamento: { label: 'Em Andamento', classe: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',      dot: 'bg-blue-500' },
  terminada:    { label: 'Terminada',    classe: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',  dot: 'bg-slate-400' },
  devolvida:    { label: 'Devolvida',    classe: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',dot: 'bg-purple-500' },
};

function formatarData(data: string) {
  const d = new Date(data.slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PainelOrganizadorPage() {
  const { payload, loading } = useAuth('organizador');
  const [reservas, setReservas] = useState<Reserva[]>([]);

  useEffect(() => {
    if (!payload) return;
    api.get('/reservas').then((r) => setReservas(r.data)).catch(() => {});
  }, [payload]);

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  const pendentes    = reservas.filter((r) => r.estado === 'pendente').length;
  const confirmadas  = reservas.filter((r) => r.estado === 'confirmada').length;
  const emAndamento  = reservas.filter((r) => r.estado === 'em_andamento').length;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f2554]">Painel do Organizador</h1>
        <p className="text-slate-400 text-sm mt-0.5">Acompanhe as suas reservas e pesquise novos recursos</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total de Reservas', valor: reservas.length, cor: 'text-[#0f2554]', bg: 'bg-[#0f2554]/5', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f2554" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          )},
          { label: 'Pendentes', valor: pendentes, cor: 'text-amber-600', bg: 'bg-amber-50', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          )},
          { label: 'Confirmadas', valor: confirmadas + emAndamento, cor: 'text-green-600', bg: 'bg-green-50', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )},
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{card.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${card.cor}`}>{card.valor}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Acção rápida */}
      <Link
        href="/pesquisa"
        className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 bg-[#0f2554] text-white text-sm font-semibold rounded-xl hover:bg-[#1a3a7a] transition-colors shadow-sm"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Pesquisar Recursos
      </Link>

      {/* Últimas reservas */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-slate-700">Últimas Reservas</h2>
        {reservas.length > 8 && (
          <Link href="/painel/organizador/reservas" className="text-xs text-[#1e4db7] hover:underline font-medium">
            Ver todas →
          </Link>
        )}
      </div>

      {reservas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">Ainda não tem reservas</p>
          <p className="text-slate-400 text-xs mt-1">Pesquise recursos para começar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Recurso</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Data do Evento</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Estado</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Acção</span>
          </div>

          {/* Linhas */}
          <div className="divide-y divide-slate-100">
            {reservas.slice(0, 8).map((r) => {
              const cfg = estadoConfig[r.estado] ?? { label: r.estado, classe: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200', dot: 'bg-slate-400' };
              return (
                <div key={r.id_reserva} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  {/* Recurso */}
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0f2554] text-sm truncate">{r.recurso?.nome ?? '—'}</p>
                    {r.recurso?.categoria && (
                      <p className="text-xs text-slate-400 mt-0.5">{r.recurso.categoria.nome}</p>
                    )}
                  </div>

                  {/* Data */}
                  <div className="text-right whitespace-nowrap">
                    <p className="text-sm text-slate-600 font-medium">{formatarData(r.data_reserva)}</p>
                    {r.hora_inicio && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {r.hora_inicio.toString().slice(11, 16) || r.hora_inicio.toString().slice(0, 5)}
                      </p>
                    )}
                  </div>

                  {/* Estado */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classe}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Acção */}
                  <div>
                    <Link
                      href={`/painel/organizador/reservas/${r.id_reserva}/recibo`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0f2554] bg-slate-100 hover:bg-[#0f2554] hover:text-white rounded-lg transition-colors"
                    >
                      Recibo
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rodapé */}
          {reservas.length > 8 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-center">
              <Link href="/painel/organizador/reservas" className="text-xs text-[#1e4db7] hover:underline font-medium">
                Ver todas as {reservas.length} reservas →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

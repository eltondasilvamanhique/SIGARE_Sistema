'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import Link from 'next/link';

interface Stats {
  total_utilizadores: number;
  total_recursos: number;
  total_reservas: number;
  fornecedores_por_validar: number;
  recursos: { nome: string; total_reservas: number; confirmadas: number }[];
}

export default function PainelAdminPage() {
  const { payload, loading } = useAuth('administrador');
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!payload) return;
    api.get('/relatorios/utilizacao').then((r) => setStats(r.data)).catch(() => {});
  }, [payload]);

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  const kpis = [
    { label: 'Utilizadores', valor: stats?.total_utilizadores ?? '—', href: '/painel/admin/utilizadores', destaque: false, icone: '👤' },
    { label: 'Recursos', valor: stats?.total_recursos ?? '—', href: '/painel/admin/relatorios', destaque: false, icone: '📦' },
    { label: 'Reservas Totais', valor: stats?.total_reservas ?? '—', href: '/painel/admin/relatorios', destaque: false, icone: '📋' },
    { label: 'Por Validar', valor: stats?.fornecedores_por_validar ?? '—', href: '/painel/admin/fornecedores', destaque: true, icone: '⚠️' },
  ];

  const acoes = [
    { href: '/painel/admin/fornecedores', label: 'Validar Fornecedores', desc: 'Aprovar contas de fornecedores pendentes', icone: '✓', bg: 'bg-[#0f2554]', cor: 'text-[#e9b94e]' },
    { href: '/painel/admin/utilizadores', label: 'Gerir Utilizadores', desc: 'Ver e filtrar todos os utilizadores', icone: '👥', bg: 'bg-slate-100', cor: 'text-slate-600' },
    { href: '/painel/admin/relatorios', label: 'Relatórios Globais', desc: 'Estatísticas completas de utilização', icone: '📊', bg: 'bg-[#e9b94e]', cor: 'text-[#0f2554]' },
  ];

  return (
    <div className="max-w-5xl">
      {/* Título */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 rounded-full bg-[#e9b94e]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0f2554]">Dashboard Administrativo</h1>
          <p className="text-xs text-slate-400 mt-0.5">SIGARE — Xai-Xai, Gaza, Moçambique</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border p-5 hover:shadow-md transition-all group ${
              card.destaque
                ? 'bg-[#fef9e7] border-[#e9b94e]'
                : 'bg-white border-slate-200 hover:border-[#e9b94e]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{card.label}</p>
              <span className="text-lg">{card.icone}</span>
            </div>
            <p className={`text-3xl font-bold ${card.destaque ? 'text-[#c9980a]' : 'text-[#0f2554]'}`}>
              {card.valor}
            </p>
          </Link>
        ))}
      </div>

      {/* Acções rápidas */}
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Acções rápidas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {acoes.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:border-[#e9b94e] hover:shadow-sm transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center ${a.cor} font-bold text-lg shrink-0`}>
              {a.icone}
            </div>
            <div>
              <p className="font-semibold text-[#0f2554] text-sm">{a.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Top 5 recursos */}
      {stats?.recursos && stats.recursos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f2554] uppercase tracking-wide">Top Recursos por Reservas</h2>
            <Link href="/painel/admin/relatorios" className="text-xs text-[#1e4db7] hover:underline">Ver todos →</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Recurso</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Confirmadas</th>
                <th className="px-5 py-3 text-right">Taxa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recursos.slice(0, 5).map((r, i) => {
                const taxa = r.total_reservas > 0 ? Math.round((r.confirmadas / r.total_reservas) * 100) : 0;
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-[#0f2554]">{r.nome}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{r.total_reservas}</td>
                    <td className="px-5 py-3 text-right text-green-600 font-medium">{r.confirmadas}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${taxa}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-7 text-right">{taxa}%</span>
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

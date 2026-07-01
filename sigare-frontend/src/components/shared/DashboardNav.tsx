'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import api from '@/lib/api';
import LogoSigare from './LogoSigare';

interface NavItem { href: string; label: string; }

const navPorTipo: Record<string, NavItem[]> = {
  organizador: [
    { href: '/painel/organizador',              label: 'Início' },
    { href: '/painel/organizador/reservas',     label: 'Minhas Reservas' },
    { href: '/pesquisa',                        label: 'Pesquisar Recursos' },
    { href: '/mapa',                            label: '🗺️ Mapa de Locais' },
    { href: '/painel/organizador/notificacoes', label: 'Notificações' },
  ],
  fornecedor: [
    { href: '/painel/fornecedor',                label: 'Início' },
    { href: '/painel/fornecedor/recursos',        label: 'Meus Recursos' },
    { href: '/painel/fornecedor/reservas',        label: 'Pedidos Recebidos' },
    { href: '/painel/fornecedor/funcionarios',    label: 'Funcionários' },
    { href: '/painel/fornecedor/relatorios',      label: 'Relatórios' },
    { href: '/painel/fornecedor/notificacoes',    label: 'Notificações' },
  ],
  administrador: [
    { href: '/painel/admin',               label: 'Dashboard' },
    { href: '/painel/admin/utilizadores',  label: 'Utilizadores' },
    { href: '/painel/admin/fornecedores',  label: 'Fornecedores' },
    { href: '/painel/admin/reclamacoes',   label: 'Reclamações' },
    { href: '/painel/admin/relatorios',    label: 'Relatórios' },
  ],
  gestor_municipal: [
    { href: '/painel/gestor',            label: 'Dashboard' },
    { href: '/painel/gestor/relatorios', label: 'Relatórios' },
  ],
};

const labelTipo: Record<string, string> = {
  organizador:      'Organizador',
  fornecedor:       'Fornecedor',
  administrador:    'Administrador',
  gestor_municipal: 'Gestor Municipal',
};

export default function DashboardNav() {
  const { payload, logout } = useAuth();
  const pathname = usePathname();
  const temNotificacoes = payload?.tipo === 'organizador' || payload?.tipo === 'fornecedor';
  const { naoLidas } = useNotificacoes(!!payload && temNotificacoes);
  const [nomeUtilizador, setNomeUtilizador] = useState<string>('');

  useEffect(() => {
    if (!payload) return;
    // Usar nome do token se disponível, senão buscar da API
    if (payload.nome) {
      setNomeUtilizador(payload.nome);
    } else {
      api.get('/utilizadores/me')
        .then((r) => setNomeUtilizador(r.data.nome ?? ''))
        .catch(() => {});
    }
  }, [payload]);

  if (!payload) return null;

  const items = navPorTipo[payload.tipo] ?? [];

  return (
    <aside className="w-60 shrink-0 bg-[#0f2554] flex flex-col shadow-xl sticky top-0 h-screen overflow-y-auto">
      {/* Logo + utilizador */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="block">
          <LogoSigare variante="compacto" altura={42} />
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#e9b94e] flex items-center justify-center text-[#0f2554] text-xs font-bold shrink-0">
            {nomeUtilizador ? nomeUtilizador.charAt(0).toUpperCase() : '…'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{nomeUtilizador || '…'}</p>
            <p className="text-blue-300 text-xs">{labelTipo[payload.tipo]}</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const isNotif = item.href.includes('notificacoes');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                active
                  ? 'bg-[#e9b94e] text-[#0f2554]'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {isNotif && naoLidas > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  active ? 'bg-[#0f2554] text-[#e9b94e]' : 'bg-[#e9b94e] text-[#0f2554]'
                }`}>
                  {naoLidas > 99 ? '99+' : naoLidas}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full px-3 py-2.5 rounded-lg text-sm text-blue-300 hover:bg-red-500/20 hover:text-red-300 transition-colors text-left"
        >
          Terminar sessão
        </button>
      </div>
    </aside>
  );
}

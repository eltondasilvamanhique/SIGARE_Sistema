'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNotificacoes } from '@/hooks/useNotificacoes';

const tipoIcone: Record<string, string> = {
  nova_reserva:         '📋',
  reserva_confirmada:   '✅',
  reserva_rejeitada:    '❌',
  reserva_cancelada:    '🚫',
  reserva_em_andamento: '▶️',
  reserva_terminada:    '🏁',
  reserva_devolvida:    '📦',
  nova_reclamacao:      '⚠️',
  reclamacao_respondida:'💬',
};

export default function NotificationBell() {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { payload } = useAuth();
  const temNotif = payload?.tipo === 'organizador' || payload?.tipo === 'fornecedor';
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotificacoes(!!payload && temNotif);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!payload || !temNotif) return null;

  function irParaNotificacoes() {
    setAberto(false);
    if (payload?.tipo === 'organizador') router.push('/painel/organizador/notificacoes');
    else router.push('/painel/fornecedor/notificacoes');
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        className="relative w-9 h-9 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center"
        aria-label="Notificações"
      >
        {/* Sino SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-[#0f2554]">Notificações</p>
              {naoLidas > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
                  {naoLidas}
                </span>
              )}
            </div>
            {naoLidas > 0 && (
              <button onClick={marcarTodasLidas} className="text-xs text-[#0f2554] hover:text-[#e9b94e] transition-colors font-medium">
                Marcar todas lidas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-72 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-xs text-slate-400">Sem notificações.</p>
              </div>
            ) : (
              notificacoes.slice(0, 12).map((n) => (
                <div
                  key={n.id_notificacao}
                  onClick={() => !n.lida && marcarLida(n.id_notificacao)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.lida ? 'bg-blue-50' : ''}`}
                >
                  <span className="text-base mt-0.5 shrink-0">{tipoIcone[n.tipo] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed line-clamp-2 ${n.lida ? 'text-slate-400' : 'text-slate-700'}`}>
                      {n.mensagem}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.criado_em).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.lida && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                </div>
              ))
            )}
          </div>

          {/* Rodapé */}
          <button
            onClick={irParaNotificacoes}
            className="w-full py-3 text-xs font-semibold text-[#0f2554] hover:bg-slate-50 transition-colors border-t border-slate-100"
          >
            Ver todas as notificações →
          </button>
        </div>
      )}
    </div>
  );
}

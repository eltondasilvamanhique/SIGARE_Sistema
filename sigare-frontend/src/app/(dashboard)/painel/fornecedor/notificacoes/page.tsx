'use client';

import { useAuth } from '@/hooks/useAuth';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import Link from 'next/link';

const tipoIcone: Record<string, string> = {
  nova_reserva:         '📋',
  reserva_confirmada:   '✅',
  reserva_rejeitada:    '❌',
  reserva_cancelada:    '🚫',
  reserva_em_andamento: '▶️',
  reserva_terminada:    '🏁',
  reserva_devolvida:    '📦',
};

export default function NotificacoesFornecedorPage() {
  const { payload, loading } = useAuth('fornecedor');
  const { notificacoes, naoLidas, carregando, marcarLida, marcarTodasLidas } = useNotificacoes(!!payload);

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  return (
    <div className="max-w-2xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-[#e9b94e]" />
          <div>
            <h1 className="text-2xl font-bold text-[#0f2554]">Notificações</h1>
            <p className="text-sm text-slate-500">
              {naoLidas > 0
                ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}`
                : 'Todas lidas'}
            </p>
          </div>
        </div>
        {naoLidas > 0 && (
          <button
            onClick={marcarTodasLidas}
            className="px-4 py-2 text-sm font-medium text-[#0f2554] border border-[#0f2554] rounded-lg hover:bg-[#0f2554] hover:text-white transition-colors"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {carregando ? (
        <p className="text-slate-400 text-sm">A carregar...</p>
      ) : notificacoes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-slate-500">Sem notificações de momento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notificacoes.map((n) => (
            <div
              key={n.id_notificacao}
              className={`p-4 rounded-xl border transition-colors ${
                n.lida
                  ? 'bg-white border-slate-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5 shrink-0">
                  {tipoIcone[n.tipo] ?? '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${n.lida ? 'text-slate-400' : 'text-slate-700'}`}>
                    {n.mensagem}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-400">
                      {new Date(n.criado_em).toLocaleString('pt-PT')}
                    </p>
                    <div className="flex items-center gap-3">
                      {n.id_reserva && (
                        <Link
                          href={`/painel/fornecedor/reservas/${n.id_reserva}/recibo`}
                          className="text-xs text-[#0f2554] hover:underline font-medium"
                        >
                          Ver reserva →
                        </Link>
                      )}
                      {!n.lida && (
                        <button
                          onClick={() => marcarLida(n.id_notificacao)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Marcar lida
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {!n.lida && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

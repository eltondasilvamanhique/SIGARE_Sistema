'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Reserva } from '@/types';
import Link from 'next/link';
import ModalAvaliar from '@/components/shared/ModalAvaliar';
import Estrelas from '@/components/shared/Estrelas';
import ModalReclamar from '@/components/shared/ModalReclamar';

const estadoCor: Record<string, string> = {
  pendente:     'bg-yellow-100 text-yellow-700',
  confirmada:   'bg-blue-100 text-blue-700',
  em_andamento: 'bg-purple-100 text-purple-700',
  terminada:    'bg-slate-100 text-slate-600',
  devolvida:    'bg-green-100 text-green-700',
  rejeitada:    'bg-red-100 text-red-600',
};

const estadoLabel: Record<string, string> = {
  pendente: 'Pendente', confirmada: 'Confirmada', em_andamento: 'Em Andamento',
  terminada: 'Terminada', devolvida: 'Devolvida', rejeitada: 'Rejeitada',
};

const ESTADOS_COM_RECIBO = ['confirmada', 'em_andamento', 'terminada', 'devolvida'];
const ESTADOS_CANCELAVEIS = ['pendente', 'confirmada'];
const ESTADOS_AVALIACAO = ['terminada', 'devolvida'];
const ESTADOS_RECLAMACAO = ['confirmada', 'em_andamento', 'terminada', 'devolvida'];

export default function ReservasOrganizadorPage() {
  const { payload, loading } = useAuth('organizador');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [fetching, setFetching] = useState(true);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [confirmarCancelar, setConfirmarCancelar] = useState<Reserva | null>(null);
  const [avaliarReserva, setAvaliarReserva] = useState<Reserva | null>(null);
  const [reclamarReserva, setReclamarReserva] = useState<Reserva | null>(null);
  const [reclamacoesEnviadas, setReclamacoesEnviadas] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  function mostrarToast(mensagem: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    if (!payload) return;
    api.get('/reservas')
      .then((r) => setReservas(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [payload]);

  async function cancelar(reserva: Reserva) {
    setConfirmarCancelar(reserva);
  }

  async function confirmarCancelamento() {
    if (!confirmarCancelar) return;
    const reserva = confirmarCancelar;
    setConfirmarCancelar(null);
    setCancelando(reserva.id_reserva);
    try {
      await api.patch(`/reservas/${reserva.id_reserva}/cancelar`);
      setReservas((prev) =>
        prev.map((r) => r.id_reserva === reserva.id_reserva ? { ...r, estado: 'rejeitada' } : r)
      );
      mostrarToast('Reserva cancelada com sucesso.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem;
      mostrarToast(msg ?? 'Não foi possível cancelar a reserva.', 'erro');
    } finally {
      setCancelando(null);
    }
  }

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  const filtradas = filtroEstado ? reservas.filter((r) => r.estado === filtroEstado) : reservas;

  return (
    <>
    {/* Toast de notificação */}
    {toast && (
      <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium transition-all ${
        toast.tipo === 'sucesso'
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'
      }`}>
        <span>{toast.tipo === 'sucesso' ? '✓' : '✕'}</span>
        <span>{toast.mensagem}</span>
        <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    )}
    {/* Modal de confirmação de cancelamento */}
    {confirmarCancelar && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <span className="text-red-500 text-lg">⚠️</span>
            </div>
            <h2 className="text-base font-bold text-[#0f2554]">Cancelar Reserva</h2>
          </div>
          <p className="text-sm text-slate-600 mb-1">
            Tem a certeza que quer cancelar a reserva de
          </p>
          <p className="text-sm font-semibold text-[#0f2554] mb-1">
            {confirmarCancelar.recurso?.nome}
          </p>
          <p className="text-sm text-slate-500 mb-5">
            para {new Date(confirmarCancelar.data_reserva).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}?
            <br />
            <span className="text-red-500 text-xs mt-1 block">Esta acção não pode ser desfeita.</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmarCancelar(null)}
              className="flex-1 py-2.5 border border-slate-300 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Manter Reserva
            </button>
            <button
              onClick={confirmarCancelamento}
              className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
            >
              Sim, Cancelar
            </button>
          </div>
        </div>
      </div>
    )}
    {reclamarReserva && (
      <ModalReclamar
        idReserva={reclamarReserva.id_reserva}
        nomeRecurso={reclamarReserva.recurso?.nome ?? 'Recurso'}
        onClose={() => setReclamarReserva(null)}
        onSucesso={() => {
          setReclamacoesEnviadas((prev) => new Set([...prev, reclamarReserva.id_reserva]));
          setReclamarReserva(null);
          mostrarToast('Reclamação submetida com sucesso. O administrador será notificado.');
        }}
      />
    )}
    {avaliarReserva && (
      <ModalAvaliar
        idReserva={avaliarReserva.id_reserva}
        nomeRecurso={avaliarReserva.recurso?.nome ?? 'Recurso'}
        onClose={() => setAvaliarReserva(null)}
        onSucesso={(nota) => {
          setReservas((prev) =>
            prev.map((r) =>
              r.id_reserva === avaliarReserva.id_reserva
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? { ...r, avaliacao: { nota } } as any
                : r
            )
          );
          setAvaliarReserva(null);
        }}
      />
    )}
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-[#e9b94e]" />
          <div>
            <h1 className="text-2xl font-bold text-[#0f2554]">Minhas Reservas</h1>
            <p className="text-sm text-slate-500">{reservas.length} reserva{reservas.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none"
          >
            <option value="">Todos os estados</option>
            {Object.entries(estadoLabel).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <Link href="/pesquisa" className="px-4 py-2.5 bg-[#0f2554] text-white text-sm font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors">
            + Nova Reserva
          </Link>
        </div>
      </div>

      {fetching ? (
        <p className="text-slate-400 text-sm">A carregar reservas...</p>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-slate-500 mb-4">Ainda não tem reservas.</p>
          <Link href="/pesquisa" className="px-4 py-2.5 bg-[#0f2554] text-white text-sm font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors">
            Pesquisar Recursos
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Recurso</th>
                <th className="px-5 py-3 text-left">Data / Local</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-left">Pedido em</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.map((r) => (
                <tr key={r.id_reserva} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-[#0f2554]">{r.recurso?.nome ?? '—'}</p>
                    <p className="text-xs text-slate-400">{r.recurso?.categoria?.nome ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    <p>{new Date(r.data_reserva).toLocaleDateString('pt-PT')}</p>
                    <p className="text-xs text-slate-400">
                      {r.horas ?? 1}h
                      {r.local_evento ? ` · ${r.local_evento}` : ''}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoCor[r.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                      {estadoLabel[r.estado] ?? r.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {new Date(r.criado_em).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {ESTADOS_COM_RECIBO.includes(r.estado) && (
                        <Link
                          href={`/painel/organizador/reservas/${r.id_reserva}/recibo`}
                          className="px-3 py-1.5 border border-[#0f2554] text-[#0f2554] text-xs font-semibold rounded-lg hover:bg-[#0f2554] hover:text-white transition-colors"
                        >
                          Ver Recibo
                        </Link>
                      )}
                      {ESTADOS_CANCELAVEIS.includes(r.estado) && (
                        <button
                          onClick={() => cancelar(r)}
                          disabled={cancelando === r.id_reserva}
                          className="px-3 py-1.5 border border-red-300 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                        >
                          {cancelando === r.id_reserva ? '...' : 'Cancelar'}
                        </button>
                      )}
                      {ESTADOS_RECLAMACAO.includes(r.estado) && (
                        reclamacoesEnviadas.has(r.id_reserva) ? (
                          <span className="px-3 py-1.5 text-xs text-slate-400 bg-slate-100 rounded-lg">
                            Reclamação enviada
                          </span>
                        ) : (
                          <button
                            onClick={() => setReclamarReserva(r)}
                            className="px-3 py-1.5 border border-red-300 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                          >
                            ⚠️ Reclamar
                          </button>
                        )
                      )}
                      {ESTADOS_AVALIACAO.includes(r.estado) && (
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (r as any).avaliacao ? (
                          <Estrelas nota={(r as any).avaliacao.nota} tamanho="text-sm" />
                        ) : (
                          <button
                            onClick={() => setAvaliarReserva(r)}
                            className="px-3 py-1.5 bg-[#fef9e7] border border-[#e9b94e] text-[#c9980a] text-xs font-semibold rounded-lg hover:bg-[#e9b94e] hover:text-[#0f2554] transition-colors"
                          >
                            ★ Avaliar
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
    </>
  );
}

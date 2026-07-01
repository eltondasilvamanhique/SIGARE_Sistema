'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Recurso, EstadoReserva } from '@/types';
import Link from 'next/link';

interface Alocacao {
  id_alocacao: string;
  funcionario: { nome: string; funcao?: string };
  funcao_no_evento?: string;
}

interface ReservaRecurso {
  id_reserva: string;
  data_reserva: string;
  hora_inicio?: string;
  horas: number;
  quantidade_solicitada: number;
  local_evento?: string;
  estado: EstadoReserva;
  utilizador: { nome: string; email: string; telefone?: string };
  alocacoes: Alocacao[];
}

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

function formatarHora(hora?: string) {
  if (!hora) return '—';
  return new Date(hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RecursosFornecedorPage() {
  const { payload, loading } = useAuth('fornecedor');
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [fetching, setFetching] = useState(true);
  const [toggleando, setToggleando] = useState<string | null>(null);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  // Gestão de alocações inline
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [reservasPorRecurso, setReservasPorRecurso] = useState<Record<string, ReservaRecurso[]>>({});
  const [loadingReservas, setLoadingReservas] = useState<string | null>(null);
  const [agindo, setAgindo] = useState<string | null>(null);

  function mostrarToast(mensagem: string, tipo: 'sucesso' | 'erro' = 'erro') {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    if (!payload) return;
    api.get('/recursos/meus')
      .then((r) => setRecursos(r.data))
      .catch((err) => {
        const status = err?.response?.status;
        const msg = err?.response?.data?.mensagem;
        setErroApi(msg ?? (status === 403 ? 'Acesso negado. Faça login novamente.' : 'Erro ao carregar recursos. Verifique a ligação ao servidor.'));
      })
      .finally(() => setFetching(false));
  }, [payload]);

  async function toggleDisponibilidade(recurso: Recurso) {
    setToggleando(recurso.id_recurso);
    try {
      await api.patch(`/recursos/${recurso.id_recurso}`, { disponibilidade: !recurso.disponibilidade });
      setRecursos((prev) =>
        prev.map((r) => r.id_recurso === recurso.id_recurso ? { ...r, disponibilidade: !r.disponibilidade } : r)
      );
    } catch {
      mostrarToast('Não foi possível alterar a disponibilidade.');
    } finally {
      setToggleando(null);
    }
  }

  async function eliminar(id: string) {
    if (!confirm('Eliminar este recurso? Esta acção não pode ser desfeita.')) return;
    try {
      await api.delete(`/recursos/${id}`);
      setRecursos((prev) => prev.filter((r) => r.id_recurso !== id));
      if (expandido === id) setExpandido(null);
    } catch {
      mostrarToast('Não foi possível eliminar. Verifique se não existem reservas activas.');
    }
  }

  async function toggleExpandido(id: string) {
    if (expandido === id) { setExpandido(null); return; }
    setExpandido(id);
    if (reservasPorRecurso[id]) return; // já carregado
    setLoadingReservas(id);
    try {
      const { data } = await api.get(`/recursos/${id}/reservas`);
      setReservasPorRecurso((prev) => ({ ...prev, [id]: data }));
    } catch {
      mostrarToast('Erro ao carregar reservas.');
    } finally {
      setLoadingReservas(null);
    }
  }

  async function decidir(idReserva: string, estado: 'confirmada' | 'rejeitada', idRecurso: string) {
    setAgindo(idReserva);
    try {
      await api.patch(`/reservas/${idReserva}/decidir`, { estado });
      atualizarEstadoReserva(idRecurso, idReserva, estado);
      mostrarToast(estado === 'confirmada' ? 'Reserva confirmada!' : 'Reserva rejeitada.', estado === 'confirmada' ? 'sucesso' : 'erro');
    } catch {
      mostrarToast('Erro ao processar a reserva.');
    } finally {
      setAgindo(null);
    }
  }

  async function avancar(idReserva: string, idRecurso: string) {
    setAgindo(idReserva);
    try {
      const { data } = await api.patch(`/reservas/${idReserva}/avancar`, {});
      atualizarEstadoReserva(idRecurso, idReserva, data.estado);
      mostrarToast('Estado actualizado!', 'sucesso');
    } catch {
      mostrarToast('Erro ao avançar o estado.');
    } finally {
      setAgindo(null);
    }
  }

  function atualizarEstadoReserva(idRecurso: string, idReserva: string, novoEstado: string) {
    setReservasPorRecurso((prev) => ({
      ...prev,
      [idRecurso]: (prev[idRecurso] ?? []).map((r) =>
        r.id_reserva === idReserva ? { ...r, estado: novoEstado as EstadoReserva } : r
      ),
    }));
  }

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  return (
    <div className="max-w-5xl">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium ${
          toast.tipo === 'sucesso' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span>{toast.tipo === 'sucesso' ? '✓' : '✕'}</span>
          <span>{toast.mensagem}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Meus Recursos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{recursos.length} recursos cadastrados</p>
        </div>
        <Link
          href="/painel/fornecedor/recursos/novo"
          className="px-4 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
        >
          + Novo Recurso
        </Link>
      </div>

      {fetching ? (
        <p className="text-slate-400 text-sm">A carregar recursos...</p>
      ) : erroApi ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium mb-2">Erro ao carregar recursos</p>
          <p className="text-sm text-red-500">{erroApi}</p>
          <button
            onClick={() => { setErroApi(null); setFetching(true); api.get('/recursos/meus').then((r) => setRecursos(r.data)).catch((e) => setErroApi(e?.response?.data?.mensagem ?? 'Erro ao carregar.')).finally(() => setFetching(false)); }}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      ) : recursos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500 mb-4">Ainda não tem recursos cadastrados.</p>
          <Link href="/painel/fornecedor/recursos/novo" className="px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors">
            Cadastrar Primeiro Recurso
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Nome</th>
                <th className="px-5 py-3 text-left">Categoria</th>
                <th className="px-5 py-3 text-right">Preço</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-left">Alocações</th>
                <th className="px-5 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {recursos.map((r) => {
                const aberto = expandido === r.id_recurso;
                const reservas = reservasPorRecurso[r.id_recurso] ?? [];
                const ativas = reservas.filter((rv) => !['rejeitada', 'devolvida'].includes(rv.estado));

                return (
                  <>
                    <tr key={r.id_recurso} className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${aberto ? 'bg-slate-50' : ''}`}>
                      <td className="px-5 py-3 font-medium text-slate-800">{r.nome}</td>
                      <td className="px-5 py-3 text-slate-500">{r.categoria?.nome ?? '—'}</td>
                      <td className="px-5 py-3 text-right text-slate-700 font-medium">
                        {Number(r.preco).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleDisponibilidade(r)}
                          disabled={toggleando === r.id_recurso}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium transition-opacity ${
                            r.disponibilidade ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'
                          } disabled:opacity-50`}
                        >
                          {r.disponibilidade ? 'Disponível' : 'Indisponível'}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleExpandido(r.id_recurso)}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#1e4db7] hover:underline"
                        >
                          {loadingReservas === r.id_recurso ? (
                            <span className="w-3 h-3 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin inline-block" />
                          ) : (
                            <>
                              {aberto && reservas.length > 0 && (
                                <span className="bg-[#0f2554] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                  {ativas.length}
                                </span>
                              )}
                              <span>{aberto ? '▲ Fechar' : '▼ Ver alocadas'}</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/painel/fornecedor/recursos/${r.id_recurso}/editar`} className="text-xs text-[#1e4db7] hover:underline font-medium">
                            Editar
                          </Link>
                          <button onClick={() => eliminar(r.id_recurso)} className="text-xs text-red-500 hover:text-red-700 hover:underline">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Painel de alocações inline */}
                    {aberto && (
                      <tr key={`${r.id_recurso}-alocacoes`} className="border-t border-slate-100 bg-[#f8faff]">
                        <td colSpan={6} className="px-5 py-4">
                          {loadingReservas === r.id_recurso ? (
                            <p className="text-slate-400 text-xs py-2">A carregar reservas...</p>
                          ) : reservas.length === 0 ? (
                            <p className="text-slate-400 text-xs py-2 italic">Nenhuma reserva activa para este recurso.</p>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Reservas activas — {r.nome}
                              </p>
                              {reservas.map((rv) => (
                                <div key={rv.id_reserva} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                                  {/* Info */}
                                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                      <p className="text-slate-400 mb-0.5">Organizador</p>
                                      <p className="font-semibold text-slate-800">{rv.utilizador.nome}</p>
                                      {rv.utilizador.telefone && (
                                        <p className="text-slate-400">{rv.utilizador.telefone}</p>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-slate-400 mb-0.5">Data</p>
                                      <p className="font-semibold text-slate-800">{formatarData(rv.data_reserva)}</p>
                                      <p className="text-slate-400">{formatarHora(rv.hora_inicio)} · {rv.horas}h</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-400 mb-0.5">Quantidade</p>
                                      <p className="font-semibold text-slate-800">{rv.quantidade_solicitada} un.</p>
                                      {rv.local_evento && <p className="text-slate-400 truncate">{rv.local_evento}</p>}
                                    </div>
                                    <div>
                                      <p className="text-slate-400 mb-0.5">Funcionários</p>
                                      {rv.alocacoes.length === 0 ? (
                                        <p className="text-slate-400 italic">Nenhum alocado</p>
                                      ) : (
                                        rv.alocacoes.map((al) => (
                                          <p key={al.id_alocacao} className="text-slate-700">
                                            {al.funcionario.nome}
                                            {al.funcao_no_evento && <span className="text-slate-400"> · {al.funcao_no_evento}</span>}
                                          </p>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                  {/* Estado + Acções */}
                                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${estadoCor[rv.estado]}`}>
                                      {estadoLabel[rv.estado]}
                                    </span>

                                    {rv.estado === 'pendente' && (
                                      <>
                                        <button
                                          disabled={agindo === rv.id_reserva}
                                          onClick={() => decidir(rv.id_reserva, 'confirmada', r.id_recurso)}
                                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                                        >
                                          Confirmar
                                        </button>
                                        <button
                                          disabled={agindo === rv.id_reserva}
                                          onClick={() => decidir(rv.id_reserva, 'rejeitada', r.id_recurso)}
                                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                                        >
                                          Rejeitar
                                        </button>
                                      </>
                                    )}

                                    {rv.estado === 'confirmada' && (
                                      <button
                                        disabled={agindo === rv.id_reserva}
                                        onClick={() => avancar(rv.id_reserva, r.id_recurso)}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                                      >
                                        Iniciar Evento
                                      </button>
                                    )}

                                    {rv.estado === 'em_andamento' && (
                                      <button
                                        disabled={agindo === rv.id_reserva}
                                        onClick={() => avancar(rv.id_reserva, r.id_recurso)}
                                        className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                                      >
                                        Marcar Terminado
                                      </button>
                                    )}

                                    {rv.estado === 'terminada' && (
                                      <button
                                        disabled={agindo === rv.id_reserva}
                                        onClick={() => avancar(rv.id_reserva, r.id_recurso)}
                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                                      >
                                        Confirmar Devolução
                                      </button>
                                    )}

                                    <Link
                                      href={`/painel/fornecedor/reservas/${rv.id_reserva}/recibo`}
                                      className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors"
                                    >
                                      Recibo
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

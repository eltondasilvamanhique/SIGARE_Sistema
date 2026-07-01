'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import api from '@/lib/api';
import { Reserva } from '@/types';

interface Funcionario { id_funcionario: string; nome: string; funcao?: string; contacto?: string; }
interface Alocacao { id_alocacao: string; funcionario: Funcionario; funcao_no_evento?: string; }

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

const botaoAvancar: Record<string, { label: string; cor: string }> = {
  em_andamento: { label: 'Marcar Terminado',    cor: 'bg-slate-600 hover:bg-slate-700' },
  terminada:    { label: 'Confirmar Devolução', cor: 'bg-green-600 hover:bg-green-700' },
};

const ESTADOS_COM_RECIBO = ['confirmada', 'em_andamento', 'terminada', 'devolvida'];

export default function ReservasFornecedorPage() {
  const { payload, loading } = useAuth('fornecedor');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [agindo, setAgindo] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  function mostrarToast(mensagem: string, tipo: 'sucesso' | 'erro' = 'erro') {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  // Modal de aceitação com alocação obrigatória
  const [modalReserva, setModalReserva] = useState<Reserva | null>(null);
  const [selecionados, setSelecionados] = useState<{ id: string; funcao: string }[]>([]);
  const [aceitando, setAceitando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  // Painel de alocação (para reservas já aceites)
  const [painelReserva, setPainelReserva] = useState<Reserva | null>(null);
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [selecionadosPainel, setSelecionadosPainel] = useState<{ id: string; funcao: string }[]>([]);
  const [alocando, setAlocando] = useState(false);

  useEffect(() => {
    if (!payload) return;
    api.get('/reservas').then((r) => setReservas(r.data)).catch(() => {}).finally(() => setFetching(false));
    api.get('/funcionarios').then((r) => setFuncionarios(r.data)).catch(() => {});
  }, [payload]);

  // ── Modal: aceitar com alocação ──
  function abrirModal(r: Reserva) {
    setModalReserva(r);
    setSelecionados([]);
    setErroModal('');
  }

  function toggleFunc(id: string) {
    setSelecionados((prev) =>
      prev.find((s) => s.id === id)
        ? prev.filter((s) => s.id !== id)
        : [...prev, { id, funcao: funcionarios.find((f) => f.id_funcionario === id)?.funcao ?? '' }]
    );
  }

  async function confirmarAceitacao() {
    if (!modalReserva) return;
    if (selecionados.length === 0) { setErroModal('Seleccione pelo menos um funcionário.'); return; }
    setAceitando(true); setErroModal('');
    try {
      // 1. Alocar funcionários
      await Promise.all(
        selecionados.map((s) =>
          api.post(`/reservas/${modalReserva.id_reserva}/alocacoes`, {
            id_funcionario: s.id,
            funcao_no_evento: s.funcao || undefined,
          })
        )
      );
      // 2. Aceitar pedido
      await api.patch(`/reservas/${modalReserva.id_reserva}/decidir`, { estado: 'confirmada' });
      setReservas((prev) => prev.map((r) => r.id_reserva === modalReserva.id_reserva ? { ...r, estado: 'confirmada' as any } : r));
      setModalReserva(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { mensagem?: string } } };
      setErroModal(e?.response?.data?.mensagem ?? 'Erro ao aceitar pedido.');
    } finally { setAceitando(false); }
  }

  // ── Rejeitar ──
  async function rejeitar(id: string) {
    if (!confirm('Rejeitar este pedido?')) return;
    setAgindo(id);
    try {
      await api.patch(`/reservas/${id}/decidir`, { estado: 'rejeitada' });
      setReservas((prev) => prev.map((r) => r.id_reserva === id ? { ...r, estado: 'rejeitada' as any } : r));
    } catch {} finally { setAgindo(null); }
  }

  // ── Avançar estado ──
  async function avancar(id: string) {
    setAgindo(id);
    try {
      const { data } = await api.patch(`/reservas/${id}/avancar`, {});
      setReservas((prev) => prev.map((r) => r.id_reserva === id ? { ...r, estado: data.estado } : r));
      if (painelReserva?.id_reserva === id) setPainelReserva((r) => r ? { ...r, estado: data.estado } : r);
    } catch {} finally { setAgindo(null); }
  }

  // ── Painel de alocação extra ──
  async function abrirPainel(r: Reserva) {
    setPainelReserva(r);
    const { data } = await api.get(`/reservas/${r.id_reserva}/alocacoes`);
    setAlocacoes(data);
    setSelecionadosPainel([]);
  }

  function togglePainel(id: string) {
    setSelecionadosPainel((prev) =>
      prev.find((s) => s.id === id)
        ? prev.filter((s) => s.id !== id)
        : [...prev, { id, funcao: funcionarios.find((f) => f.id_funcionario === id)?.funcao ?? '' }]
    );
  }

  async function alocarSelecionados() {
    if (!painelReserva || selecionadosPainel.length === 0) return;
    setAlocando(true);
    try {
      const resultados = await Promise.all(
        selecionadosPainel.map((s) =>
          api.post(`/reservas/${painelReserva.id_reserva}/alocacoes`, {
            id_funcionario: s.id,
            funcao_no_evento: s.funcao || undefined,
          })
        )
      );
      setAlocacoes((prev) => [...prev, ...resultados.map((r) => r.data)]);
      setSelecionadosPainel([]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { mensagem?: string } } };
      mostrarToast(e?.response?.data?.mensagem ?? 'Erro ao alocar funcionários.');
    } finally { setAlocando(false); }
  }

  async function removerAlocacao(id: string) {
    await api.delete(`/reservas/alocacoes/${id}`);
    setAlocacoes((prev) => prev.filter((a) => a.id_alocacao !== id));
  }

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  const filtradas = filtroEstado ? reservas.filter((r) => r.estado === filtroEstado) : reservas;
  const pendentes = reservas.filter((r) => r.estado === 'pendente').length;

  return (
    <div className="max-w-6xl flex gap-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium ${
          toast.tipo === 'sucesso' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span>{toast.tipo === 'sucesso' ? '✓' : '✕'}</span>
          <span>{toast.mensagem}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}
      {/* Tabela */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-[#e9b94e]" />
            <div>
              <h1 className="text-2xl font-bold text-[#0f2554]">Pedidos Recebidos</h1>
              <p className="text-sm text-slate-500">
                {reservas.length} no total
                {pendentes > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    {pendentes} pendente{pendentes > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none">
            <option value="">Todos</option>
            {Object.entries(estadoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {fetching ? <p className="text-slate-400 text-sm">A carregar...</p> : filtradas.length === 0 ? (
          <p className="text-slate-400 text-sm">Nenhum pedido encontrado.</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Recurso</th>
                  <th className="px-4 py-3 text-left">Organizador</th>
                  <th className="px-4 py-3 text-left">Data / Local</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((r) => (
                  <tr key={r.id_reserva}
                    onClick={() => !['pendente','rejeitada'].includes(r.estado) && abrirPainel(r)}
                    className={`transition-colors ${!['pendente','rejeitada'].includes(r.estado) ? 'cursor-pointer hover:bg-slate-50' : ''} ${painelReserva?.id_reserva === r.id_reserva ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-[#0f2554]">{r.recurso?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{r.utilizador?.nome ?? '—'}</p>
                      <p className="text-xs text-slate-400">{r.utilizador?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{new Date(r.data_reserva).toLocaleDateString('pt-PT')}</p>
                      <p className="text-xs text-slate-400">{r.horas}h · {r.local_evento ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoCor[r.estado] ?? ''}`}>
                        {estadoLabel[r.estado] ?? r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1.5">
                        {r.estado === 'pendente' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => abrirModal(r)}
                              className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">
                              Aceitar
                            </button>
                            <button onClick={() => rejeitar(r.id_reserva)} disabled={agindo === r.id_reserva}
                              className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 disabled:opacity-60">
                              Rejeitar
                            </button>
                          </div>
                        )}
                        {botaoAvancar[r.estado] && (
                          <button onClick={() => avancar(r.id_reserva)} disabled={agindo === r.id_reserva}
                            className={`px-3 py-1 text-white text-xs font-semibold rounded-lg disabled:opacity-60 transition-colors ${botaoAvancar[r.estado].cor}`}>
                            {agindo === r.id_reserva ? '...' : botaoAvancar[r.estado].label}
                          </button>
                        )}
                        {ESTADOS_COM_RECIBO.includes(r.estado) && (
                          <Link href={`/painel/fornecedor/reservas/${r.id_reserva}/recibo`}
                            className="px-3 py-1 border border-[#0f2554] text-[#0f2554] text-xs font-semibold rounded-lg hover:bg-[#0f2554] hover:text-white transition-colors text-center">
                            Ver Recibo
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Painel lateral de alocação */}
      {painelReserva && (
        <div className="w-80 shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm h-fit sticky top-6 overflow-hidden">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-[#0f2554]">Equipa do Evento</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {painelReserva.recurso?.nome} · {new Date(painelReserva.data_reserva).toLocaleDateString('pt-PT')}
              </p>
            </div>
            <button onClick={() => { setPainelReserva(null); setSelecionadosPainel([]); }}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
          </div>

          {/* Funcionários já alocados */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Alocados ({alocacoes.length})
            </p>
            {alocacoes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum funcionário alocado ainda.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {alocacoes.map((a) => (
                  <div key={a.id_alocacao}
                    className="flex items-center gap-3 bg-[#fef9e7] border border-[#e9b94e]/50 rounded-xl px-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0f2554] flex items-center justify-center shrink-0">
                      <span className="text-[#e9b94e] text-xs font-bold">
                        {a.funcionario.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#0f2554] truncate">{a.funcionario.nome}</p>
                      <p className="text-xs text-slate-400 truncate">{a.funcao_no_evento ?? a.funcionario.funcao ?? 'Sem função'}</p>
                    </div>
                    <button onClick={() => removerAlocacao(a.id_alocacao)}
                      className="text-red-400 hover:text-red-600 text-sm shrink-0" title="Remover">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seleccionar mais funcionários */}
          {['confirmada', 'em_andamento'].includes(painelReserva.estado) && (() => {
            const disponiveis = funcionarios.filter(
              (f) => !alocacoes.find((a) => a.funcionario.id_funcionario === f.id_funcionario)
            );
            return (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Adicionar funcionários
                </p>
                {disponiveis.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Todos os funcionários já estão alocados.</p>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                      {disponiveis.map((f) => {
                        const sel = selecionadosPainel.find((s) => s.id === f.id_funcionario);
                        return (
                          <div key={f.id_funcionario}
                            onClick={() => togglePainel(f.id_funcionario)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              sel ? 'border-[#0f2554] bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              sel ? 'border-[#0f2554] bg-[#0f2554]' : 'border-slate-300'
                            }`}>
                              {sel && <span className="text-white text-[10px]">✓</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#0f2554] truncate">{f.nome}</p>
                              <p className="text-xs text-slate-400">{f.funcao ?? 'Sem função definida'}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Campo de função para os seleccionados */}
                    {selecionadosPainel.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2">
                        {selecionadosPainel.map((s) => {
                          const func = funcionarios.find((f) => f.id_funcionario === s.id);
                          return (
                            <div key={s.id} className="flex items-center gap-2">
                              <span className="text-xs text-[#0f2554] font-medium truncate w-24 shrink-0">
                                {func?.nome}
                              </span>
                              <input
                                value={s.funcao}
                                onChange={(e) => setSelecionadosPainel((prev) =>
                                  prev.map((p) => p.id === s.id ? { ...p, funcao: e.target.value } : p)
                                )}
                                placeholder="Função no evento"
                                className="flex-1 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1e4db7]"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={alocarSelecionados}
                      disabled={selecionadosPainel.length === 0 || alocando}
                      className="mt-3 w-full py-2.5 bg-[#0f2554] text-white text-xs font-bold rounded-xl hover:bg-[#1a3a7a] disabled:opacity-50 transition-colors"
                    >
                      {alocando
                        ? 'A alocar...'
                        : selecionadosPainel.length === 0
                        ? 'Seleccione funcionários'
                        : `Alocar ${selecionadosPainel.length} funcionário${selecionadosPainel.length > 1 ? 's' : ''}`}
                    </button>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal — Aceitar com alocação obrigatória */}
      {modalReserva && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#0f2554]">Aceitar Pedido</h2>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-medium">{modalReserva.recurso?.nome}</span> ·{' '}
                {new Date(modalReserva.data_reserva).toLocaleDateString('pt-PT')}
              </p>
            </div>

            <div className="p-6">
              <p className="text-sm font-semibold text-[#0f2554] mb-3">
                Seleccione os funcionários para este evento <span className="text-red-500">*</span>
              </p>

              {funcionarios.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
                  Não tem funcionários registados.{' '}
                  <Link href="/painel/fornecedor/funcionarios" className="underline font-semibold">
                    Criar agora
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                  {funcionarios.map((f) => {
                    const sel = selecionados.find((s) => s.id === f.id_funcionario);
                    return (
                      <div key={f.id_funcionario}
                        onClick={() => toggleFunc(f.id_funcionario)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          sel ? 'border-[#0f2554] bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                        }`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          sel ? 'border-[#0f2554] bg-[#0f2554]' : 'border-slate-300'
                        }`}>
                          {sel && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#0f2554]">{f.nome}</p>
                          <p className="text-xs text-slate-400">{f.funcao ?? 'Sem função definida'}</p>
                        </div>
                        {sel && (
                          <input
                            value={sel.funcao}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelecionados((prev) => prev.map((s) => s.id === f.id_funcionario ? { ...s, funcao: e.target.value } : s));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Função no evento"
                            className="text-xs px-2 py-1 border border-slate-300 rounded-lg w-32 focus:outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {erroModal && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erroModal}</p>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModalReserva(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={confirmarAceitacao} disabled={aceitando || funcionarios.length === 0}
                className="flex-1 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-60">
                {aceitando ? 'A confirmar...' : `Aceitar com ${selecionados.length} funcionário${selecionados.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface Reclamacao {
  id_reclamacao: string;
  assunto: string;
  descricao: string;
  estado: string;
  resposta: string | null;
  criado_em: string;
  utilizador: { nome: string; email: string };
  reserva: { recurso: { nome: string } };
}

const estadoCor: Record<string, string> = {
  aberta:     'bg-red-100 text-red-700',
  em_analise: 'bg-yellow-100 text-yellow-700',
  resolvida:  'bg-green-100 text-green-700',
  arquivada:  'bg-slate-100 text-slate-500',
};

const estadoLabel: Record<string, string> = {
  aberta:     'Aberta',
  em_analise: 'Em Análise',
  resolvida:  'Resolvida',
  arquivada:  'Arquivada',
};

export default function ReclamacoesAdminPage() {
  const { payload, loading } = useAuth('administrador');
  const [reclamacoes, setReclamacoes] = useState<Reclamacao[]>([]);
  const [selecionada, setSelecionada] = useState<Reclamacao | null>(null);
  const [resposta, setResposta] = useState('');
  const [estado, setEstado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  function mostrarToast(mensagem: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    if (!payload) return;
    api.get('/reclamacoes')
      .then((r) => setReclamacoes(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [payload]);

  function abrirReclamacao(r: Reclamacao) {
    setSelecionada(r);
    setResposta(r.resposta ?? '');
    setEstado(r.estado);
  }

  async function guardar() {
    if (!selecionada) return;
    setGuardando(true);
    try {
      const { data } = await api.patch(`/reclamacoes/${selecionada.id_reclamacao}`, {
        estado,
        resposta: resposta || undefined,
      });
      setReclamacoes((prev) => prev.map((r) => r.id_reclamacao === data.id_reclamacao ? data : r));
      setSelecionada(data);
      mostrarToast('Resposta guardada com sucesso.');
    } catch {
      mostrarToast('Erro ao guardar a resposta.', 'erro');
    } finally { setGuardando(false); }
  }

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  const filtradas = filtro ? reclamacoes.filter((r) => r.estado === filtro) : reclamacoes;
  const abertas = reclamacoes.filter((r) => r.estado === 'aberta').length;

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
      {/* Lista */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-[#e9b94e]" />
            <div>
              <h1 className="text-2xl font-bold text-[#0f2554]">Reclamações</h1>
              <p className="text-sm text-slate-500">
                {reclamacoes.length} no total
                {abertas > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    {abertas} aberta{abertas > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none">
            <option value="">Todos os estados</option>
            {Object.entries(estadoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {fetching ? (
          <p className="text-slate-400 text-sm">A carregar...</p>
        ) : filtradas.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-500">Nenhuma reclamação encontrada.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Assunto</th>
                  <th className="px-5 py-3 text-left">Organizador</th>
                  <th className="px-5 py-3 text-left">Recurso</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-left">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((r) => (
                  <tr key={r.id_reclamacao}
                    onClick={() => abrirReclamacao(r)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${selecionada?.id_reclamacao === r.id_reclamacao ? 'bg-blue-50' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#0f2554] line-clamp-1">{r.assunto}</p>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{r.descricao}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <p>{r.utilizador.nome}</p>
                      <p className="text-xs text-slate-400">{r.utilizador.email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{r.reserva.recurso.nome}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoCor[r.estado] ?? ''}`}>
                        {estadoLabel[r.estado] ?? r.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {new Date(r.criado_em).toLocaleDateString('pt-PT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Painel de resposta */}
      {selecionada && (
        <div className="w-80 shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-fit sticky top-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#0f2554]">Detalhes</h2>
            <button onClick={() => setSelecionada(null)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
          </div>

          <div className="px-5 py-4 flex flex-col gap-4">
            {/* Info */}
            <div>
              <p className="text-xs text-slate-400 mb-1">Assunto</p>
              <p className="text-sm font-semibold text-[#0f2554]">{selecionada.assunto}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Descrição</p>
              <p className="text-sm text-slate-600 leading-relaxed">{selecionada.descricao}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">Organizador</p>
                <p className="text-xs font-medium text-slate-700">{selecionada.utilizador.nome}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Recurso</p>
                <p className="text-xs font-medium text-slate-700">{selecionada.reserva.recurso.nome}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              {/* Estado */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Estado</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none">
                  {Object.entries(estadoLabel).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Resposta */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Resposta ao organizador
                </label>
                <textarea
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  rows={5}
                  maxLength={1000}
                  placeholder="Escreva uma resposta explicando as acções tomadas..."
                  className="px-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e4db7] resize-none"
                />
                <p className="text-xs text-slate-400 text-right">{resposta.length}/1000</p>
              </div>

              <button onClick={guardar} disabled={guardando}
                className="w-full py-2.5 bg-[#0f2554] text-white text-sm font-bold rounded-xl hover:bg-[#1a3a7a] disabled:opacity-60 transition-colors">
                {guardando ? 'A guardar...' : 'Guardar Resposta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

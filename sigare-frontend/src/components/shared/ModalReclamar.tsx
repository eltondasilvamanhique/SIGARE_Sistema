'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface Props {
  idReserva: string;
  nomeRecurso: string;
  onClose: () => void;
  onSucesso: () => void;
}

export default function ModalReclamar({ idReserva, nomeRecurso, onClose, onSucesso }: Props) {
  const [assunto,   setAssunto]   = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando,  setEnviando]  = useState(false);
  const [erro,      setErro]      = useState('');

  async function submeter() {
    if (!assunto.trim() || !descricao.trim()) { setErro('Preencha todos os campos.'); return; }
    setEnviando(true); setErro('');
    try {
      await api.post(`/reservas/${idReserva}/reclamar`, { assunto, descricao });
      onSucesso();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem;
      setErro(msg ?? 'Erro ao enviar reclamação.');
    } finally { setEnviando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#0f2554]">Submeter Reclamação</h2>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{nomeRecurso}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl ml-4">✕</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Aviso */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              A sua reclamação será analisada pelo administrador do sistema e o fornecedor será notificado.
            </p>
          </div>

          {/* Assunto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Assunto <span className="text-red-500">*</span>
            </label>
            <input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              maxLength={150}
              placeholder="Ex: Recurso não correspondeu ao descrito"
              className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7] focus:border-transparent"
            />
            <p className="text-xs text-slate-400 text-right">{assunto.length}/150</p>
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Descrição detalhada <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="Descreva o problema com o máximo de detalhe possível..."
              className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7] focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-400 text-right">{descricao.length}/1000</p>
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-300 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={submeter} disabled={enviando}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60">
            {enviando ? 'A enviar...' : 'Enviar Reclamação'}
          </button>
        </div>
      </div>
    </div>
  );
}

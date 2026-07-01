'use client';

import { useState } from 'react';
import api from '@/lib/api';
import Estrelas from './Estrelas';

interface Props {
  idReserva: string;
  nomeRecurso: string;
  onClose: () => void;
  onSucesso: (nota: number) => void;
}

const labelNota: Record<number, string> = {
  1: 'Mau', 2: 'Razoável', 3: 'Bom', 4: 'Muito Bom', 5: 'Excelente',
};

export default function ModalAvaliar({ idReserva, nomeRecurso, onClose, onSucesso }: Props) {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function submeter() {
    if (nota === 0) { setErro('Seleccione uma classificação.'); return; }
    setEnviando(true);
    setErro('');
    try {
      await api.post(`/reservas/${idReserva}/avaliar`, { nota, comentario: comentario || undefined });
      onSucesso(nota);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem;
      setErro(msg ?? 'Erro ao enviar avaliação.');
    } finally {
      setEnviando(false);
    }
  }

  const notaVisual = hover || nota;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#0f2554]">Avaliar Recurso</h2>
            <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{nomeRecurso}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {/* Estrelas interactivas */}
        <div className="flex flex-col items-center gap-3 my-6">
          <div
            className="flex items-center gap-2"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHover(i)}
                onClick={() => { setNota(i); setErro(''); }}
                className="text-5xl transition-transform hover:scale-110 cursor-pointer"
                aria-label={`${i} estrelas`}
              >
                <span className={i <= notaVisual ? 'text-[#e9b94e]' : 'text-slate-200'}>★</span>
              </button>
            ))}
          </div>
          {notaVisual > 0 && (
            <p className="text-sm font-semibold text-[#0f2554]">{labelNota[notaVisual]}</p>
          )}
        </div>

        {/* Comentário */}
        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-sm font-medium text-slate-700">
            Comentário <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Como foi a sua experiência com este recurso?"
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7] resize-none"
          />
          <p className="text-xs text-slate-400 text-right">{comentario.length}/500</p>
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{erro}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submeter}
            disabled={enviando || nota === 0}
            className="flex-1 py-2.5 bg-[#0f2554] text-white text-sm font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors disabled:opacity-60"
          >
            {enviando ? 'A enviar...' : 'Enviar Avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
}

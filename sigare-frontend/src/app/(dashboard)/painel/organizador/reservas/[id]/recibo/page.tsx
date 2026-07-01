'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Funcionario { id_funcionario: string; nome: string; contacto?: string; funcao?: string; }
interface Alocacao { id_alocacao: string; funcionario: Funcionario; funcao_no_evento?: string; }
interface Recibo {
  id_reserva: string;
  data_reserva: string;
  hora_inicio?: string;
  horas: number;
  quantidade_solicitada?: number;
  local_evento?: string;
  estado: string;
  criado_em: string;
  utilizador: { nome: string; email: string; telefone?: string };
  recurso: {
    nome: string;
    descricao?: string;
    preco_hora?: number;
    preco_dia?: number;
    preco: number;
    categoria?: { nome: string };
    fornecedor: {
      nome: string;
      contacto?: string;
      endereco?: string;
      utilizador: { email: string; telefone?: string };
    };
  };
  alocacoes: Alocacao[];
}

function calcTotal(recibo: Recibo): number {
  const h = recibo.horas ?? 1;
  const qtd = recibo.quantidade_solicitada ?? 1;
  let precoUnit: number;
  if (recibo.recurso.preco_hora) {
    precoUnit = h <= 8
      ? Number(recibo.recurso.preco_hora) * h
      : Number(recibo.recurso.preco_dia ?? Number(recibo.recurso.preco_hora) * 8);
  } else {
    precoUnit = Number(recibo.recurso.preco);
  }
  return precoUnit * qtd;
}

const estadoLabel: Record<string, string> = {
  pendente: 'Pendente', confirmada: 'Confirmada', em_andamento: 'Em Andamento',
  terminada: 'Terminada', devolvida: 'Devolvida', rejeitada: 'Rejeitada',
};

export default function ReciboPage() {
  const { payload, loading } = useAuth('organizador');
  const params = useParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const [fetching, setFetching] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if (!payload) return;
    api.get(`/reservas/${params.id}/recibo`)
      .then((r) => setRecibo(r.data))
      .catch(() => router.push('/painel/organizador/reservas'))
      .finally(() => setFetching(false));
  }, [payload, params.id]);

  function imprimir() { window.print(); }

  const exportarPDF = useCallback(async () => {
    if (!printRef.current || !recibo) return;
    setExportando(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`SIGARE_Recibo_${recibo.id_reserva.slice(0, 8).toUpperCase()}.pdf`);
    } finally {
      setExportando(false);
    }
  }, [recibo]);

  if (loading || fetching) return <p className="text-slate-400">A carregar recibo...</p>;
  if (!recibo) return null;

  const total = calcTotal(recibo);
  // Extrair só YYYY-MM-DD independentemente do formato recebido
  const dataStr = recibo.data_reserva.slice(0, 10);
  const dataEvento = new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  const dataEmissao = new Date(recibo.criado_em).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl">
      {/* Acções — não aparecem na impressão */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0f2554] transition-colors"
        >
          ← Voltar
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={exportarPDF}
            disabled={exportando}
            className="px-5 py-2.5 bg-[#e9b94e] text-[#0f2554] text-sm font-bold rounded-lg hover:bg-[#d4a73c] transition-colors disabled:opacity-60"
          >
            {exportando ? 'A gerar PDF...' : '⬇️ Descarregar PDF'}
          </button>
          <button
            onClick={imprimir}
            className="px-5 py-2.5 bg-[#0f2554] text-white text-sm font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* Documento */}
      <div ref={printRef} className="bg-white rounded-xl border border-slate-200 p-8 print:shadow-none print:border-none">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6 mb-6">
          <div className="flex flex-col gap-1">
            <div className="bg-[#0f2554] rounded-xl px-4 py-2.5 inline-flex">
              <svg width="160" height="32" viewBox="0 0 330 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="30,3 56,17 56,45 30,59 4,45 4,17" fill="none" stroke="#e9b94e" strokeWidth="3"/>
                <polygon points="30,15 46,23 46,37 30,45 14,37 14,23" fill="#e9b94e" fillOpacity="0.15"/>
                <rect x="20" y="23" width="22" height="4" rx="2" fill="#e9b94e"/>
                <rect x="20" y="30" width="15" height="4" rx="2" fill="#e9b94e" opacity="0.7"/>
                <rect x="20" y="37" width="9" height="4" rx="2" fill="#e9b94e" opacity="0.4"/>
                <circle cx="38" cy="38.5" r="4.5" fill="#e9b94e"/>
                <text x="72" y="36" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="28" letterSpacing="4" fill="#ffffff">SIGARE</text>
                <rect x="72" y="41" width="254" height="1.5" rx="0.75" fill="#e9b94e"/>
                <text x="73" y="55" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="9" letterSpacing="1.5" fill="#a8bcd8">SISTEMA INTEGRADO DE GESTÃO DE EVENTOS</text>
              </svg>
            </div>
            <p className="text-xs text-slate-400 mt-1">Xai-Xai · Gaza · Moçambique</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[#0f2554]">RECIBO DE RESERVA</p>
            <p className="text-xs text-slate-400 mt-1">Nº {recibo.id_reserva.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-slate-400">Emitido em {dataEmissao}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              recibo.estado === 'confirmada' ? 'bg-blue-100 text-blue-700' :
              recibo.estado === 'devolvida' ? 'bg-green-100 text-green-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {estadoLabel[recibo.estado] ?? recibo.estado}
            </span>
          </div>
        </div>

        {/* Partes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Cliente</p>
            <p className="font-semibold text-[#0f2554]">{recibo.utilizador.nome}</p>
            <p className="text-sm text-slate-500">{recibo.utilizador.email}</p>
            {recibo.utilizador.telefone && <p className="text-sm text-slate-500">{recibo.utilizador.telefone}</p>}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Fornecedor</p>
            <p className="font-semibold text-[#0f2554]">{recibo.recurso.fornecedor.nome}</p>
            <p className="text-sm text-slate-500">{recibo.recurso.fornecedor.utilizador.email}</p>
            {recibo.recurso.fornecedor.utilizador.telefone && <p className="text-sm text-slate-500">📞 {recibo.recurso.fornecedor.utilizador.telefone}</p>}
            {recibo.recurso.fornecedor.contacto && <p className="text-sm text-slate-500">{recibo.recurso.fornecedor.contacto}</p>}
            {recibo.recurso.fornecedor.endereco && <p className="text-sm text-slate-500">{recibo.recurso.fornecedor.endereco}</p>}
          </div>
        </div>

        {/* Detalhes do evento */}
        <div className="bg-slate-50 rounded-xl p-5 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Detalhes do Evento</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Data</p>
              <p className="font-semibold text-[#0f2554]">{dataEvento}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Hora de Início</p>
              <p className="font-semibold text-[#0f2554]">
                {recibo.hora_inicio ? recibo.hora_inicio.toString().slice(11, 16) || recibo.hora_inicio.toString().slice(0, 5) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Duração</p>
              <p className="font-semibold text-[#0f2554]">{recibo.horas ?? 1} hora{(recibo.horas ?? 1) > 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Local</p>
              <p className="font-semibold text-[#0f2554]">{recibo.local_evento ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Recurso e preço */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Recurso Reservado</p>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Descrição</th>
                  <th className="px-4 py-2.5 text-left">Categoria</th>
                  <th className="px-4 py-2.5 text-right">Preço</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0f2554]">{recibo.recurso.nome}</p>
                    {recibo.recurso.descricao && <p className="text-xs text-slate-400 mt-0.5">{recibo.recurso.descricao}</p>}
                    {recibo.recurso.preco_hora && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {recibo.horas <= 8
                          ? `${recibo.horas}h × ${Number(recibo.recurso.preco_hora).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT/h${(recibo.quantidade_solicitada ?? 1) > 1 ? ` × ${recibo.quantidade_solicitada} un.` : ''}`
                          : `Diário (>8h)${(recibo.quantidade_solicitada ?? 1) > 1 ? ` × ${recibo.quantidade_solicitada} un.` : ''}`}
                      </p>
                    )}
                    {(recibo.quantidade_solicitada ?? 1) > 1 && (
                      <p className="text-xs font-semibold text-[#c9980a] mt-0.5">Quantidade: {recibo.quantidade_solicitada} unidades</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{recibo.recurso.categoria?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#0f2554]">
                    {total.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                  </td>
                </tr>
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-bold text-[#0f2554]">Total</td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-[#c9980a]">
                    {total.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Funcionários alocados */}
        {recibo.alocacoes.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Equipa Alocada</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Nome</th>
                    <th className="px-4 py-2.5 text-left">Função no Evento</th>
                    <th className="px-4 py-2.5 text-left">Contacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recibo.alocacoes.map((a) => (
                    <tr key={a.id_alocacao}>
                      <td className="px-4 py-3 font-medium text-[#0f2554]">{a.funcionario.nome}</td>
                      <td className="px-4 py-3 text-slate-500">{a.funcao_no_evento ?? a.funcionario.funcao ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{a.funcionario.contacto ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="border-t border-slate-200 pt-4 text-center">
          <p className="text-xs text-slate-400">Documento gerado pelo sistema SIGARE · Ref: {recibo.id_reserva}</p>
        </div>
      </div>
    </div>
  );
}

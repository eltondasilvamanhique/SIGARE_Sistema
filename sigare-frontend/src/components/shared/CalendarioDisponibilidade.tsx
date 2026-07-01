'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

interface DiaDispo {
  data: string;
  passado: boolean;
  quantidade_reservada: number;
  quantidade_disponivel: number;
  esgotado: boolean;
  parcial: boolean;
}

interface RespostaDisp {
  id_recurso: string;
  mes: string;
  quantidade_total: number;
  dias: DiaDispo[];
}

interface Props {
  idRecurso: string;
  nomeRecurso: string;
  onClose: () => void;
  onSelecionarDia?: (data: string) => void;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

function padZero(n: number) { return String(n).padStart(2, '0'); }
function mesStr(ano: number, mes: number) { return `${ano}-${padZero(mes)}`; }

export default function CalendarioDisponibilidade({ idRecurso, nomeRecurso, onClose, onSelecionarDia }: Props) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1); // 1-12
  const [dados, setDados] = useState<RespostaDisp | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async (a: number, m: number) => {
    setCarregando(true);
    setErro('');
    try {
      const r = await api.get(`/recursos/${idRecurso}/disponibilidade?mes=${mesStr(a, m)}`);
      setDados(r.data);
    } catch {
      setErro('Não foi possível carregar a disponibilidade.');
    } finally {
      setCarregando(false);
    }
  }, [idRecurso]);

  useEffect(() => { carregar(ano, mes); }, [carregar, ano, mes]);

  function navMes(delta: number) {
    let nm = mes + delta;
    let na = ano;
    if (nm < 1) { nm = 12; na--; }
    if (nm > 12) { nm = 1; na++; }
    setMes(nm);
    setAno(na);
    setDiaSelecionado(null);
  }

  // Calcular o dia da semana do primeiro dia do mês (0=Dom)
  const primeiroDia = dados ? new Date(dados.dias[0]?.data + 'T00:00:00').getDay() : 0;
  const mapaData: Record<string, DiaDispo> = {};
  if (dados) { for (const d of dados.dias) mapaData[d.data] = d; }

  function corDia(d: DiaDispo): string {
    if (d.passado) return 'bg-slate-100 text-slate-300 cursor-not-allowed';
    if (d.esgotado) return 'bg-red-100 text-red-400 cursor-not-allowed';
    if (d.parcial) return 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer';
    return 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer';
  }

  function tooltipDia(d: DiaDispo): string {
    if (d.passado) return 'Data passada';
    if (d.esgotado) return `Esgotado (${d.quantidade_reservada}/${dados?.quantidade_total} reservados)`;
    if (d.parcial) return `${d.quantidade_disponivel} de ${dados?.quantidade_total} disponíveis`;
    return `${d.quantidade_disponivel} disponíveis`;
  }

  const [diaSelecionado, setDiaSelecionado] = useState<DiaDispo | null>(null);

  const hoje8 = new Date(); hoje8.setHours(0,0,0,0);
  const mesAtual = mesStr(ano, mes) >= mesStr(hoje8.getFullYear(), hoje8.getMonth() + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#0f2554]">Disponibilidade</h2>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{nomeRecurso}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-4">✕</button>
        </div>

        {/* Navegação de mês */}
        <div className="flex items-center justify-between px-6 py-3">
          <button
            onClick={() => navMes(-1)}
            disabled={!mesAtual || (ano === hoje8.getFullYear() && mes === hoje8.getMonth() + 1)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 text-[#0f2554] font-bold"
          >‹</button>
          <span className="text-sm font-semibold text-[#0f2554]">{MESES[mes - 1]} {ano}</span>
          <button
            onClick={() => navMes(+1)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-[#0f2554] font-bold"
          >›</button>
        </div>

        {/* Grid do calendário */}
        <div className="px-4 pb-4">
          {/* Cabeçalho dias da semana */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {carregando ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">A carregar...</div>
          ) : erro ? (
            <div className="h-40 flex items-center justify-center text-red-500 text-sm">{erro}</div>
          ) : dados ? (
            <div className="grid grid-cols-7 gap-1">
              {/* Células vazias antes do primeiro dia */}
              {Array.from({ length: primeiroDia }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {/* Dias */}
              {dados.dias.map((d) => {
                const num = parseInt(d.data.slice(8), 10);
                const selecionado = diaSelecionado?.data === d.data;
                return (
                  <button
                    key={d.data}
                    title={tooltipDia(d)}
                    onClick={() => {
                      setDiaSelecionado(selecionado ? null : d);
                      if (!d.passado && !d.esgotado && onSelecionarDia) onSelecionarDia(d.data);
                    }}
                    className={`aspect-square rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ring-2 ${selecionado ? 'ring-[#0f2554]' : 'ring-transparent'} ${corDia(d)}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-4 justify-center flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
              <span className="text-xs text-slate-500">Disponível</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
              <span className="text-xs text-slate-500">Parcial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
              <span className="text-xs text-slate-500">Esgotado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
              <span className="text-xs text-slate-500">Passado</span>
            </div>
          </div>

          {/* Painel de info do dia clicado */}
          {diaSelecionado && dados && (
            <div className={`mt-3 rounded-xl p-3.5 border text-xs ${
              diaSelecionado.passado ? 'bg-slate-50 border-slate-200' :
              diaSelecionado.esgotado ? 'bg-red-50 border-red-200' :
              diaSelecionado.parcial ? 'bg-amber-50 border-amber-200' :
              'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-[#0f2554]">
                  {new Date(diaSelecionado.data + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  diaSelecionado.passado ? 'bg-slate-200 text-slate-500' :
                  diaSelecionado.esgotado ? 'bg-red-200 text-red-700' :
                  diaSelecionado.parcial ? 'bg-amber-200 text-amber-700' :
                  'bg-green-200 text-green-700'
                }`}>
                  {diaSelecionado.passado ? 'Passado' : diaSelecionado.esgotado ? 'Esgotado' : diaSelecionado.parcial ? 'Parcial' : 'Disponível'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded-lg py-2 px-1">
                  <p className="text-lg font-bold text-[#0f2554]">{dados.quantidade_total}</p>
                  <p className="text-[10px] text-slate-400">Total</p>
                </div>
                <div className="bg-white rounded-lg py-2 px-1">
                  <p className="text-lg font-bold text-red-500">{diaSelecionado.quantidade_reservada}</p>
                  <p className="text-[10px] text-slate-400">Reservados</p>
                </div>
                <div className="bg-white rounded-lg py-2 px-1">
                  <p className={`text-lg font-bold ${diaSelecionado.quantidade_disponivel > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                    {diaSelecionado.quantidade_disponivel}
                  </p>
                  <p className="text-[10px] text-slate-400">Disponíveis</p>
                </div>
              </div>
            </div>
          )}

          {onSelecionarDia && !diaSelecionado && (
            <p className="text-center text-xs text-slate-400 mt-2">
              Clique num dia para ver detalhes ou seleccionar a data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

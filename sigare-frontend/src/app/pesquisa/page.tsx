'use client';

import { useEffect, useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { Recurso, Categoria } from '@/types';
import { getAuthPayload } from '@/lib/auth';
import CalendarioDisponibilidade from '@/components/shared/CalendarioDisponibilidade';

/* ── Stepper ── */
const PASSOS = [
  { n: 1, label: 'Escolher Recursos', sub: 'Seleccione os recursos' },
  { n: 2, label: 'Dados do Evento',   sub: 'Informações do evento' },
  { n: 3, label: 'Revisão',           sub: 'Revise sua reserva' },
  { n: 4, label: 'Confirmar',         sub: 'Finalize sua reserva' },
];

function Stepper({ passo }: { passo: number }) {
  return (
    <div className="flex items-start gap-0 mb-8">
      {PASSOS.map((p, i) => (
        <div key={p.n} className="flex items-start flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              p.n <= passo ? 'bg-[#0f2554] text-[#e9b94e]' : 'bg-slate-200 text-slate-400'
            }`}>
              {p.n < passo ? '✓' : p.n}
            </div>
            <div className="mt-2 text-center">
              <p className={`text-xs font-semibold ${p.n <= passo ? 'text-[#0f2554]' : 'text-slate-400'}`}>{p.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{p.sub}</p>
            </div>
          </div>
          {i < PASSOS.length - 1 && (
            <div className={`flex-1 h-0.5 mt-4 mx-2 transition-colors ${p.n < passo ? 'bg-[#0f2554]' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

type RecursoExt = Recurso & {
  foto_url?: string;
  preco_hora?: number;
  preco_dia?: number;
  media_avaliacao?: number | null;
  total_avaliacoes?: number;
};

type ItemCarrinho = { recurso: RecursoExt; quantidade: number };

/* ── Card de recurso ── */
function RecursoCard({ recurso, item, onToggle, onQtd, onSelecionarData, dataFiltro }: {
  recurso: RecursoExt;
  item: ItemCarrinho | undefined;
  onToggle: (r: RecursoExt) => void;
  onQtd: (id: string, delta: number) => void;
  onSelecionarData?: (data: string) => void;
  dataFiltro?: string;
}) {
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const adicionado = !!item;
  const isFixo = !!recurso.endereco;
  const qtd = item?.quantidade ?? 1;
  const maxQtd = recurso.quantidade_disponivel ?? recurso.quantidade ?? 1;
  const esgotado = maxQtd <= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
      <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-5xl select-none relative overflow-hidden">
        {recurso.foto_url ? (
          <Image src={recurso.foto_url} alt={recurso.nome} fill className="object-cover" />
        ) : (
          <span>
            {recurso.categoria?.nome?.includes('Som') ? '🎵' :
             recurso.categoria?.nome?.includes('Palco') ? '🎪' :
             recurso.categoria?.nome?.includes('Catering') ? '🍽️' :
             recurso.categoria?.nome?.includes('Segurança') ? '🛡️' :
             recurso.categoria?.nome?.includes('Decoração') ? '🎨' :
             recurso.categoria?.nome?.includes('Transporte') ? '🚐' : '📦'}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-[#0f2554] text-sm leading-tight">{recurso.nome}</h3>
          {recurso.descricao && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{recurso.descricao}</p>
          )}
          {recurso.endereco && (
            <p className="text-xs text-[#c9980a] mt-0.5 flex items-center gap-1">📍 {recurso.endereco}</p>
          )}
          {recurso.media_avaliacao != null && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[#e9b94e] text-sm">{'★'.repeat(Math.round(recurso.media_avaliacao))}{'☆'.repeat(5 - Math.round(recurso.media_avaliacao))}</span>
              <span className="text-xs text-slate-400">{recurso.media_avaliacao} ({recurso.total_avaliacoes})</span>
            </div>
          )}
          {!dataFiltro && recurso.disponibilidade && (
            <p className="text-xs mt-1 text-slate-400 italic">Selecione uma data para ver disponibilidade real</p>
          )}
          <p className={`text-xs mt-0.5 font-medium ${!recurso.disponibilidade || esgotado ? 'text-red-500' : maxQtd <= 2 ? 'text-amber-600' : 'text-green-600'}`}>
            {!recurso.disponibilidade
              ? '● Indisponível'
              : esgotado
              ? '● Esgotado para a data seleccionada'
              : dataFiltro
              ? `● ${maxQtd} unidade${maxQtd > 1 ? 's' : ''} disponível${maxQtd > 1 ? 'is' : ''} em ${new Date(dataFiltro + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`
              : `● ${maxQtd} unidade${maxQtd > 1 ? 's' : ''} (total)`}
          </p>
        </div>

        <div className="flex flex-col gap-0.5">
          {recurso.preco_hora ? (
            <>
              <p className="text-slate-700 font-bold text-sm">
                {Number(recurso.preco_hora).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
                <span className="text-slate-400 font-normal text-xs"> MT/hora</span>
              </p>
              {recurso.preco_dia && (
                <p className="text-xs text-slate-400">
                  {Number(recurso.preco_dia).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT/dia (&gt;8h)
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-700 font-bold text-sm">
              {Number(recurso.preco).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
              <span className="text-slate-400 font-normal text-xs"> MT</span>
            </p>
          )}
        </div>

        {/* Seletor de quantidade (só quando adicionado e não é local fixo) */}
        {adicionado && !isFixo && (
          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
            <span className="text-xs text-slate-500 font-medium">Quantidade</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onQtd(recurso.id_recurso, -1)}
                disabled={qtd <= 1}
                className="w-7 h-7 rounded-full bg-white border border-slate-300 text-[#0f2554] font-bold text-sm flex items-center justify-center hover:bg-slate-100 disabled:opacity-40"
              >−</button>
              <span className="w-6 text-center text-sm font-bold text-[#0f2554]">{qtd}</span>
              <button
                onClick={() => onQtd(recurso.id_recurso, +1)}
                disabled={qtd >= maxQtd}
                className="w-7 h-7 rounded-full bg-[#0f2554] text-white font-bold text-sm flex items-center justify-center hover:bg-[#1a3a7a] disabled:opacity-40"
              >+</button>
            </div>
          </div>
        )}

        <button
          onClick={() => setMostrarCalendario(true)}
          className="w-full py-1.5 rounded-lg text-xs font-medium border border-[#0f2554] text-[#0f2554] hover:bg-[#0f2554] hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          📅 Ver Disponibilidade
        </button>

        {mostrarCalendario && (
          <CalendarioDisponibilidade
            idRecurso={recurso.id_recurso}
            nomeRecurso={recurso.nome}
            onClose={() => setMostrarCalendario(false)}
            onSelecionarDia={onSelecionarData ? (data) => {
              onSelecionarData(data);
              setMostrarCalendario(false);
            } : undefined}
          />
        )}

        <button
          onClick={() => onToggle(recurso)}
          disabled={!recurso.disponibilidade || (esgotado && !adicionado)}
          className={`w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            adicionado
              ? 'bg-[#e9b94e] text-[#0f2554]'
              : !recurso.disponibilidade || esgotado
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-[#0f2554] text-white hover:bg-[#1a3a7a]'
          }`}
        >
          🛒 {adicionado ? 'Remover ✕' : esgotado ? 'Esgotado' : 'Adicionar'}
        </button>
      </div>
    </div>
  );
}

/* ── Passo 2: Data + Horas + Local ── */
function PassoDados({ carrinho, dataInicial, onConfirmar, onVoltar }: {
  carrinho: ItemCarrinho[];
  dataInicial: string;
  onConfirmar: (data: string, horaInicio: string, horas: number, local: string) => void;
  onVoltar: () => void;
}) {
  const hoje = new Date().toISOString().split('T')[0];
  const [data, setData] = useState(dataInicial || '');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horas, setHoras] = useState(4);
  const [local, setLocal] = useState('');
  const [erroHora, setErroHora] = useState('');

  const recursos = carrinho.map(i => i.recurso);
  const enderecoFixo = recursos.length > 0 && recursos.every(r => r.endereco)
    ? recursos[0].endereco ?? ''
    : '';

  const localFinal = enderecoFixo || local;

  function validarEAvancar() {
    // Validar se hoje, hora deve ser futura
    if (data === hoje) {
      const agora = new Date();
      const [h, m] = horaInicio.split(':').map(Number);
      const horaEvento = new Date();
      horaEvento.setHours(h, m, 0, 0);
      if (horaEvento <= agora) {
        setErroHora('A hora de início selecionada já passou. Escolha uma hora futura.');
        return;
      }
    }
    setErroHora('');
    onConfirmar(data, horaInicio, horas, localFinal);
  }

  const podeAvancar = !!data && !!horaInicio && !!localFinal;

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 p-8">
      <h2 className="text-lg font-bold text-[#0f2554] mb-6">Dados do Evento</h2>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Data do Evento</label>
            <input
              type="date"
              value={data}
              min={hoje}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Hora de Início</label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => { setHoraInicio(e.target.value); setErroHora(''); }}
              className="w-full px-3 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
            />
            {erroHora && <p className="text-xs text-red-500 mt-1">{erroHora}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
            Local do Evento <span className="text-red-500">*</span>
          </label>
          {enderecoFixo ? (
            <div className="flex items-center gap-2 px-3 py-3 bg-[#fef9e7] border border-[#e9b94e] rounded-lg">
              <span className="text-lg">📍</span>
              <div>
                <p className="text-xs text-slate-400 font-medium">Localização do recurso (lugar fixo)</p>
                <p className="text-sm font-semibold text-[#0f2554]">{enderecoFixo}</p>
              </div>
            </div>
          ) : (
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Bairro 1, Xai-Xai · Praça Samora Machel · Hotel Xai-Xai..."
              className="w-full px-3 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
            />
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
            Duração (horas)
            <span className="ml-2 text-xs font-normal text-slate-400">≤8h → preço/hora · &gt;8h → preço/dia</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={24}
              value={horas}
              onChange={(e) => setHoras(Number(e.target.value))}
              className="flex-1 accent-[#0f2554]"
            />
            <span className="w-16 text-center py-1.5 px-2 bg-[#0f2554] text-white text-sm font-bold rounded-lg">
              {horas}h
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {horas <= 8 ? `Cobrado por hora (${horas} × preço/hora)` : `Cobrado diário (acima de 8h → preço/dia)`}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-[#0f2554] mb-2">Recursos seleccionados ({carrinho.length})</p>
          {carrinho.map(({ recurso, quantidade }) => (
            <p key={recurso.id_recurso} className="text-xs text-slate-600 py-0.5">
              • {recurso.nome}{quantidade > 1 ? ` × ${quantidade}` : ''}
            </p>
          ))}
        </div>

        <div className="flex gap-3 mt-2">
          <button onClick={onVoltar} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Voltar</button>
          <button
            onClick={() => podeAvancar && validarEAvancar()}
            disabled={!podeAvancar}
            className="flex-1 py-2.5 bg-[#0f2554] text-white font-bold rounded-lg text-sm hover:bg-[#1a3a7a] disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

function calcularPreco(r: RecursoExt, horas: number, quantidade: number): number {
  let precoUnit: number;
  if (r.preco_hora) {
    precoUnit = horas <= 8
      ? Number(r.preco_hora) * horas
      : Number(r.preco_dia ?? Number(r.preco_hora) * 8);
  } else {
    precoUnit = Number(r.preco);
  }
  return precoUnit * quantidade;
}

/* ── Passo 3: Revisão ── */
function PassoRevisao({ carrinho, data, horaInicio, horas, localEvento, onConfirmar, onVoltar, loading }: {
  carrinho: ItemCarrinho[];
  data: string;
  horaInicio: string;
  horas: number;
  localEvento: string;
  onConfirmar: () => void;
  onVoltar: () => void;
  loading: boolean;
}) {
  const total = carrinho.reduce((s, { recurso, quantidade }) => s + calcularPreco(recurso, horas, quantidade), 0);
  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl border border-slate-200 p-8">
      <h2 className="text-lg font-bold text-[#0f2554] mb-6">Revisão da Reserva</h2>
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex justify-between text-sm text-slate-500 pb-2 border-b border-slate-100">
          <span>Data do evento</span>
          <span className="font-semibold text-[#0f2554]">{new Date(data + 'T00:00:00').toLocaleDateString('pt-PT')}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-500 pb-2 border-b border-slate-100">
          <span>Hora de início</span>
          <span className="font-semibold text-[#0f2554]">{horaInicio}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-500 pb-2 border-b border-slate-100">
          <span>Local do evento</span>
          <span className="font-semibold text-[#0f2554] text-right max-w-[60%]">{localEvento}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-500 pb-2 border-b border-slate-100">
          <span>Duração</span>
          <span className="font-semibold text-[#0f2554]">
            {horas}h
            <span className="ml-1 text-xs font-normal text-slate-400">
              ({horas <= 8 ? 'cobrado por hora' : 'cobrado diário'})
            </span>
          </span>
        </div>
        {carrinho.map(({ recurso: r, quantidade }) => {
          const preco = calcularPreco(r, horas, quantidade);
          return (
            <div key={r.id_recurso} className="flex justify-between text-sm">
              <div>
                <span className="text-slate-700">{r.nome}</span>
                {quantidade > 1 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-[#fef9e7] text-[#c9980a] text-xs rounded font-semibold">×{quantidade}</span>
                )}
                {r.preco_hora && (
                  <span className="block text-xs text-slate-400">
                    {horas <= 8
                      ? `${horas}h × ${Number(r.preco_hora).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT/h${quantidade > 1 ? ` × ${quantidade} un.` : ''}`
                      : `diário (>8h)${quantidade > 1 ? ` × ${quantidade} un.` : ''}`}
                  </span>
                )}
              </div>
              <span className="font-medium text-slate-600">{preco.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT</span>
            </div>
          );
        })}
        <div className="flex justify-between text-sm font-bold text-[#0f2554] pt-2 border-t border-slate-200">
          <span>Total estimado</span>
          <span className="text-[#c9980a]">{total.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT</span>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onVoltar} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Voltar</button>
        <button
          onClick={onConfirmar}
          disabled={loading}
          className="flex-1 py-2.5 bg-[#e9b94e] text-[#0f2554] font-bold rounded-lg text-sm hover:bg-[#f5d07a] disabled:opacity-60"
        >
          {loading ? 'A enviar...' : 'Confirmar Reservas'}
        </button>
      </div>
    </div>
  );
}

/* ── Passo 4: Confirmação ── */
function PassoConfirmacao({ onNova }: { onNova: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
      <h2 className="text-2xl font-bold text-[#0f2554] mb-2">Reservas Enviadas!</h2>
      <p className="text-slate-500 mb-8">Os fornecedores foram notificados e irão confirmar em breve.</p>
      <div className="flex flex-col gap-3">
        <Link href="/painel/organizador/reservas" className="py-3 bg-[#0f2554] text-white font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors">
          Ver Minhas Reservas
        </Link>
        <button onClick={onNova} className="py-3 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm">
          Nova Pesquisa
        </button>
      </div>
    </div>
  );
}

/* ── Página principal ── */
function PesquisaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [passo, setPasso] = useState(1);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [dataFiltro, setDataFiltro] = useState(''); // filtro de data no passo 1
  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horas, setHoras] = useState(4);
  const [localEvento, setLocalEvento] = useState('');
  const [categoriaId, setCategoriaId] = useState(searchParams.get('categoria') ?? '');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [recursos, setRecursos] = useState<RecursoExt[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [loadingRecursos, setLoadingRecursos] = useState(false);
  const [loadingReserva, setLoadingReserva] = useState(false);
  const [pesquisado, setPesquisado] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRecursos, setTotalRecursos] = useState(0);

  const authPayload = getAuthPayload();

  useEffect(() => {
    api.get('/categorias').then((r) => setCategorias(r.data)).catch(() => {});
    if (searchParams.get('q') || searchParams.get('categoria')) pesquisar();
  }, []);

  async function pesquisar(e?: FormEvent, pg = 1) {
    e?.preventDefault();
    if (pg === 1) setPaginaAtual(1);
    setLoadingRecursos(true);
    setPesquisado(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (categoriaId) params.set('categoria', categoriaId);
      if (dataFiltro) params.set('data', dataFiltro);
      params.set('pagina', String(pg));
      params.set('limite', '12');
      const { data: res } = await api.get(`/recursos?${params.toString()}`);
      setRecursos(res.data);
      setTotalPaginas(res.totalPaginas);
      setTotalRecursos(res.total);
      setPaginaAtual(pg);
    } catch (err: unknown) {
      console.error('Erro pesquisa:', err);
      setRecursos([]);
    } finally {
      setLoadingRecursos(false);
    }
  }

  function toggleCarrinho(r: RecursoExt) {
    if (!authPayload) { router.push('/login'); return; }
    setCarrinho((prev) => {
      const exists = prev.find((x) => x.recurso.id_recurso === r.id_recurso);
      if (exists) return prev.filter((x) => x.recurso.id_recurso !== r.id_recurso);
      return [...prev, { recurso: r, quantidade: 1 }];
    });
  }

  function ajustarQuantidade(id: string, delta: number) {
    setCarrinho((prev) => prev.map((item) => {
      if (item.recurso.id_recurso !== id) return item;
      const novaQtd = Math.max(1, Math.min(item.recurso.quantidade, item.quantidade + delta));
      return { ...item, quantidade: novaQtd };
    }));
  }

  async function confirmarReservas() {
    setLoadingReserva(true);
    try {
      await Promise.all(
        carrinho.map(({ recurso: r, quantidade }) => api.post('/reservas', {
          id_recurso: r.id_recurso,
          data_reserva: data,
          hora_inicio: horaInicio,
          horas,
          quantidade_solicitada: quantidade,
          local_evento: r.endereco || localEvento,
        }))
      );
      setPasso(4);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { mensagem?: string } } };
      const msg = e?.response?.data?.mensagem ?? 'Erro ao criar reservas. Verifique se está autenticado.';
      alert(msg);
    } finally {
      setLoadingReserva(false);
    }
  }

  function reiniciar() {
    setCarrinho([]);
    setPasso(1);
    setDataFiltro('');
    setData('');
    setHoraInicio('08:00');
    setHoras(4);
    setLocalEvento('');
    setPesquisado(false);
    setRecursos([]);
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-[#0f2554] px-6 py-4 flex items-center justify-between shadow-md">
        <Link href="/" className="text-xl font-bold">
          <span className="text-white">SIGA</span><span className="text-[#e9b94e]">RE</span>
        </Link>
        <div className="flex items-center gap-4">
          {authPayload ? (
            <Link href={`/painel/organizador`} className="text-sm text-blue-200 hover:text-[#e9b94e] transition-colors">
              Painel
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-blue-200 hover:text-[#e9b94e] transition-colors">
              Entrar
            </Link>
          )}
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0f2554]">Reserva de Recursos para Eventos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Recursos disponíveis na cidade de <span className="font-semibold text-[#c9980a]">Xai-Xai, Gaza</span> — seleccione e reserve para o seu evento.
          </p>
        </div>

        {/* Stepper */}
        <Stepper passo={passo} />

        {/* Passo 1 — Lista de recursos */}
        {passo === 1 && (
          <>
            {/* Barra de pesquisa + carrinho */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center">
              <form onSubmit={pesquisar} className="flex gap-3 flex-1 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Pesquisar recurso em Xai-Xai..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-slate-400">Categoria</label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="pl-3 pr-8 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e4db7] min-w-[140px]"
                  >
                    <option value="">Todas</option>
                    {categorias.map((c) => (
                      <option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-slate-400">Data do evento</label>
                  <input
                    type="date"
                    value={dataFiltro}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDataFiltro(e.target.value)}
                    className="pl-3 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
                  />
                </div>
                <button type="submit" className="px-5 py-2.5 bg-[#0f2554] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3a7a] transition-colors">
                  Pesquisar
                </button>
              </form>

              {carrinho.length > 0 && (
                <button
                  onClick={() => setPasso(2)}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#e9b94e] text-[#0f2554] font-bold rounded-lg hover:bg-[#fef9e7] transition-colors text-sm whitespace-nowrap"
                >
                  🛒 Ver carrinho ({carrinho.reduce((s, i) => s + i.quantidade, 0)} it.)
                </button>
              )}
            </div>

            {loadingRecursos && <p className="text-slate-400 text-sm py-8 text-center">A pesquisar...</p>}

            {!loadingRecursos && pesquisado && recursos.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-slate-500">Nenhum recurso encontrado para esta pesquisa em Xai-Xai.</p>
              </div>
            )}

            {!loadingRecursos && !pesquisado && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🎪</p>
                <p className="text-slate-500 font-medium">Pesquise recursos para o seu evento em Xai-Xai</p>
                <p className="text-slate-400 text-sm mt-1">Tendas, palcos, som, decoração e muito mais.</p>
              </div>
            )}

            {recursos.length > 0 && (
              <>
                {!dataFiltro && (
                  <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                    <span className="text-lg">📅</span>
                    <span>
                      <strong>Selecione uma data</strong> no filtro acima para ver a disponibilidade real para o seu evento.
                      As unidades mostradas são o total cadastrado, sem considerar reservas existentes.
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {recursos.map((r) => (
                    <RecursoCard
                      key={r.id_recurso}
                      recurso={r}
                      item={carrinho.find((i) => i.recurso.id_recurso === r.id_recurso)}
                      onToggle={toggleCarrinho}
                      onQtd={ajustarQuantidade}
                      dataFiltro={dataFiltro}
                      onSelecionarData={(d) => {
                        setDataFiltro(d);
                        const jaAdicionado = carrinho.some((x) => x.recurso.id_recurso === r.id_recurso);
                        if (!jaAdicionado) toggleCarrinho(r);
                      }}
                    />
                  ))}
                </div>
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      disabled={paginaAtual === 1 || loadingRecursos}
                      onClick={() => pesquisar(undefined, paginaAtual - 1)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      ← Anterior
                    </button>
                    <span className="text-sm text-slate-500">
                      Página {paginaAtual} de {totalPaginas} · {totalRecursos} resultados
                    </span>
                    <button
                      disabled={paginaAtual === totalPaginas || loadingRecursos}
                      onClick={() => pesquisar(undefined, paginaAtual + 1)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      Próximo →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Passo 2 */}
        {passo === 2 && (
          <PassoDados
            carrinho={carrinho}
            dataInicial={dataFiltro}
            onConfirmar={(d, h, hrs, loc) => {
              setData(d);
              setHoraInicio(h);
              setHoras(hrs);
              setLocalEvento(loc);
              setPasso(3);
            }}
            onVoltar={() => setPasso(1)}
          />
        )}

        {/* Passo 3 */}
        {passo === 3 && (
          <PassoRevisao
            carrinho={carrinho}
            data={data}
            horaInicio={horaInicio}
            horas={horas}
            localEvento={localEvento}
            onConfirmar={confirmarReservas}
            onVoltar={() => setPasso(2)}
            loading={loadingReserva}
          />
        )}

        {/* Passo 4 */}
        {passo === 4 && <PassoConfirmacao onNova={reiniciar} />}
      </div>
    </div>
  );
}

export default function PesquisaPage() {
  return (
    <Suspense>
      <PesquisaContent />
    </Suspense>
  );
}

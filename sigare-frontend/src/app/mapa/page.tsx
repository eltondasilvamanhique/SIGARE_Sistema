'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import api from '@/lib/api';
import type { PinRecurso } from '@/components/shared/MapaRecursos';

// Carregamento dinâmico: Leaflet não funciona no SSR
const MapaRecursos = dynamic(() => import('@/components/shared/MapaRecursos'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-slate-100 rounded-xl" style={{ height: '520px' }}>
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-4 border-[#0f2554] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">A carregar mapa...</p>
      </div>
    </div>
  ),
});

interface RecursoAPI {
  id_recurso: string;
  nome: string;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  foto_url?: string | null;
  preco_hora?: number | null;
  preco_dia?: number | null;
  categoria: { nome: string };
}

export default function MapaPage() {
  const [pins, setPins] = useState<PinRecurso[]>([]);
  const [todos, setTodos] = useState<RecursoAPI[]>([]);
  const [focoId, setFocoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  useEffect(() => {
    api.get('/recursos')
      .then((r) => {
        const locais: RecursoAPI[] = r.data.filter(
          (rec: RecursoAPI) => rec.endereco && rec.latitude != null && rec.longitude != null
        );
        setTodos(locais);
        setPins(locais.map((rec) => ({
          id: rec.id_recurso,
          nome: rec.nome,
          endereco: rec.endereco!,
          latitude: rec.latitude!,
          longitude: rec.longitude!,
          foto_url: rec.foto_url,
          categoria: rec.categoria.nome,
          preco_hora: rec.preco_hora,
          preco_dia: rec.preco_dia,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categorias = [...new Set(todos.map((r) => r.categoria.nome))].sort();

  const pinsFiltrados = filtroCategoria
    ? pins.filter((p) => p.categoria === filtroCategoria)
    : pins;

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header */}
      <header className="bg-[#0f2554] text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-bold">
            <span className="text-white">SIGA</span><span className="text-[#e9b94e]">RE</span>
          </Link>
          <span className="text-blue-300 text-sm hidden sm:inline">/ Mapa de Locais</span>
        </div>
        <Link
          href="/pesquisa"
          className="text-sm text-blue-200 hover:text-white transition-colors"
        >
          Pesquisar recursos
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Título */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0f2554]">Mapa de Locais para Eventos</h1>
            <p className="text-sm text-slate-500 mt-1">
              📍 Xai-Xai, Gaza — {loading ? '...' : `${pinsFiltrados.length} local${pinsFiltrados.length !== 1 ? 'is' : ''} disponível${pinsFiltrados.length !== 1 ? 'is' : ''}`}
            </p>
          </div>
          {/* Filtro de categoria */}
          {categorias.length > 0 && (
            <select
              value={filtroCategoria}
              onChange={(e) => { setFiltroCategoria(e.target.value); setFocoId(null); }}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista lateral */}
          <div className="lg:col-span-1 flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
            {loading && (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            )}
            {!loading && pinsFiltrados.length === 0 && (
              <div className="text-center text-slate-400 py-12">
                <p className="text-4xl mb-3">🗺️</p>
                <p className="text-sm">Nenhum local com coordenadas definidas.</p>
                <p className="text-xs mt-1 text-slate-300">
                  Os fornecedores devem adicionar lat/lng aos locais fixos.
                </p>
              </div>
            )}
            {pinsFiltrados.map((pin) => (
              <button
                key={pin.id}
                onClick={() => setFocoId(focoId === pin.id ? null : pin.id)}
                className={`text-left w-full rounded-xl border p-4 transition-all hover:shadow-md ${
                  focoId === pin.id
                    ? 'border-[#e9b94e] bg-[#fef9e7] shadow-md'
                    : 'border-slate-200 bg-white hover:border-[#e9b94e]'
                }`}
              >
                <div className="flex gap-3">
                  {pin.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pin.foto_url}
                      alt={pin.nome}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                      🏛️
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0f2554] text-sm truncate">{pin.nome}</p>
                    <span className="text-[10px] bg-[#eff6ff] text-[#1e40af] px-2 py-0.5 rounded-full font-medium">
                      {pin.categoria}
                    </span>
                    <p className="text-xs text-slate-500 mt-1 truncate">📍 {pin.endereco}</p>
                    {pin.preco_hora && (
                      <p className="text-xs font-semibold text-[#0f2554] mt-0.5">
                        {Number(pin.preco_hora).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT/h
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Mapa */}
          <div className="lg:col-span-2">
            <MapaRecursos recursos={pinsFiltrados} altura="560px" focoId={focoId} />
          </div>
        </div>

        {/* Link para reserva */}
        <div className="mt-6 bg-[#0f2554] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">Encontrou o local ideal?</p>
            <p className="text-blue-300 text-sm">Reserve agora na plataforma SIGARE</p>
          </div>
          <Link
            href="/pesquisa"
            className="px-6 py-2.5 bg-[#e9b94e] text-[#0f2554] font-bold rounded-lg hover:bg-[#d4a73c] transition-colors text-sm whitespace-nowrap"
          >
            Ver todos os recursos →
          </Link>
        </div>
      </div>
    </div>
  );
}

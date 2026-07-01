'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getAuthPayload, painelPorTipo } from '@/lib/auth';

const categorias = [
  { nome: 'Palcos e Tendas', icone: '🎪', slug: 'palcos-tendas' },
  { nome: 'Som e Iluminação', icone: '🎵', slug: 'som-iluminacao' },
  { nome: 'Catering', icone: '🍽️', slug: 'catering' },
  { nome: 'Segurança', icone: '🛡️', slug: 'seguranca' },
  { nome: 'Decoração', icone: '🎨', slug: 'decoracao' },
  { nome: 'Transporte', icone: '🚐', slug: 'transporte' },
];

interface PublicoStats {
  total_fornecedores: number;
  total_recursos: number;
  total_reservas_confirmadas: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<PublicoStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Se já há sessão activa, ir directo ao painel
    const payload = getAuthPayload();
    if (payload) {
      router.replace(painelPorTipo(payload.tipo));
      return;
    }
    api.get('/relatorios/publico').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <main className="flex flex-col min-h-screen bg-[#f8f9fc]">

      {/* Navbar */}
      <header className="bg-[#0f2554] px-6 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-white">SIGA</span><span className="text-[#e9b94e]">RE</span>
        </span>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/mapa" className="text-blue-200 hover:text-[#e9b94e] transition-colors">
            🗺️ Mapa
          </Link>
          <Link href="/pesquisa" className="text-blue-200 hover:text-[#e9b94e] transition-colors">
            Pesquisar Recursos
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg border border-[#e9b94e] text-[#e9b94e] hover:bg-[#e9b94e] hover:text-[#0f2554] transition-colors font-medium"
          >
            Entrar
          </Link>
          <Link
            href="/registar"
            className="px-4 py-2 rounded-lg bg-[#e9b94e] text-[#0f2554] font-bold hover:bg-[#f5d07a] transition-colors"
          >
            Registar
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0f2554] via-[#1a3a7a] to-[#1e4db7] text-white py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #e9b94e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #e9b94e 0%, transparent 40%)' }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Cidade */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-[#e9b94e]">📍</span>
            <span className="text-[#e9b94e] text-sm font-semibold tracking-widest uppercase">
              Xai-Xai · Província de Gaza · Moçambique
            </span>
          </div>

          <span className="inline-block px-4 py-1 bg-[#e9b94e]/20 border border-[#e9b94e]/40 text-[#e9b94e] text-xs font-semibold rounded-full mb-6 tracking-widest uppercase">
            Plataforma Oficial de Gestão de Eventos
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            Reserve Recursos para os Seus<br />
            <span className="text-[#e9b94e]">Eventos em Xai-Xai</span>
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            O SIGARE conecta organizadores de eventos com os melhores fornecedores
            de palcos, som, decoração, catering e muito mais — tudo na cidade de Xai-Xai.
          </p>

          {/* Barra de pesquisa */}
          <form action="/pesquisa" method="GET"
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <input
              name="q"
              type="text"
              placeholder="O que precisa para o seu evento em Xai-Xai?"
              className="flex-1 px-4 py-3 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#e9b94e] shadow"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#e9b94e] text-[#0f2554] font-bold rounded-lg hover:bg-[#f5d07a] transition-colors shadow whitespace-nowrap"
            >
              🔍 Pesquisar
            </button>
          </form>
        </div>
      </section>

      {/* Estatísticas em tempo real */}
      <section className="bg-white border-b border-slate-200 py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            {
              valor: stats ? stats.total_fornecedores.toString() : '—',
              label: 'Fornecedores Activos',
              cor: 'text-[#0f2554]',
            },
            {
              valor: stats ? stats.total_recursos.toString() : '—',
              label: 'Recursos Disponíveis',
              cor: 'text-[#0f2554]',
            },
            {
              valor: stats ? stats.total_reservas_confirmadas.toString() : '—',
              label: 'Eventos Realizados',
              cor: 'text-[#c9980a]',
            },
          ].map((s) => (
            <div key={s.label}>
              <p className={`text-4xl font-bold ${s.cor}`}>{s.valor}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[#0f2554]">Categorias em Destaque</h2>
          <p className="text-slate-500 text-sm mt-2">Explore os recursos disponíveis para o seu evento em Xai-Xai</p>
          <div className="w-16 h-1 bg-[#e9b94e] mx-auto mt-3 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categorias.map((cat) => (
            <Link
              key={cat.slug}
              href={`/pesquisa?q=${encodeURIComponent(cat.nome)}`}
              className="flex flex-col items-center gap-3 p-5 bg-white rounded-xl border border-slate-200 hover:border-[#e9b94e] hover:shadow-md transition-all group"
            >
              <span className="text-3xl">{cat.icone}</span>
              <span className="text-sm font-medium text-slate-700 group-hover:text-[#0f2554] text-center">
                {cat.nome}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-white border-y border-slate-200 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-2xl font-bold text-[#0f2554]">Como Funciona</h2>
          <p className="text-slate-500 text-sm mt-2">Simples, rápido e seguro — para organizadores em Xai-Xai</p>
          <div className="w-16 h-1 bg-[#e9b94e] mx-auto mt-3 rounded-full" />
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            { num: '01', titulo: 'Registe-se', desc: 'Crie a sua conta como organizador ou fornecedor em Xai-Xai.' },
            { num: '02', titulo: 'Pesquise', desc: 'Encontre palcos, som, tendas, decoração e muito mais.' },
            { num: '03', titulo: 'Reserve', desc: 'Envie o pedido de reserva com a data e local do evento.' },
            { num: '04', titulo: 'Realize', desc: 'O fornecedor confirma, aloca equipa e o evento acontece.' },
          ].map((p) => (
            <div key={p.num} className="text-center p-6">
              <div className="w-12 h-12 bg-[#0f2554] text-[#e9b94e] rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                {p.num}
              </div>
              <h3 className="font-semibold text-[#0f2554] mb-2">{p.titulo}</h3>
              <p className="text-slate-500 text-sm">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Duplo CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* CTA Organizador */}
          <div className="bg-gradient-to-br from-[#0f2554] to-[#1a3a7a] rounded-2xl p-8 text-white text-center">
            <div className="text-4xl mb-4">🎪</div>
            <h3 className="text-xl font-bold mb-2">Organiza Eventos?</h3>
            <p className="text-blue-200 text-sm mb-6">
              Encontre e reserve todos os recursos que precisa para o seu evento em Xai-Xai num só lugar.
            </p>
            <Link
              href="/registar"
              className="inline-block px-6 py-3 bg-[#e9b94e] text-[#0f2554] font-bold rounded-lg hover:bg-[#f5d07a] transition-colors"
            >
              Começar a Reservar
            </Link>
          </div>
          {/* CTA Fornecedor */}
          <div className="bg-white border-2 border-[#e9b94e] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-xl font-bold text-[#0f2554] mb-2">Fornece Recursos?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Registe os seus recursos e comece a receber pedidos de reserva de organizadores em Xai-Xai.
            </p>
            <Link
              href="/registar?tipo=fornecedor"
              className="inline-block px-6 py-3 bg-[#0f2554] text-white font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors"
            >
              Registar como Fornecedor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f2554] py-8 px-6 text-center mt-auto">
        <p className="text-white text-sm font-bold">
          <span className="text-white">SIGA</span><span className="text-[#e9b94e]">RE</span>
        </p>
        <p className="text-blue-300 text-xs mt-1">
          Sistema Integrado de Gestão e Alocação de Recursos para Eventos · Xai-Xai, Gaza, Moçambique
        </p>
        <p className="text-blue-400 text-xs mt-2">© {new Date().getFullYear()} Câmara Municipal de Xai-Xai</p>
      </footer>
    </main>
  );
}

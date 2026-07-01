'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setToken, painelPorTipo, getAuthPayload } from '@/lib/auth';
import { TipoUtilizador } from '@/types';
import LogoSigare from '@/components/shared/LogoSigare';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const payload = getAuthPayload();
    if (payload) router.replace(painelPorTipo(payload.tipo));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, senha });
      setToken(data.token);
      router.push(painelPorTipo(data.tipo as TipoUtilizador));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem;
      setErro(msg ?? 'Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ════════════════════════════════
          PAINEL ESQUERDO
      ════════════════════════════════ */}
      <div className="hidden lg:flex w-[55%] bg-[#0f2554] flex-col relative overflow-hidden">

        {/* Camadas de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2554] via-[#0c1e47] to-[#07122e]" />

        {/* Grid de pontos */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #e9b94e 1.2px, transparent 1.2px)', backgroundSize: '28px 28px' }} />

        {/* Brilhos */}
        <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-[#1e4db7] rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-96 h-96 bg-[#e9b94e] rounded-full opacity-[0.05] blur-3xl" />

        {/* Forma geométrica decorativa */}
        <svg className="absolute right-0 top-0 h-full opacity-[0.04]" viewBox="0 0 300 800" fill="none">
          <circle cx="300" cy="200" r="220" stroke="#e9b94e" strokeWidth="1"/>
          <circle cx="300" cy="200" r="160" stroke="#e9b94e" strokeWidth="1"/>
          <circle cx="300" cy="200" r="100" stroke="#e9b94e" strokeWidth="1"/>
          <circle cx="300" cy="600" r="180" stroke="white" strokeWidth="0.8"/>
          <circle cx="300" cy="600" r="120" stroke="white" strokeWidth="0.8"/>
        </svg>

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col h-full px-14 py-12">

          {/* Logo tipo com ícone ao lado */}
          <div className="flex items-center">
            <LogoSigare variante="compacto" altura={44} />
          </div>

          {/* Texto central */}
          <div className="flex-1 flex flex-col justify-center gap-8">

            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-px bg-[#e9b94e]" />
                <span className="text-[#e9b94e] text-xs font-bold tracking-[0.2em] uppercase">Plataforma Oficial</span>
              </div>
              <h1 className="text-[3.2rem] font-black text-white leading-[1.08] mb-5">
                Gestão de<br />
                <span className="text-[#e9b94e]">Recursos</span><br />
                para Eventos
              </h1>
              <p className="text-blue-300 text-[15px] leading-relaxed max-w-[340px]">
                Plataforma municipal que conecta organizadores de eventos com os melhores fornecedores da cidade de Xai-Xai, Gaza.
              </p>
            </div>

            {/* Linha divisória */}
            <div className="w-12 h-[2px] bg-[#e9b94e] rounded-full" />

            {/* Funcionalidades */}
            <div className="flex flex-col gap-4">
              {[
                { icon: '🔍', titulo: 'Pesquisa de Recursos', desc: 'Palcos, som, tendas, decoração e muito mais' },
                { icon: '📅', titulo: 'Reserva Online', desc: 'Defina data, hora e local do evento' },
                { icon: '🔔', titulo: 'Notificações em Tempo Real', desc: 'Acompanhe cada passo da reserva' },
                { icon: '📊', titulo: 'Relatórios Detalhados', desc: 'Visibilidade total sobre os seus recursos' },
              ].map((f) => (
                <div key={f.titulo} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-lg shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-none mb-0.5">{f.titulo}</p>
                    <p className="text-blue-400 text-xs">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
            <p className="text-blue-500 text-xs">© {new Date().getFullYear()} Câmara Municipal de Xai-Xai</p>
            <span className="text-blue-500 text-xs">Xai-Xai · Gaza · Moçambique</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          PAINEL DIREITO — formulário
      ════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center bg-[#f8f9fc] px-8 py-12">
        <div className="w-full max-w-[360px]">

          {/* Logo mobile */}
          <div className="flex justify-center mb-10 lg:hidden">
            <div className="bg-[#0f2554] rounded-2xl px-6 py-4">
              <LogoSigare variante="compacto" altura={38} />
            </div>
          </div>

          {/* Cabeçalho */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#0f2554] mb-1">Bem-vindo de volta</h2>
            <p className="text-slate-500 text-sm">Entre na sua conta para continuar</p>
          </div>

          {/* Formulário simples */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="exemplo@email.com"
                className="px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2554] focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Senha</label>
                <Link href="/recuperar-senha" className="text-xs text-[#1e4db7] hover:underline font-medium">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2554] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {mostrarSenha ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm text-red-600">{erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-3 bg-[#0f2554] text-white font-bold rounded-xl hover:bg-[#1a3a7a] transition-colors disabled:opacity-60 shadow-md shadow-[#0f2554]/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  A entrar...
                </>
              ) : 'Entrar'}
            </button>

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[#f8f9fc] text-xs text-slate-400">ou</span>
              </div>
            </div>

            <Link
              href="/registar"
              className="py-3 border-2 border-[#e9b94e] text-[#0f2554] font-bold rounded-xl hover:bg-[#fef9e7] transition-colors text-center text-sm"
            >
              Criar nova conta
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

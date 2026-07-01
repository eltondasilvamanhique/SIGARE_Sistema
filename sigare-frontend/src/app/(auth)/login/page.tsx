'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setToken, painelPorTipo, getAuthPayload } from '@/lib/auth';
import { TipoUtilizador } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
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

      {/* ══════════════════════════════════
          PAINEL ESQUERDO
      ══════════════════════════════════ */}
      <div className="hidden lg:flex w-[52%] bg-[#0c1a3d] flex-col relative overflow-hidden">

        {/* Fundo gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1a3d] via-[#0f2554] to-[#081430]" />

        {/* Círculos decorativos subtis */}
        <svg className="absolute right-[-60px] top-[-60px] opacity-[0.07]" width="500" height="500" viewBox="0 0 500 500" fill="none">
          <circle cx="250" cy="250" r="240" stroke="#e9b94e" strokeWidth="1"/>
          <circle cx="250" cy="250" r="180" stroke="#e9b94e" strokeWidth="1"/>
          <circle cx="250" cy="250" r="120" stroke="#e9b94e" strokeWidth="1"/>
        </svg>
        <svg className="absolute left-[-80px] bottom-[-80px] opacity-[0.05]" width="400" height="400" viewBox="0 0 400 400" fill="none">
          <circle cx="200" cy="200" r="190" stroke="white" strokeWidth="1"/>
          <circle cx="200" cy="200" r="130" stroke="white" strokeWidth="1"/>
        </svg>

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">

          {/* Logo */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {/* Hexágono */}
              <svg width="48" height="48" viewBox="0 0 60 60" fill="none">
                <polygon points="30,3 56,17 56,45 30,59 4,45 4,17" fill="none" stroke="#e9b94e" strokeWidth="2.5"/>
                <polygon points="30,14 47,23 47,38 30,47 13,38 13,23" fill="#e9b94e" fillOpacity="0.12"/>
                <rect x="19" y="22" width="23" height="4" rx="2" fill="#e9b94e"/>
                <rect x="19" y="29" width="16" height="4" rx="2" fill="#e9b94e" opacity="0.7"/>
                <rect x="19" y="36" width="10" height="4" rx="2" fill="#e9b94e" opacity="0.4"/>
                <circle cx="38" cy="38" r="4" fill="#e9b94e"/>
              </svg>
              <div>
                <p className="text-white text-xl font-black tracking-[0.15em]">SIGARE</p>
                <p className="text-[#8fa8cc] text-[10px] tracking-[0.15em] uppercase">Gestão de Eventos</p>
              </div>
            </div>
            {/* Badge Plataforma Oficial */}
            <div className="flex items-center gap-2 mt-1">
              <div className="h-px w-8 bg-[#e9b94e]" />
              <span className="text-[#e9b94e] text-[10px] font-bold tracking-[0.2em] uppercase">Plataforma Oficial</span>
            </div>
          </div>

          {/* Texto central */}
          <div className="flex-1 flex flex-col justify-center gap-8">
            <div>
              <h1 className="text-[3rem] font-black text-white leading-[1.1] mb-4">
                Gestão de<br />
                <span className="text-[#e9b94e]">Recursos</span><br />
                para Eventos
              </h1>
              <div className="w-10 h-[3px] bg-[#e9b94e] rounded-full mb-4" />
              <p className="text-[#8fa8cc] text-[14px] leading-relaxed max-w-[320px]">
                Plataforma municipal que conecta organizadores de eventos com os melhores fornecedores da cidade de Xai-Xai, Gaza.
              </p>
            </div>

            {/* Funcionalidades */}
            <div className="flex flex-col gap-4">
              {[
                {
                  titulo: 'Pesquisa de Recursos',
                  desc: 'Palcos, som, tendas, decoração e muito mais',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e9b94e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  ),
                },
                {
                  titulo: 'Reserva Online',
                  desc: 'Defina data, hora e local do evento',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e9b94e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  ),
                },
                {
                  titulo: 'Notificações em Tempo Real',
                  desc: 'Acompanhe cada passo da reserva',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e9b94e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  ),
                },
              ].map((f) => (
                <div key={f.titulo} className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#1a2f5e] border border-white/[0.08] flex items-center justify-center shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-none mb-0.5">{f.titulo}</p>
                    <p className="text-[#8fa8cc] text-xs">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex items-center gap-2 pt-6 border-t border-white/[0.07]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8fa8cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p className="text-[#8fa8cc] text-xs">
              Seguro, confiável e feito para <span className="text-[#e9b94e] font-semibold">você</span>.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          PAINEL DIREITO — formulário
      ══════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center bg-[#f0f2f7] px-6 py-10">
        <div className="w-full max-w-[420px]">

          {/* Card branco */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 px-8 py-9">

            {/* Avatar ícone */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e4db7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>

            <h2 className="text-[1.45rem] font-black text-[#0f2554] text-center mb-1">Bem-vindo de volta</h2>
            <p className="text-slate-400 text-sm text-center mb-7">Entre na sua conta para continuar</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="exemplo@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e4db7] focus:border-transparent transition-all text-slate-700"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Senha</label>
                  <Link href="/recuperar-senha" className="text-xs text-[#1e4db7] hover:underline font-medium">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    placeholder="••••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e4db7] focus:border-transparent transition-all text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {mostrarSenha ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Lembrar-me */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-[#1e4db7] cursor-pointer"
                />
                <span className="text-sm text-slate-600">Lembrar-me</span>
              </label>

              {/* Erro */}
              {erro && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-sm text-red-600">{erro}</p>
                </div>
              )}

              {/* Botão entrar */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 py-3.5 bg-[#0f2554] text-white font-bold rounded-xl hover:bg-[#1a3a7a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2.5 text-[15px]"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    A entrar...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Entrar
                  </>
                )}
              </button>
            </form>

            {/* Criar conta */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-xs text-slate-400">ou</span>
              </div>
            </div>

            <Link
              href="/registar"
              className="flex items-center justify-center gap-2 py-3 border-2 border-[#e9b94e] text-[#0f2554] font-bold rounded-xl hover:bg-[#fef9e7] transition-colors text-sm"
            >
              Criar nova conta
            </Link>

            {/* Suporte */}
            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5">Precisa de ajuda?</p>
              <div className="flex flex-col gap-2">
                <a href="tel:+258834240932" className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-[#1e4db7] transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1e4db7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </span>
                  +258 83 424 0932
                </a>
                <a href="mailto:eltondasilvamanhique@gmail.com" className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-[#1e4db7] transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1e4db7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  eltondasilvamanhique@gmail.com
                </a>
              </div>
            </div>

            {/* Nota de segurança */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <p className="text-xs text-slate-400">Seus dados estão protegidos com segurança.</p>
            </div>
          </div>

          {/* Logo mobile */}
          <div className="flex justify-center mt-6 lg:hidden">
            <p className="text-xs text-slate-400">SIGARE · Xai-Xai · Gaza · Moçambique</p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LogoSigare from '@/components/shared/LogoSigare';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await api.post('/auth/recuperar-senha', { email });
      setEnviado(true);
    } catch {
      setErro('Ocorreu um erro. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fc]">
      <div className="hidden lg:flex w-1/2 bg-[#0f2554] flex-col items-center justify-center p-12 text-center">
        <LogoSigare variante="completo" altura={58} />
        <div className="w-16 h-0.5 bg-[#e9b94e] opacity-50 rounded-full my-8" />
        <p className="text-blue-200 text-base leading-relaxed max-w-xs">
          Plataforma municipal de gestão e alocação de recursos para eventos em Xai-Xai, Gaza.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 lg:hidden bg-[#0f2554] rounded-2xl py-5 px-6">
            <LogoSigare variante="completo" altura={48} />
          </div>

          {enviado ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-[#0f2554] mb-2">Email enviado!</h2>
              <p className="text-slate-500 text-sm mb-6">
                Se o email existir na plataforma, receberá um link de recuperação em breve.
                Verifique também a pasta de spam.
              </p>
              <Link
                href="/login"
                className="block py-3 bg-[#0f2554] text-white font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors text-center text-sm"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#0f2554] mb-1">Recuperar senha</h2>
              <p className="text-slate-500 text-sm mb-8">
                Introduza o seu email e enviaremos um link para redefinir a senha.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="exemplo@email.com"
                    className="px-3 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7] focus:border-transparent"
                  />
                </div>

                {erro && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {erro}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 py-3 bg-[#0f2554] text-white font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors disabled:opacity-60 shadow"
                >
                  {loading ? 'A enviar...' : 'Enviar link de recuperação'}
                </button>

                <Link
                  href="/login"
                  className="py-3 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-center text-sm"
                >
                  Voltar ao login
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

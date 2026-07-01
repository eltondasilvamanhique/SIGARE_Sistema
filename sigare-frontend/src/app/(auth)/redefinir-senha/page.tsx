'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import LogoSigare from '@/components/shared/LogoSigare';

function RedefinirSenhaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/redefinir-senha', { token, novaSenha });
      setSucesso(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem;
      setErro(msg ?? 'Erro ao redefinir senha. O link pode ter expirado.');
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

          {!token ? (
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-[#0f2554] mb-2">Link inválido</h2>
              <p className="text-slate-500 text-sm mb-6">
                Este link de recuperação é inválido. Solicite um novo.
              </p>
              <Link href="/recuperar-senha" className="block py-3 bg-[#0f2554] text-white font-bold rounded-lg text-center text-sm">
                Solicitar novo link
              </Link>
            </div>
          ) : sucesso ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-[#0f2554] mb-2">Senha redefinida!</h2>
              <p className="text-slate-500 text-sm mb-6">
                A sua senha foi atualizada com sucesso. A redirecionar para o login...
              </p>
              <Link href="/login" className="block py-3 bg-[#0f2554] text-white font-bold rounded-lg text-center text-sm">
                Ir para o login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#0f2554] mb-1">Nova senha</h2>
              <p className="text-slate-500 text-sm mb-8">Escolha uma nova senha para a sua conta.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Nova senha</label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="px-3 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7] focus:border-transparent"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Confirmar senha</label>
                  <input
                    type="password"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    required
                    placeholder="Repita a nova senha"
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
                  {loading ? 'A guardar...' : 'Guardar nova senha'}
                </button>

                <Link href="/login" className="py-3 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-center text-sm">
                  Cancelar
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <RedefinirSenhaContent />
    </Suspense>
  );
}

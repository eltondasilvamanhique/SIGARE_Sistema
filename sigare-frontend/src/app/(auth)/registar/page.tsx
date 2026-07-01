'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { setToken, painelPorTipo } from '@/lib/auth';
import { TipoUtilizador } from '@/types';
import LogoSigare from '@/components/shared/LogoSigare';

const TIPOS: { value: TipoUtilizador; label: string; desc: string }[] = [
  { value: 'organizador', label: 'Organizador de Evento', desc: 'Reserva recursos para os seus eventos' },
  { value: 'fornecedor', label: 'Fornecedor de Recursos', desc: 'Oferece equipamentos e serviços' },
];

function ModalTermos({ onFechar }: { onFechar: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#0f2554]">Termos e Condições de Uso</h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="overflow-y-auto px-6 py-4 text-sm text-slate-600 leading-relaxed flex flex-col gap-4">
          <div>
            <h3 className="font-semibold text-[#0f2554] mb-1">1. Aceitação dos Termos</h3>
            <p>Ao criar uma conta no SIGARE, o utilizador aceita integralmente os presentes termos e condições. O SIGARE é uma plataforma municipal de gestão e alocação de recursos para eventos no município de Xai-Xai, Gaza, Moçambique.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0f2554] mb-1">2. Registo e Conta</h3>
            <p>O utilizador compromete-se a fornecer informações verdadeiras, completas e actualizadas no momento do registo. É da responsabilidade do utilizador manter a confidencialidade das suas credenciais de acesso.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0f2554] mb-1">3. Uso da Plataforma</h3>
            <p>A plataforma destina-se exclusivamente à gestão de reservas de recursos para eventos legítimos. É proibido o uso para fins ilegais, fraudulentos ou contrários aos bons costumes. O incumprimento pode resultar na suspensão da conta.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0f2554] mb-1">4. Reservas e Pagamentos</h3>
            <p>As reservas ficam sujeitas a confirmação pelo fornecedor. O SIGARE não é parte nas transacções financeiras entre organizadores e fornecedores, sendo a plataforma apenas um intermediário de gestão.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0f2554] mb-1">5. Cancelamentos</h3>
            <p>Os cancelamentos de reservas devem ser efectuados com pelo menos 2 (duas) horas de antecedência em relação ao início do evento. Cancelamentos tardios podem estar sujeitos a penalizações definidas pelo fornecedor.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0f2554] mb-1">6. Avaliações</h3>
            <p>O utilizador pode avaliar recursos após a conclusão do evento. As avaliações devem ser honestas e respeitar as normas de conduta. Avaliações falsas ou ofensivas serão removidas.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0f2554] mb-1">7. Privacidade dos Dados</h3>
            <p>Os dados pessoais recolhidos são utilizados exclusivamente para o funcionamento da plataforma. Não são partilhados com terceiros sem consentimento, em conformidade com a legislação moçambicana de protecção de dados.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0f2554] mb-1">8. Responsabilidade</h3>
            <p>O SIGARE não se responsabiliza por danos decorrentes do uso indevido da plataforma, indisponibilidade temporária dos serviços, ou incumprimento de acordos entre utilizadores.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0f2554] mb-1">9. Alterações aos Termos</h3>
            <p>O SIGARE reserva-se o direito de alterar estes termos a qualquer momento. As alterações serão comunicadas via notificação na plataforma. O uso continuado da plataforma implica a aceitação das alterações.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0f2554] mb-1">10. Legislação Aplicável</h3>
            <p>Os presentes termos são regidos pela legislação da República de Moçambique. Qualquer litígio será resolvido nos tribunais competentes do município de Xai-Xai, Gaza.</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100">
          <button
            onClick={onFechar}
            className="w-full py-2.5 bg-[#0f2554] text-white text-sm font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors"
          >
            Compreendi e Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    tipo: 'organizador' as TipoUtilizador,
  });
  const [aceitouTermos, setAceitouTermos] = useState(false);

  function forcaSenha(s: string): { nivel: number; label: string; cor: string } {
    let pts = 0;
    if (s.length >= 8)  pts++;
    if (/[A-Z]/.test(s)) pts++;
    if (/[0-9]/.test(s)) pts++;
    if (/[^A-Za-z0-9]/.test(s)) pts++;
    const niveis = [
      { nivel: 0, label: '',         cor: '' },
      { nivel: 1, label: 'Fraca',    cor: 'bg-red-500' },
      { nivel: 2, label: 'Razoável', cor: 'bg-amber-400' },
      { nivel: 3, label: 'Boa',      cor: 'bg-blue-500' },
      { nivel: 4, label: 'Forte',    cor: 'bg-green-500' },
    ];
    return niveis[pts] ?? niveis[0];
  }
  const [mostrarTermos, setMostrarTermos] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tipo = searchParams.get('tipo') as TipoUtilizador | null;
    if (tipo && ['organizador', 'fornecedor'].includes(tipo)) {
      setForm((f) => ({ ...f, tipo }));
    }
  }, [searchParams]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (!aceitouTermos) {
      setErro('Deve aceitar os Termos e Condições para criar conta.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/registar', {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        tipo: form.tipo,
        telefone: form.telefone || undefined,
      });
      setToken(data.token);
      router.push(painelPorTipo(data.tipo as TipoUtilizador));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem;
      setErro(msg ?? 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fc]">
      {mostrarTermos && <ModalTermos onFechar={() => setMostrarTermos(false)} />}

      {/* Painel esquerdo — logo */}
      <div className="hidden lg:flex w-2/5 bg-[#0f2554] flex-col items-center justify-center p-12 relative overflow-hidden sticky top-0 h-screen">
        {/* Hexágonos decorativos */}
        <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 400 700" fill="none">
          <polygon points="200,30 320,100 320,240 200,310 80,240 80,100" stroke="#e9b94e" strokeWidth="1.5"/>
          <polygon points="200,70 300,125 300,235 200,290 100,235 100,125" stroke="#e9b94e" strokeWidth="1"/>
          <polygon points="50,450 140,500 140,600 50,650 -40,600 -40,500" stroke="#e9b94e" strokeWidth="1.5"/>
          <polygon points="330,480 420,530 420,630 330,680 240,630 240,530" stroke="#e9b94e" strokeWidth="1.5"/>
          <polygon points="160,560 220,595 220,665 160,700 100,665 100,595" stroke="#e9b94e" strokeWidth="1"/>
        </svg>

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <LogoSigare variante="completo" altura={56} />

          <div className="w-12 h-0.5 bg-[#e9b94e] opacity-40 rounded-full" />

          <p className="text-blue-200 text-sm leading-relaxed max-w-[220px]">
            Junte-se à plataforma municipal de gestão de eventos de Xai-Xai.
          </p>

          {/* Tipo de conta seleccionado */}
          <div className="w-full max-w-[240px] flex flex-col gap-3 mt-2">
            {TIPOS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, tipo: t.value }))}
                className={`text-left px-4 py-3 rounded-xl border transition-all ${
                  form.tipo === t.value
                    ? 'bg-[#e9b94e]/20 border-[#e9b94e] text-white'
                    : 'bg-white/5 border-white/10 text-blue-300 hover:bg-white/10'
                }`}
              >
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="flex justify-center mb-8 lg:hidden bg-[#0f2554] rounded-2xl py-5 px-6">
            <LogoSigare variante="completo" altura={44} />
          </div>

          <h2 className="text-2xl font-bold text-[#0f2554] mb-1">Criar conta</h2>
          <p className="text-slate-500 text-sm mb-6">Preencha os dados para se registar</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Tipo de conta (mobile) */}
            <div className="flex flex-col gap-1 lg:hidden">
              <label className="text-sm font-semibold text-slate-700">Tipo de conta</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7] bg-white"
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {(
              [
                { name: 'nome',           label: 'Nome completo',        type: 'text',     placeholder: 'João Silva',          required: true },
                { name: 'email',          label: 'Email',                type: 'email',    placeholder: 'exemplo@email.com',   required: true },
                { name: 'telefone',       label: 'Telefone (opcional)',  type: 'tel',      placeholder: '+258 84 000 0000',    required: false },
                { name: 'senha',          label: 'Senha',                type: 'password', placeholder: '••••••••',            required: true },
                { name: 'confirmarSenha', label: 'Confirmar senha',      type: 'password', placeholder: '••••••••',            required: true },
              ] as const
            ).map((field) => {
              const forca = field.name === 'senha' ? forcaSenha(form.senha) : null;
              const senhaOk = field.name === 'confirmarSenha' && form.confirmarSenha.length > 0;
              const coincide = form.senha === form.confirmarSenha;
              return (
                <div key={field.name} className="flex flex-col gap-1">
                  <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={form[field.name]}
                    onChange={handleChange}
                    required={field.required}
                    placeholder={field.placeholder}
                    className={`px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      senhaOk
                        ? coincide
                          ? 'border-green-400 focus:ring-green-300'
                          : 'border-red-400 focus:ring-red-300'
                        : 'border-slate-300 focus:ring-[#1e4db7]'
                    }`}
                  />
                  {forca && form.senha.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= forca.nivel ? forca.cor : 'bg-slate-200'
                          }`} />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${
                        forca.nivel <= 1 ? 'text-red-500' :
                        forca.nivel === 2 ? 'text-amber-500' :
                        forca.nivel === 3 ? 'text-blue-500' : 'text-green-600'
                      }`}>{forca.label}</span>
                    </div>
                  )}
                  {senhaOk && (
                    <p className={`text-xs font-medium ${coincide ? 'text-green-600' : 'text-red-500'}`}>
                      {coincide ? '✓ As senhas coincidem' : '✕ As senhas não coincidem'}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Termos e Condições */}
            <div className="flex items-start gap-3 mt-1">
              <input
                id="termos"
                type="checkbox"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[#0f2554] cursor-pointer shrink-0"
              />
              <label htmlFor="termos" className="text-sm text-slate-600 leading-snug cursor-pointer">
                Li e aceito os{' '}
                <button
                  type="button"
                  onClick={() => setMostrarTermos(true)}
                  className="text-[#0f2554] font-semibold underline underline-offset-2 hover:text-[#e9b94e] transition-colors"
                >
                  Termos e Condições de Uso
                </button>{' '}
                do SIGARE.
              </label>
            </div>

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !aceitouTermos}
              className="mt-1 py-3 bg-[#0f2554] text-white font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors disabled:opacity-50 shadow"
            >
              {loading ? 'A criar conta...' : 'Criar conta'}
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
              href="/login"
              className="py-3 border-2 border-[#e9b94e] text-[#0f2554] font-bold rounded-lg hover:bg-[#fef9e7] transition-colors text-center text-sm"
            >
              Já tenho conta — Entrar
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegistarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fc]" />}>
      <RegistarForm />
    </Suspense>
  );
}

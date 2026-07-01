'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface Funcionario {
  id_funcionario: string;
  nome: string;
  contacto?: string;
  funcao?: string;
  criado_em: string;
}

export default function FuncionariosPage() {
  const { payload, loading } = useAuth('fornecedor');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [form, setForm] = useState({ nome: '', contacto: '', funcao: '' });
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  function mostrarToast(mensagem: string, tipo: 'sucesso' | 'erro' = 'erro') {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  }
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    if (!payload) return;
    api.get('/funcionarios')
      .then((r) => setFuncionarios(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [payload]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nome) { setErro('Nome obrigatório.'); return; }
    setSaving(true); setErro('');
    try {
      const { data } = await api.post('/funcionarios', {
        nome: form.nome,
        contacto: form.contacto || undefined,
        funcao: form.funcao || undefined,
      });
      setFuncionarios((prev) => [data, ...prev]);
      setForm({ nome: '', contacto: '', funcao: '' });
      setMostrarForm(false);
    } catch {
      setErro('Erro ao criar funcionário.');
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(id: string) {
    if (!confirm('Eliminar este funcionário?')) return;
    try {
      await api.delete(`/funcionarios/${id}`);
      setFuncionarios((prev) => prev.filter((f) => f.id_funcionario !== id));
    } catch {
      mostrarToast('Erro ao eliminar o funcionário.');
    }
  }

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  return (
    <div className="max-w-3xl">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium ${
          toast.tipo === 'sucesso' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span>{toast.tipo === 'sucesso' ? '✓' : '✕'}</span>
          <span>{toast.mensagem}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-[#e9b94e]" />
          <div>
            <h1 className="text-2xl font-bold text-[#0f2554]">Funcionários</h1>
            <p className="text-sm text-slate-500">{funcionarios.length} registado{funcionarios.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => { setMostrarForm(!mostrarForm); setErro(''); }}
          className="px-4 py-2.5 bg-[#0f2554] text-white text-sm font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors"
        >
          {mostrarForm ? 'Cancelar' : '+ Novo Funcionário'}
        </button>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-bold text-[#0f2554] mb-4">Novo Funcionário</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Nome *</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome completo"
                  className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Contacto</label>
                <input
                  value={form.contacto}
                  onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
                  placeholder="Ex: +258 84 000 0000"
                  className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Função / Cargo</label>
              <input
                value={form.funcao}
                onChange={(e) => setForm((f) => ({ ...f, funcao: e.target.value }))}
                placeholder="Ex: Técnico de Som, Segurança, Operador de Palco"
                className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
              />
            </div>
            {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#e9b94e] text-[#0f2554] font-bold text-sm rounded-lg hover:bg-[#f5d07a] disabled:opacity-60 transition-colors"
              >
                {saving ? 'A guardar...' : 'Guardar Funcionário'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {fetching ? (
        <p className="text-slate-400 text-sm">A carregar...</p>
      ) : funcionarios.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <p className="text-4xl mb-3">👷</p>
          <p className="text-slate-500 font-medium">Nenhum funcionário registado</p>
          <p className="text-slate-400 text-sm mt-1">Adicione funcionários para alocar aos eventos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Nome</th>
                <th className="px-5 py-3 text-left">Função</th>
                <th className="px-5 py-3 text-left">Contacto</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {funcionarios.map((f) => (
                <tr key={f.id_funcionario} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#0f2554]">{f.nome}</td>
                  <td className="px-5 py-3 text-slate-500">{f.funcao ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-slate-500">{f.contacto ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => eliminar(f.id_funcionario)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}

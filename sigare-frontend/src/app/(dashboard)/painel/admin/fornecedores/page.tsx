'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface FornecedorItem {
  id_fornecedor: string;
  nome: string;
  contacto: string | null;
  endereco: string | null;
  validado: boolean;
  utilizador: { nome: string; email: string; bloqueado: boolean };
}

export default function FornecedoresPage() {
  const { payload, loading } = useAuth('administrador');
  const [fornecedores, setFornecedores] = useState<FornecedorItem[]>([]);
  const [filtro, setFiltro] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'por_validar' | 'bloqueados'>('todos');
  const [fetching, setFetching] = useState(true);
  const [accionando, setAccionando] = useState<string | null>(null);
  const [confirmarBloqueio, setConfirmarBloqueio] = useState<FornecedorItem | null>(null);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  function mostrarToast(mensagem: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    if (!payload) return;
    carregar();
  }, [payload]);

  async function carregar() {
    setFetching(true);
    try {
      const { data } = await api.get('/fornecedores');
      setFornecedores(data);
    } catch {
    } finally {
      setFetching(false);
    }
  }

  async function validar(id: string) {
    setAccionando(id + '_validar');
    try {
      await api.patch(`/fornecedores/${id}/validar`);
      setFornecedores((prev) =>
        prev.map((f) => (f.id_fornecedor === id ? { ...f, validado: true } : f))
      );
      mostrarToast('Fornecedor validado com sucesso.');
    } catch {
      mostrarToast('Não foi possível validar o fornecedor.', 'erro');
    } finally {
      setAccionando(null);
    }
  }

  async function confirmarEBloquear() {
    if (!confirmarBloqueio) return;
    const f = confirmarBloqueio;
    setConfirmarBloqueio(null);
    setAccionando(f.id_fornecedor + '_bloquear');
    try {
      const { data } = await api.patch(`/fornecedores/${f.id_fornecedor}/bloquear`);
      setFornecedores((prev) =>
        prev.map((item) =>
          item.id_fornecedor === f.id_fornecedor
            ? { ...item, utilizador: { ...item.utilizador, bloqueado: data.bloqueado } }
            : item
        )
      );
      mostrarToast(data.bloqueado ? 'Fornecedor bloqueado.' : 'Fornecedor desbloqueado.');
    } catch {
      mostrarToast('Não foi possível alterar o estado do fornecedor.', 'erro');
    } finally {
      setAccionando(null);
    }
  }

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  const filtrados = fornecedores.filter((f) => {
    const matchTexto =
      f.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      f.utilizador.email.toLowerCase().includes(filtro.toLowerCase());
    const matchEstado =
      filtroEstado === 'por_validar' ? !f.validado :
      filtroEstado === 'bloqueados' ? f.utilizador.bloqueado : true;
    return matchTexto && matchEstado;
  });

  const totalPorValidar = fornecedores.filter((f) => !f.validado).length;
  const totalBloqueados = fornecedores.filter((f) => f.utilizador.bloqueado).length;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium ${
          toast.tipo === 'sucesso' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span>{toast.tipo === 'sucesso' ? '✓' : '✕'}</span>
          <span>{toast.mensagem}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      {/* Modal de confirmação de bloqueio */}
      {confirmarBloqueio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${confirmarBloqueio.utilizador.bloqueado ? 'bg-green-100' : 'bg-red-100'}`}>
                <span className="text-lg">{confirmarBloqueio.utilizador.bloqueado ? '🔓' : '🔒'}</span>
              </div>
              <h2 className="text-base font-bold text-[#0f2554]">
                {confirmarBloqueio.utilizador.bloqueado ? 'Desbloquear Fornecedor' : 'Bloquear Fornecedor'}
              </h2>
            </div>
            <p className="text-sm text-slate-600 mb-1">
              {confirmarBloqueio.utilizador.bloqueado
                ? 'Tem a certeza que quer desbloquear'
                : 'Tem a certeza que quer bloquear'}
            </p>
            <p className="text-sm font-semibold text-[#0f2554] mb-3">{confirmarBloqueio.nome}?</p>
            {!confirmarBloqueio.utilizador.bloqueado && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">
                O fornecedor não conseguirá iniciar sessão enquanto estiver bloqueado.
              </p>
            )}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setConfirmarBloqueio(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEBloquear}
                className={`flex-1 py-2.5 text-white text-sm font-bold rounded-xl transition-colors ${
                  confirmarBloqueio.utilizador.bloqueado
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmarBloqueio.utilizador.bloqueado ? 'Desbloquear' : 'Bloquear'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Fornecedores</h1>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
              {fornecedores.length} registados
              {totalPorValidar > 0 && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  {totalPorValidar} por validar
                </span>
              )}
              {totalBloqueados > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                  {totalBloqueados} bloqueado{totalBloqueados !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Pesquisar por nome ou email..."
            className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2">
            {(['todos', 'por_validar', 'bloqueados'] as const).map((op) => (
              <button
                key={op}
                onClick={() => setFiltroEstado(op)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  filtroEstado === op
                    ? 'bg-[#0f2554] text-white'
                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {op === 'todos' ? 'Todos' : op === 'por_validar' ? 'Por validar' : 'Bloqueados'}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        {fetching ? (
          <p className="text-slate-400 text-sm">A carregar fornecedores...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-slate-400 text-sm">Nenhum fornecedor encontrado.</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Fornecedor</th>
                  <th className="px-5 py-3 text-left">Conta</th>
                  <th className="px-5 py-3 text-left">Contacto</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((f) => (
                  <tr
                    key={f.id_fornecedor}
                    className={`hover:bg-slate-50 transition-colors ${f.utilizador.bloqueado ? 'opacity-60' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{f.nome}</p>
                      {f.endereco && <p className="text-xs text-slate-400">{f.endereco}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-700">{f.utilizador.nome}</p>
                      <p className="text-xs text-slate-400">{f.utilizador.email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{f.contacto ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        {f.utilizador.bloqueado ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 inline-flex items-center gap-1 w-fit">
                            🔒 Bloqueado
                          </span>
                        ) : f.validado ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 w-fit">
                            Validado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 w-fit">
                            Pendente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {!f.validado && !f.utilizador.bloqueado && (
                          <button
                            onClick={() => validar(f.id_fornecedor)}
                            disabled={accionando === f.id_fornecedor + '_validar'}
                            className="px-3 py-1.5 bg-[#0f2554] text-white text-xs font-semibold rounded-lg hover:bg-[#1a3a7a] transition-colors disabled:opacity-60"
                          >
                            {accionando === f.id_fornecedor + '_validar' ? '...' : 'Validar'}
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmarBloqueio(f)}
                          disabled={accionando === f.id_fornecedor + '_bloquear'}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 ${
                            f.utilizador.bloqueado
                              ? 'border border-green-400 text-green-600 hover:bg-green-600 hover:text-white'
                              : 'border border-red-300 text-red-500 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          {accionando === f.id_fornecedor + '_bloquear'
                            ? '...'
                            : f.utilizador.bloqueado ? '🔓 Desbloquear' : '🔒 Bloquear'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
              A mostrar {filtrados.length} de {fornecedores.length} fornecedores
            </div>
          </div>
        )}
      </div>
    </>
  );
}

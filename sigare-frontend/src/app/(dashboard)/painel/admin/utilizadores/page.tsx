'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Utilizador } from '@/types';

const tipoCor: Record<string, string> = {
  administrador:    'bg-purple-100 text-purple-700',
  organizador:      'bg-blue-100 text-blue-700',
  fornecedor:       'bg-green-100 text-green-700',
  gestor_municipal: 'bg-orange-100 text-orange-700',
};

const tipoLabel: Record<string, string> = {
  administrador:    'Administrador',
  organizador:      'Organizador',
  fornecedor:       'Fornecedor',
  gestor_municipal: 'Gestor Municipal',
};

export default function UtilizadoresPage() {
  const { payload, loading } = useAuth('administrador');
  const [utilizadores, setUtilizadores] = useState<Utilizador[]>([]);
  const [filtro, setFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!payload) return;
    api.get('/utilizadores')
      .then((r) => setUtilizadores(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [payload]);

  if (loading) return <p className="text-slate-400">A carregar...</p>;

  const filtrados = utilizadores.filter((u) => {
    const matchNome = u.nome.toLowerCase().includes(filtro.toLowerCase()) ||
                      u.email.toLowerCase().includes(filtro.toLowerCase());
    const matchTipo = tipoFiltro ? u.tipo === tipoFiltro : true;
    return matchNome && matchTipo;
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Utilizadores</h1>
          <p className="text-sm text-slate-500 mt-0.5">{utilizadores.length} registados</p>
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
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">Todos os tipos</option>
          <option value="organizador">Organizador</option>
          <option value="fornecedor">Fornecedor</option>
          <option value="administrador">Administrador</option>
          <option value="gestor_municipal">Gestor Municipal</option>
        </select>
      </div>

      {/* Tabela */}
      {fetching ? (
        <p className="text-slate-400 text-sm">A carregar utilizadores...</p>
      ) : filtrados.length === 0 ? (
        <p className="text-slate-400 text-sm">Nenhum utilizador encontrado.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Nome</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Tipo</th>
                <th className="px-5 py-3 text-left">Telefone</th>
                <th className="px-5 py-3 text-left">Registado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((u) => (
                <tr key={u.id_utilizador} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{u.nome}</td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoCor[u.tipo] ?? 'bg-slate-100 text-slate-600'}`}>
                      {tipoLabel[u.tipo] ?? u.tipo}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{u.telefone ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(u.criado_em).toLocaleDateString('pt-PT')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>

          {/* Rodapé com contagem */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            A mostrar {filtrados.length} de {utilizadores.length} utilizadores
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Categoria } from '@/types';

interface RecursoDetalhe {
  id_recurso: string;
  nome: string;
  descricao?: string;
  endereco?: string;
  latitude?: number | null;
  longitude?: number | null;
  preco: number;
  preco_hora?: number | null;
  preco_dia?: number | null;
  quantidade: number;
  foto_url?: string | null;
  disponibilidade: boolean;
  id_categoria: string;
  categoria: { nome: string };
}

export default function EditarRecursoPage() {
  const { payload, loading } = useAuth('fornecedor');
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const fileRef = useRef<HTMLInputElement>(null);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    endereco: '',
    latitude: '',
    longitude: '',
    preco_hora: '',
    preco_dia: '',
    quantidade: '1',
    id_categoria: '',
    disponibilidade: true,
  });
  const [fotoAtual, setFotoAtual] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.get('/categorias').then((r) => setCategorias(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!payload) return;
    api.get(`/recursos/${id}`)
      .then((r) => {
        const rec: RecursoDetalhe = r.data;
        setForm({
          nome: rec.nome,
          descricao: rec.descricao ?? '',
          endereco: rec.endereco ?? '',
          latitude: rec.latitude != null ? String(rec.latitude) : '',
          longitude: rec.longitude != null ? String(rec.longitude) : '',
          preco_hora: rec.preco_hora != null ? String(rec.preco_hora) : '',
          preco_dia: rec.preco_dia != null ? String(rec.preco_dia) : '',
          quantidade: String(rec.quantidade),
          id_categoria: rec.id_categoria,
          disponibilidade: rec.disponibilidade,
        });
        setFotoAtual(rec.foto_url ?? null);
      })
      .catch(() => router.push('/painel/fornecedor/recursos'))
      .finally(() => setFetching(false));
  }, [payload, id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm((f) => ({ ...f, [name]: val }));
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErro('A foto não pode ter mais de 5 MB.'); return; }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
    setErro('');
  }

  async function uploadFoto(): Promise<string | null> {
    if (!fotoFile) return fotoAtual;
    const ext = fotoFile.name.split('.').pop();
    const path = `recursos/${Date.now()}.${ext}`;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const res = await fetch(`${supabaseUrl}/storage/v1/object/sigare/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey as string,
        'Content-Type': fotoFile.type,
        'x-upsert': 'true',
      },
      body: fotoFile,
    });

    if (!res.ok) { setErro('Erro ao fazer upload da foto.'); return null; }
    return `${supabaseUrl}/storage/v1/object/public/sigare/${path}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (!form.id_categoria) { setErro('Seleccione uma categoria.'); return; }
    if (!form.preco_hora) { setErro('Indique o preço por hora.'); return; }

    setSaving(true);
    const precoHora = Number(form.preco_hora);
    const precoDia = form.preco_dia ? Number(form.preco_dia) : precoHora * 8;

    const foto_url = await uploadFoto();
    if (foto_url === null && fotoFile) { setSaving(false); return; }

    try {
      await api.patch(`/recursos/${id}`, {
        nome: form.nome,
        descricao: form.descricao || undefined,
        endereco: form.endereco || undefined,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        preco: precoHora,
        preco_hora: precoHora,
        preco_dia: precoDia,
        quantidade: Number(form.quantidade),
        id_categoria: form.id_categoria,
        disponibilidade: form.disponibilidade,
        foto_url: foto_url || undefined,
      });
      router.push('/painel/fornecedor/recursos');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem;
      setErro(msg ?? 'Erro ao actualizar recurso.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || fetching) return <p className="text-slate-400">A carregar...</p>;

  const previewFinal = fotoPreview ?? fotoAtual;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 rounded-full bg-[#e9b94e]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0f2554]">Editar Recurso</h1>
          <p className="text-xs text-slate-400 mt-0.5">Actualize os dados do recurso</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Upload de foto */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Foto do Recurso</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-slate-300 rounded-xl overflow-hidden hover:border-[#e9b94e] transition-colors"
            >
              {previewFinal ? (
                <div className="relative h-52 w-full bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewFinal} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-semibold">Clique para alterar</span>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <span className="text-4xl">📷</span>
                  <span className="text-sm">Clique para seleccionar uma foto</span>
                  <span className="text-xs">PNG, JPG até 5 MB</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} className="hidden" />
          </div>

          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Nome do recurso <span className="text-red-500">*</span>
            </label>
            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
              className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
            />
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Descrição</label>
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              rows={3}
              className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7] resize-none"
            />
          </div>

          {/* Endereço */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Endereço / Localização
              <span className="ml-2 text-xs font-normal text-slate-400">(deixe em branco se não for lugar fixo)</span>
            </label>
            <input
              name="endereco"
              value={form.endereco}
              onChange={handleChange}
              placeholder="Ex: Bairro 1, Xai-Xai, Gaza"
              className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
            />
          </div>

          {/* Coordenadas GPS */}
          {form.endereco && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">
                Coordenadas GPS
                <span className="ml-2 text-xs font-normal text-slate-400">(para aparecer no mapa)</span>
              </label>
              <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-3 text-xs text-[#1e40af] mb-1">
                💡 Abra o{' '}
                <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="underline font-medium">
                  Google Maps
                </a>
                , clique com o botão direito no local e copie as coordenadas.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Latitude</label>
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="-25.0519"
                    className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Longitude</label>
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="33.6442"
                    className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
                  />
                </div>
              </div>
              {form.latitude && form.longitude && (
                <a
                  href={`https://maps.google.com/?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#1e4db7] hover:underline"
                >
                  🗺️ Verificar no Google Maps →
                </a>
              )}
            </div>
          )}

          {/* Categoria + Quantidade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                name="id_categoria"
                value={form.id_categoria}
                onChange={handleChange}
                required
                className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7] bg-white"
              >
                <option value="">{categorias.length === 0 ? 'A carregar...' : 'Seleccionar...'}</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Quantidade disponível <span className="text-red-500">*</span>
              </label>
              <input
                name="quantidade"
                type="number"
                min="1"
                value={form.quantidade}
                onChange={handleChange}
                required
                className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
              />
            </div>
          </div>

          {/* Preços */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Preços <span className="text-red-500">*</span>
            </label>
            <div className="bg-[#fef9e7] border border-[#e9b94e] rounded-lg p-3 text-xs text-[#0f2554]">
              💡 Até 8 horas cobra-se o preço por hora. Acima de 8 horas aplica-se o preço diário.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Preço / hora (MZN)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">MT</span>
                  <input
                    name="preco_hora"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.preco_hora}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Preço diário / &gt;8h (MZN)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">MT</span>
                  <input
                    name="preco_dia"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.preco_dia}
                    onChange={handleChange}
                    placeholder={form.preco_hora ? `${(Number(form.preco_hora) * 8).toFixed(2)} (auto)` : 'Auto'}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4db7]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Disponibilidade */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="disponibilidade"
              checked={form.disponibilidade}
              onChange={handleChange}
              className="w-4 h-4 rounded accent-[#0f2554]"
            />
            <span className="text-sm font-medium text-slate-700">Recurso disponível para reserva</span>
          </label>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-[#0f2554] text-white text-sm font-bold rounded-lg hover:bg-[#1a3a7a] transition-colors disabled:opacity-60"
            >
              {saving ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

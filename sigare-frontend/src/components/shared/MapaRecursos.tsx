'use client';

import { useEffect, useRef } from 'react';

export interface PinRecurso {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  foto_url?: string | null;
  categoria: string;
  preco_hora?: number | null;
  preco_dia?: number | null;
}

interface Props {
  recursos: PinRecurso[];
  altura?: string;
  focoId?: string | null;
}

export default function MapaRecursos({ recursos, altura = '480px', focoId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (!containerRef.current || recursos.length === 0) return;

    // Importação dinâmica de Leaflet (apenas no browser)
    import('leaflet').then((L) => {
      // Fix para os ícones padrão do Leaflet no Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Destrói mapa anterior se existir
      if (mapRef.current) {
        (mapRef.current as L.Map).remove();
        mapRef.current = null;
        markersRef.current = [];
      }

      // Centro: Xai-Xai, Gaza, Moçambique
      const centroXaiXai: [number, number] = [-25.0519, 33.6442];

      const map = L.map(containerRef.current!, {
        center: centroXaiXai,
        zoom: 13,
        zoomControl: true,
      });

      mapRef.current = map;

      // Tiles OpenStreetMap (gratuito, sem API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Ícone personalizado dourado para locais SIGARE
      const iconeLocal = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;border-radius:50% 50% 50% 0;
          background:#0f2554;border:3px solid #e9b94e;
          transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);">
          <span style="transform:rotate(45deg);font-size:16px;">📍</span>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      const bounds: [number, number][] = [];

      recursos.forEach((r) => {
        const pos: [number, number] = [r.latitude, r.longitude];
        bounds.push(pos);

        const preco = r.preco_hora
          ? `${Number(r.preco_hora).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT/h`
          : r.preco_dia
          ? `${Number(r.preco_dia).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT/dia`
          : '';

        const popupContent = `
          <div style="min-width:200px;font-family:Arial,sans-serif;">
            ${r.foto_url ? `<img src="${r.foto_url}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-bottom:8px;" alt="${r.nome}"/>` : ''}
            <div style="font-size:13px;font-weight:bold;color:#0f2554;margin-bottom:4px;">${r.nome}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:4px;">
              <span style="background:#eff6ff;color:#1e40af;padding:2px 6px;border-radius:10px;font-size:10px;">${r.categoria}</span>
            </div>
            <div style="font-size:11px;color:#475569;margin-bottom:4px;">📍 ${r.endereco}</div>
            ${preco ? `<div style="font-size:12px;font-weight:bold;color:#0f2554;">💰 ${preco}</div>` : ''}
          </div>
        `;

        const marker = L.marker(pos, { icon: iconeLocal })
          .addTo(map)
          .bindPopup(popupContent, { maxWidth: 260 });

        // Abre popup do recurso em foco
        if (focoId && r.id === focoId) {
          marker.openPopup();
        }

        markersRef.current.push(marker);
      });

      // Ajusta vista para conter todos os marcadores
      if (bounds.length > 0) {
        if (focoId) {
          const foco = recursos.find((r) => r.id === focoId);
          if (foco) {
            map.setView([foco.latitude, foco.longitude], 16);
          } else {
            map.fitBounds(bounds as L.LatLngBoundsLiteral, { padding: [40, 40] });
          }
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 15);
        } else {
          map.fitBounds(bounds as L.LatLngBoundsLiteral, { padding: [40, 40] });
        }
      }
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recursos, focoId]);

  if (recursos.length === 0) {
    return (
      <div
        style={{ height: altura }}
        className="flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 gap-2"
      >
        <span className="text-4xl">🗺️</span>
        <p className="text-sm font-medium">Nenhum local fixo com coordenadas definidas</p>
        <p className="text-xs">Os fornecedores precisam de adicionar latitude e longitude aos seus locais</p>
      </div>
    );
  }

  return (
    <>
      {/* CSS do Leaflet */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={containerRef}
        style={{ height: altura, width: '100%' }}
        className="rounded-xl overflow-hidden border border-slate-200 z-0"
      />
    </>
  );
}

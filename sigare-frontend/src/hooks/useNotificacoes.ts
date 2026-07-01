'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Notificacao } from '@/types';

export function useNotificacoes(ativo = true) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const r = await api.get('/notificacoes');
      setNotificacoes(r.data);
    } catch {
      // silencioso — sem login ainda
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!ativo) return;
    carregar();
    // Poll a cada 30 segundos
    const intervalo = setInterval(carregar, 30_000);
    return () => clearInterval(intervalo);
  }, [ativo, carregar]);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  async function marcarLida(id: string) {
    try {
      await api.patch(`/notificacoes/${id}/lida`);
      setNotificacoes((prev) =>
        prev.map((n) => (n.id_notificacao === id ? { ...n, lida: true } : n))
      );
    } catch {}
  }

  async function marcarTodasLidas() {
    try {
      await api.patch('/notificacoes/ler-todas');
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    } catch {}
  }

  return { notificacoes, naoLidas, carregando, marcarLida, marcarTodasLidas, recarregar: carregar };
}

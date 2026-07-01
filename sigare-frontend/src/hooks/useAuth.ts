'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthPayload, TipoUtilizador } from '@/types';
import { getAuthPayload, removeToken, painelPorTipo } from '@/lib/auth';

export function useAuth(requiredTipo?: TipoUtilizador | TipoUtilizador[]) {
  const router = useRouter();
  const [payload, setPayload] = useState<AuthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = getAuthPayload();
    if (!p) {
      router.replace('/login');
      return;
    }
    if (requiredTipo) {
      const allowed = Array.isArray(requiredTipo) ? requiredTipo : [requiredTipo];
      if (!allowed.includes(p.tipo)) {
        router.replace(painelPorTipo(p.tipo));
        return;
      }
    }
    setPayload(p);
    setLoading(false);
  }, []);

  function logout() {
    removeToken();
    router.push('/login');
  }

  return { payload, loading, logout };
}

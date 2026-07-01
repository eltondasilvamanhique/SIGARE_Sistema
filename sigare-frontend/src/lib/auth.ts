import { jwtDecode } from 'jwt-decode';
import { AuthPayload, TipoUtilizador } from '@/types';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sigare_token');
}

export function setToken(token: string): void {
  localStorage.setItem('sigare_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('sigare_token');
}

export function getAuthPayload(): AuthPayload | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = jwtDecode<AuthPayload>(token);
    if (payload.exp * 1000 < Date.now()) {
      removeToken();
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getAuthPayload() !== null;
}

export function getTipo(): TipoUtilizador | null {
  return getAuthPayload()?.tipo ?? null;
}

export function painelPorTipo(tipo: TipoUtilizador): string {
  const rotas: Record<TipoUtilizador, string> = {
    organizador: '/painel/organizador',
    fornecedor: '/painel/fornecedor',
    administrador: '/painel/admin',
    gestor_municipal: '/painel/gestor',
  };
  return rotas[tipo];
}

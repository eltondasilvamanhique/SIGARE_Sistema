import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { idUtilizador: string; tipo: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ mensagem: 'Token não fornecido.' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      idUtilizador: string;
      tipo: string;
    };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.tipo)) {
      res.status(403).json({ mensagem: 'Acesso negado.' });
      return;
    }
    next();
  };
}

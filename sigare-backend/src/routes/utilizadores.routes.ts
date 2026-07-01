import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// Perfil do utilizador autenticado
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const u = await prisma.utilizador.findUnique({
    where: { id_utilizador: req.user!.idUtilizador },
    select: { id_utilizador: true, nome: true, email: true, tipo: true, telefone: true },
  });
  if (!u) { res.status(404).json({ mensagem: 'Utilizador não encontrado.' }); return; }
  res.json(u);
});

router.get('/', authenticate, requireRole(['administrador']), async (_req, res) => {
  const utilizadores = await prisma.utilizador.findMany({
    select: {
      id_utilizador: true,
      nome: true,
      email: true,
      tipo: true,
      telefone: true,
      criado_em: true,
    },
    orderBy: { criado_em: 'desc' },
  });
  res.json(utilizadores);
});

export default router;

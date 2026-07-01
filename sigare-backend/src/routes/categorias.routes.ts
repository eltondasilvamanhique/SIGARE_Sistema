import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();
router.get('/', async (_req, res) => {
  const categorias = await prisma.categoria.findMany({ orderBy: { nome: 'asc' } });
  res.json(categorias);
});

export default router;

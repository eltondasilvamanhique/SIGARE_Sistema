import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  listarRecursos,
  listarMeusRecursos,
  obterRecurso,
  obterDisponibilidade,
  listarReservasRecurso,
  criarRecurso,
  atualizarRecurso,
  eliminarRecurso,
} from '../controllers/recursos.controller';
import { listarAvaliacoes } from '../controllers/avaliacoes.controller';

const router = Router();
router.get('/', listarRecursos);
router.get('/meus', authenticate, requireRole(['fornecedor']), listarMeusRecursos);
router.get('/:id', obterRecurso);
router.get('/:id/disponibilidade', obterDisponibilidade);
router.get('/:id/reservas', authenticate, requireRole(['fornecedor']), listarReservasRecurso);
router.get('/:id/avaliacoes', listarAvaliacoes);
router.post('/', authenticate, requireRole(['fornecedor']), criarRecurso);
router.patch('/:id', authenticate, requireRole(['fornecedor']), atualizarRecurso);
router.delete('/:id', authenticate, requireRole(['fornecedor']), eliminarRecurso);

export default router;

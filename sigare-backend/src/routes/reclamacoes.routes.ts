import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { listarReclamacoes, responderReclamacao } from '../controllers/reclamacoes.controller';

const router = Router();

router.get('/', authenticate, listarReclamacoes);
router.patch('/:id', authenticate, requireRole(['administrador']), responderReclamacao);

export default router;

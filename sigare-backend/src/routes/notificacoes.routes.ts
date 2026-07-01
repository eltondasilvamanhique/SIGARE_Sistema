import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listarNotificacoes, marcarLida, marcarTodasLidas } from '../controllers/notificacoes.controller';

const router = Router();
router.get('/', authenticate, listarNotificacoes);
router.patch('/ler-todas', authenticate, marcarTodasLidas);
router.patch('/:id/lida', authenticate, marcarLida);

export default router;

import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { utilizacao, gestorStats, publicoStats, fornecedorStats } from '../controllers/relatorios.controller';

const router = Router();

router.get('/publico', publicoStats);
router.get('/fornecedor', authenticate, requireRole(['fornecedor']), fornecedorStats);
router.get('/utilizacao', authenticate, requireRole(['administrador', 'gestor_municipal']), utilizacao);
router.get('/gestor', authenticate, requireRole(['gestor_municipal', 'administrador']), gestorStats);

export default router;

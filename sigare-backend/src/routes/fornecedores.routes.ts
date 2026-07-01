import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { listarFornecedores, validarFornecedor, bloquearFornecedor } from '../controllers/fornecedores.controller';

const router = Router();
router.get('/', authenticate, requireRole(['administrador']), listarFornecedores);
router.patch('/:id/validar', authenticate, requireRole(['administrador']), validarFornecedor);
router.patch('/:id/bloquear', authenticate, requireRole(['administrador']), bloquearFornecedor);

export default router;

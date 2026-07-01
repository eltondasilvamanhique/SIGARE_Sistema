import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  listarFuncionarios,
  criarFuncionario,
  eliminarFuncionario,
} from '../controllers/funcionarios.controller';

const router = Router();

router.get('/',    authenticate, requireRole(['fornecedor']), listarFuncionarios);
router.post('/',   authenticate, requireRole(['fornecedor']), criarFuncionario);
router.delete('/:id', authenticate, requireRole(['fornecedor']), eliminarFuncionario);

export default router;

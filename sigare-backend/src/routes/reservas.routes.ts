import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  criarReserva,
  cancelarReserva,
  listarReservas,
  decidirReserva,
  avancarEstado,
  getRecibo,
} from '../controllers/reservas.controller';
import { criarAvaliacao } from '../controllers/avaliacoes.controller';
import { criarReclamacao } from '../controllers/reclamacoes.controller';
import {
  listarAlocacoes,
  alocarFuncionario,
  removerAlocacao,
} from '../controllers/funcionarios.controller';

const router = Router();

router.post('/',                  authenticate, requireRole(['organizador']),          criarReserva);
router.patch('/:id/cancelar',     authenticate, requireRole(['organizador']),           cancelarReserva);
router.get('/',                   authenticate,                                        listarReservas);
router.patch('/:id/decidir',      authenticate, requireRole(['fornecedor']),           decidirReserva);
router.patch('/:id/avancar',      authenticate, requireRole(['fornecedor']),           avancarEstado);
router.get('/:id/recibo',         authenticate,                                        getRecibo);
router.get('/:id/alocacoes',      authenticate, requireRole(['fornecedor']),           listarAlocacoes);
router.post('/:id/alocacoes',     authenticate, requireRole(['fornecedor']),           alocarFuncionario);
router.delete('/alocacoes/:id',   authenticate, requireRole(['fornecedor']),           removerAlocacao);
router.post('/:id/avaliar',       authenticate, requireRole(['organizador']),           criarAvaliacao);
router.post('/:id/reclamar',      authenticate, requireRole(['organizador']),           criarReclamacao);

export default router;

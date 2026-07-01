import { Router } from 'express';
import { registar, login, recuperarSenha, redefinirSenha } from '../controllers/auth.controller';

const router = Router();
router.post('/registar', registar);
router.post('/login', login);
router.post('/recuperar-senha', recuperarSenha);
router.post('/redefinir-senha', redefinirSenha);

export default router;

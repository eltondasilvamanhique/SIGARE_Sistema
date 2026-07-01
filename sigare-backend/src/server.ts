import 'dotenv/config';
import express from 'express';
import { iniciarScheduler } from './lib/scheduler';
import helmet from 'helmet';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import recursosRoutes from './routes/recursos.routes';
import reservasRoutes from './routes/reservas.routes';
import fornecedoresRoutes from './routes/fornecedores.routes';
import notificacoesRoutes from './routes/notificacoes.routes';
import relatoriosRoutes from './routes/relatorios.routes';
import categoriasRoutes from './routes/categorias.routes';
import utilizadoresRoutes from './routes/utilizadores.routes';
import funcionariosRoutes from './routes/funcionarios.routes';
import reclamacoesRoutes from './routes/reclamacoes.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/recursos', recursosRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/utilizadores', utilizadoresRoutes);
app.use('/api/funcionarios', funcionariosRoutes);
app.use('/api/reclamacoes', reclamacoesRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`SIGARE API a correr em http://localhost:${PORT}`);
  iniciarScheduler();
});

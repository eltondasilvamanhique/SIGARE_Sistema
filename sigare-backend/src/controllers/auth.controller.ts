import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { enviarEmailRecuperacao } from '../lib/email';

const registarSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  tipo: z.enum(['organizador', 'fornecedor', 'administrador', 'gestor_municipal']),
  telefone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string(),
});

function gerarToken(idUtilizador: string, tipo: string, nome: string): string {
  return jwt.sign(
    { idUtilizador, tipo, nome },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
}

export async function registar(req: Request, res: Response): Promise<void> {
  const parsed = registarSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ mensagem: 'Dados inválidos.', erros: parsed.error.flatten() });
    return;
  }
  const { nome, email, senha, tipo, telefone } = parsed.data;

  const existe = await prisma.utilizador.findUnique({ where: { email } });
  if (existe) {
    res.status(409).json({ mensagem: 'Email já registado.' });
    return;
  }

  const senha_hash = await bcrypt.hash(senha, 12);
  const utilizador = await prisma.utilizador.create({
    data: { nome, email, senha_hash, tipo, telefone },
  });

  if (tipo === 'fornecedor') {
    await prisma.fornecedor.create({
      data: { id_utilizador: utilizador.id_utilizador, nome },
    });
  }

  const token = gerarToken(utilizador.id_utilizador, utilizador.tipo, utilizador.nome);
  res.status(201).json({ token, tipo: utilizador.tipo });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ mensagem: 'Dados inválidos.' });
    return;
  }
  const { email, senha } = parsed.data;

  const utilizador = await prisma.utilizador.findUnique({ where: { email } });
  if (!utilizador) {
    res.status(401).json({ mensagem: 'Email ou senha incorretos.' });
    return;
  }

  const senhaCorreta = await bcrypt.compare(senha, utilizador.senha_hash);
  if (!senhaCorreta) {
    res.status(401).json({ mensagem: 'Email ou senha incorretos.' });
    return;
  }

  if (utilizador.bloqueado) {
    res.status(403).json({ mensagem: 'A sua conta foi bloqueada pelo administrador. Contacte o suporte.' });
    return;
  }

  const token = gerarToken(utilizador.id_utilizador, utilizador.tipo, utilizador.nome);
  res.json({ token, tipo: utilizador.tipo });
}

export async function recuperarSenha(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string };
  if (!email || !z.string().email().safeParse(email).success) {
    res.status(400).json({ mensagem: 'Email inválido.' });
    return;
  }

  // Resposta igual independentemente de o email existir (segurança)
  const mensagemOk = 'Se o email existir na plataforma, receberá um link de recuperação em breve.';

  const utilizador = await prisma.utilizador.findUnique({ where: { email } });
  if (!utilizador) {
    res.json({ mensagem: mensagemOk });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.utilizador.update({
    where: { id_utilizador: utilizador.id_utilizador },
    data: { reset_token: token, reset_expiry: expiry },
  });

  try {
    await enviarEmailRecuperacao(utilizador.email, utilizador.nome, token);
  } catch {
    res.status(500).json({ mensagem: 'Erro ao enviar email. Tente novamente mais tarde.' });
    return;
  }

  res.json({ mensagem: mensagemOk });
}

export async function redefinirSenha(req: Request, res: Response): Promise<void> {
  const { token, novaSenha } = req.body as { token?: string; novaSenha?: string };

  if (!token || !novaSenha || novaSenha.length < 6) {
    res.status(400).json({ mensagem: 'Token e nova senha (mínimo 6 caracteres) são obrigatórios.' });
    return;
  }

  const utilizador = await prisma.utilizador.findFirst({
    where: { reset_token: token },
  });

  if (!utilizador || !utilizador.reset_expiry || utilizador.reset_expiry < new Date()) {
    res.status(400).json({ mensagem: 'Link inválido ou expirado. Solicite um novo.' });
    return;
  }

  const senha_hash = await bcrypt.hash(novaSenha, 12);
  await prisma.utilizador.update({
    where: { id_utilizador: utilizador.id_utilizador },
    data: { senha_hash, reset_token: null, reset_expiry: null },
  });

  res.json({ mensagem: 'Senha redefinida com sucesso. Pode fazer login.' });
}

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE ?? 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarEmailRecuperacao(
  destinatario: string,
  nome: string,
  token: string,
): Promise<void> {
  const link = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/redefinir-senha?token=${token}`;

  await transporter.sendMail({
    from: `"SIGARE" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: 'Recuperação de senha — SIGARE',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;">
        <h2 style="color:#0f2554;">Recuperação de Senha</h2>
        <p>Olá <strong>${nome}</strong>,</p>
        <p>Recebemos um pedido para redefinir a sua senha no SIGARE.</p>
        <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${link}"
             style="background:#0f2554;color:#e9b94e;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
            Redefinir Senha
          </a>
        </div>
        <p style="color:#888;font-size:12px;">
          Se não pediu a recuperação de senha, ignore este email — a sua conta continua segura.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#aaa;font-size:11px;">SIGARE — Plataforma Municipal de Xai-Xai</p>
      </div>
    `,
  });
}

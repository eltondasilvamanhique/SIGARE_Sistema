import cron from 'node-cron';
import prisma from './prisma';

export function iniciarScheduler() {
  // Corre a cada minuto
  cron.schedule('* * * * *', async () => {
    const agora = new Date();

    try {
      // 1. confirmada → em_andamento: hora_inicio já passou
      const paraIniciar = await prisma.reserva.findMany({
        where: {
          estado: 'confirmada',
          hora_inicio: { lte: agora },
        },
        include: { recurso: true },
      });

      for (const r of paraIniciar) {
        await prisma.reserva.update({
          where: { id_reserva: r.id_reserva },
          data: { estado: 'em_andamento' },
        });
        await prisma.notificacao.create({
          data: {
            mensagem: `O seu evento "${r.recurso.nome}" começou. Boa sorte!`,
            tipo: 'reserva_em_andamento',
            id_utilizador: r.id_utilizador,
            id_reserva: r.id_reserva,
          },
        });
      }

      // 2. em_andamento → terminada: hora_inicio + horas já passou
      const emAndamento = await prisma.reserva.findMany({
        where: {
          estado: 'em_andamento',
          hora_inicio: { not: null },
        },
        include: { recurso: { include: { fornecedor: true } } },
      });

      for (const r of emAndamento) {
        if (!r.hora_inicio) continue;
        const horaFim = new Date(r.hora_inicio);
        horaFim.setHours(horaFim.getHours() + r.horas);

        if (horaFim <= agora) {
          await prisma.reserva.update({
            where: { id_reserva: r.id_reserva },
            data: { estado: 'terminada' },
          });
          // Notificar organizador
          await prisma.notificacao.create({
            data: {
              mensagem: `O evento "${r.recurso.nome}" terminou. O fornecedor irá confirmar a devolução do material.`,
              tipo: 'reserva_terminada',
              id_utilizador: r.id_utilizador,
              id_reserva: r.id_reserva,
            },
          });
          // Notificar fornecedor
          await prisma.notificacao.create({
            data: {
              mensagem: `O evento "${r.recurso.nome}" terminou. Por favor confirme a devolução do material.`,
              tipo: 'reserva_terminada',
              id_utilizador: r.recurso.fornecedor.id_utilizador,
              id_reserva: r.id_reserva,
            },
          });
        }
      }

      if (paraIniciar.length > 0 || emAndamento.length > 0) {
        console.log(`[Scheduler] ${new Date().toISOString()} — iniciados: ${paraIniciar.length}, verificados em andamento: ${emAndamento.length}`);
      }
    } catch (err) {
      console.error('[Scheduler] Erro:', err);
    }
  });

  console.log('[Scheduler] Cron job iniciado — verifica transições a cada minuto.');
}

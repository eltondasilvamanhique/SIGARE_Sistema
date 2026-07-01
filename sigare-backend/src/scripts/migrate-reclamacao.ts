import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS reclamacao (
        id_reclamacao  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_reserva     UUID NOT NULL REFERENCES reserva(id_reserva) ON DELETE CASCADE,
        id_utilizador  UUID NOT NULL REFERENCES utilizador(id_utilizador),
        assunto        VARCHAR(150) NOT NULL,
        descricao      VARCHAR(1000) NOT NULL,
        estado         VARCHAR(20) NOT NULL DEFAULT 'aberta',
        resposta       VARCHAR(1000),
        criado_em      TIMESTAMP NOT NULL DEFAULT NOW(),
        atualizado_em  TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela reclamacao criada.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

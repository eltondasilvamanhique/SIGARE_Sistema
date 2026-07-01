import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS avaliacao (
        id_avaliacao  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_reserva    UUID NOT NULL UNIQUE REFERENCES reserva(id_reserva) ON DELETE CASCADE,
        id_utilizador UUID NOT NULL REFERENCES utilizador(id_utilizador),
        id_recurso    UUID NOT NULL REFERENCES recurso(id_recurso),
        nota          INT  NOT NULL CHECK (nota BETWEEN 1 AND 5),
        comentario    VARCHAR(500),
        criado_em     TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    console.log('✓ Tabela avaliacao criada');
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

-- SIGARE — Schema inicial
-- Colar no Supabase: SQL Editor → New query → Run

CREATE TYPE tipo_utilizador AS ENUM ('organizador', 'fornecedor', 'administrador', 'gestor_municipal');
CREATE TYPE estado_reserva   AS ENUM ('pendente', 'confirmada', 'rejeitada');

CREATE TABLE "utilizador" (
  "id_utilizador" UUID        NOT NULL DEFAULT gen_random_uuid(),
  "nome"          VARCHAR(120) NOT NULL,
  "email"         VARCHAR(160) NOT NULL,
  "senha_hash"    VARCHAR(200) NOT NULL,
  "tipo"          tipo_utilizador NOT NULL,
  "telefone"      VARCHAR(30),
  "criado_em"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "utilizador_pkey" PRIMARY KEY ("id_utilizador")
);
CREATE UNIQUE INDEX "utilizador_email_key" ON "utilizador"("email");

CREATE TABLE "fornecedor" (
  "id_fornecedor"  UUID         NOT NULL DEFAULT gen_random_uuid(),
  "id_utilizador"  UUID         NOT NULL,
  "nome"           VARCHAR(120) NOT NULL,
  "contacto"       VARCHAR(60),
  "endereco"       VARCHAR(200),
  "validado"       BOOLEAN      NOT NULL DEFAULT false,
  CONSTRAINT "fornecedor_pkey" PRIMARY KEY ("id_fornecedor")
);
CREATE UNIQUE INDEX "fornecedor_id_utilizador_key" ON "fornecedor"("id_utilizador");

CREATE TABLE "categoria" (
  "id_categoria" UUID        NOT NULL DEFAULT gen_random_uuid(),
  "nome"         VARCHAR(80) NOT NULL,
  CONSTRAINT "categoria_pkey" PRIMARY KEY ("id_categoria")
);
CREATE UNIQUE INDEX "categoria_nome_key" ON "categoria"("nome");

CREATE TABLE "recurso" (
  "id_recurso"      UUID         NOT NULL DEFAULT gen_random_uuid(),
  "nome"            VARCHAR(150) NOT NULL,
  "preco"           DECIMAL(10,2) NOT NULL,
  "disponibilidade" BOOLEAN      NOT NULL DEFAULT true,
  "id_fornecedor"   UUID         NOT NULL,
  "id_categoria"    UUID         NOT NULL,
  "criado_em"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT "recurso_pkey" PRIMARY KEY ("id_recurso")
);
CREATE INDEX "idx_reserva_recurso_data" ON "recurso"("id_fornecedor", "id_categoria");

CREATE TABLE "reserva" (
  "id_reserva"    UUID          NOT NULL DEFAULT gen_random_uuid(),
  "data_reserva"  DATE          NOT NULL,
  "estado"        estado_reserva NOT NULL DEFAULT 'pendente',
  "id_utilizador" UUID          NOT NULL,
  "id_recurso"    UUID          NOT NULL,
  "criado_em"     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT "reserva_pkey" PRIMARY KEY ("id_reserva")
);
CREATE INDEX "idx_reserva_recurso_data_real" ON "reserva"("id_recurso", "data_reserva");

CREATE TABLE "notificacao" (
  "id_notificacao" UUID         NOT NULL DEFAULT gen_random_uuid(),
  "mensagem"       VARCHAR(300) NOT NULL,
  "tipo"           VARCHAR(40)  NOT NULL,
  "lida"           BOOLEAN      NOT NULL DEFAULT false,
  "id_utilizador"  UUID         NOT NULL,
  "id_reserva"     UUID,
  "criado_em"      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id_notificacao")
);

-- Foreign keys
ALTER TABLE "fornecedor"  ADD CONSTRAINT "fornecedor_id_utilizador_fkey"  FOREIGN KEY ("id_utilizador") REFERENCES "utilizador"("id_utilizador") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurso"     ADD CONSTRAINT "recurso_id_fornecedor_fkey"     FOREIGN KEY ("id_fornecedor") REFERENCES "fornecedor"("id_fornecedor") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurso"     ADD CONSTRAINT "recurso_id_categoria_fkey"      FOREIGN KEY ("id_categoria")  REFERENCES "categoria"("id_categoria")  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reserva"     ADD CONSTRAINT "reserva_id_utilizador_fkey"     FOREIGN KEY ("id_utilizador") REFERENCES "utilizador"("id_utilizador") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reserva"     ADD CONSTRAINT "reserva_id_recurso_fkey"        FOREIGN KEY ("id_recurso")    REFERENCES "recurso"("id_recurso")       ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_id_utilizador_fkey" FOREIGN KEY ("id_utilizador") REFERENCES "utilizador"("id_utilizador") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_id_reserva_fkey"    FOREIGN KEY ("id_reserva")    REFERENCES "reserva"("id_reserva")       ON DELETE SET NULL ON UPDATE CASCADE;

-- Dados iniciais — categorias base
INSERT INTO "categoria" ("nome") VALUES
  ('Palcos e Tendas'),
  ('Som e Iluminação'),
  ('Catering'),
  ('Segurança'),
  ('Decoração'),
  ('Transporte');

-- Marcar migrações como aplicadas no Prisma
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                TEXT        NOT NULL,
  "checksum"          TEXT        NOT NULL,
  "finished_at"       TIMESTAMPTZ,
  "migration_name"    TEXT        NOT NULL,
  "logs"              TEXT,
  "rolled_back_at"    TIMESTAMPTZ,
  "started_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INT       NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

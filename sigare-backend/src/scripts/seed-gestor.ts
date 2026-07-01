import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  const senha = 'GestorXaiXai2024';
  const hash = await bcrypt.hash(senha, 10);

  const existe = await prisma.utilizador.findUnique({ where: { email: 'gestor@xaixai.gov.mz' } });
  if (existe) {
    console.log('Gestor municipal já existe:', existe.email);
    return;
  }

  const gestor = await prisma.utilizador.create({
    data: {
      nome: 'Gestor Municipal de Xai-Xai',
      email: 'gestor@xaixai.gov.mz',
      senha_hash: hash,
      tipo: 'gestor_municipal',
      telefone: '+258 28 222 000',
    },
  });

  console.log('\n✅ Gestor municipal criado com sucesso!');
  console.log('   Email   :', gestor.email);
  console.log('   Senha   :', senha);
  console.log('   Tipo    :', gestor.tipo);
  console.log('   ID      :', gestor.id_utilizador);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

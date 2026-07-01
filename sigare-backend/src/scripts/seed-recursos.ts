import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

const SUPABASE_URL = 'https://vjihutfqsopearfhsggp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WtUa1QuQNiyqrVs6xTSIzg_QcDOJpeU';
const IMAGENS_DIR = 'C:/Users/dell/Documents/Monografia/SIGARE/imagens';

// Mapeamento imagem → recurso
const recursos = [
  {
    ficheiro: 'Cadeira para conferencia.jpg',
    nome: 'Cadeira para Conferência',
    descricao: 'Cadeira estofada ideal para conferências, seminários e reuniões corporativas.',
    categoria: 'Decoração',
    preco_hora: 50, preco_dia: 300, quantidade: 100,
  },
  {
    ficheiro: 'Decoracao.jpg',
    nome: 'Decoração Floral Completa',
    descricao: 'Decoração floral completa para salões e espaços de eventos.',
    categoria: 'Decoração',
    preco_hora: 800, preco_dia: 4500, quantidade: 1,
  },
  {
    ficheiro: 'Luzeis para eventos.jpg',
    nome: 'Luzes para Eventos',
    descricao: 'Sistema de iluminação colorida para eventos, festas e espectáculos.',
    categoria: 'Som e Iluminação',
    preco_hora: 350, preco_dia: 2000, quantidade: 5,
  },
  {
    ficheiro: 'Mesa branca.jpg',
    nome: 'Mesa Branca para Eventos',
    descricao: 'Mesa branca rectangular ideal para banquetes e eventos formais.',
    categoria: 'Decoração',
    preco_hora: 80, preco_dia: 450, quantidade: 30,
  },
  {
    ficheiro: 'Mesa-8cadeiras.jpg',
    nome: 'Mesa com 8 Cadeiras',
    descricao: 'Conjunto de mesa redonda com 8 cadeiras para eventos e jantares.',
    categoria: 'Decoração',
    preco_hora: 200, preco_dia: 1200, quantidade: 20,
  },
  {
    ficheiro: 'Mini-Som.jpg',
    nome: 'Sistema Mini Som',
    descricao: 'Sistema de som compacto ideal para pequenos eventos e reuniões.',
    categoria: 'Som e Iluminação',
    preco_hora: 400, preco_dia: 2500, quantidade: 3,
  },
  {
    ficheiro: 'Ornamentacao.jpg',
    nome: 'Ornamentação para Eventos',
    descricao: 'Ornamentação completa com balões, tecidos e elementos decorativos.',
    categoria: 'Decoração',
    preco_hora: 600, preco_dia: 3500, quantidade: 1,
  },
  {
    ficheiro: 'Palco para teu evento.jpg',
    nome: 'Palco para Evento',
    descricao: 'Palco modular profissional para shows, conferências e cerimónias.',
    categoria: 'Palcos e Tendas',
    preco_hora: 1500, preco_dia: 8000, quantidade: 1,
  },
  {
    ficheiro: 'Palm.jpg',
    nome: 'Palmeiras Decorativas',
    descricao: 'Plantas artificiais de palmeira para decoração tropical de eventos.',
    categoria: 'Decoração',
    preco_hora: 150, preco_dia: 800, quantidade: 10,
  },
  {
    ficheiro: 'Pista de danca.jpg',
    nome: 'Pista de Dança',
    descricao: 'Pista de dança modular com iluminação LED embutida.',
    categoria: 'Palcos e Tendas',
    preco_hora: 1200, preco_dia: 6500, quantidade: 1,
  },
  {
    ficheiro: 'Salao2.jpg',
    nome: 'Salão de Eventos',
    descricao: 'Salão climatizado com capacidade para 200 pessoas, com estacionamento.',
    categoria: 'Palcos e Tendas',
    preco_hora: 3000, preco_dia: 15000, quantidade: 1,
    endereco: 'Av. Julius Nyerere, Polana, Maputo',
  },
  {
    ficheiro: 'Som3.jpg',
    nome: 'Sistema de Som Profissional',
    descricao: 'Sistema de som de alta potência com colunas, amplificadores e mesa de mistura.',
    categoria: 'Som e Iluminação',
    preco_hora: 1200, preco_dia: 7000, quantidade: 2,
  },
  {
    ficheiro: 'Tenda-1.jpg',
    nome: 'Tenda para Eventos',
    descricao: 'Tenda resistente 10x10m ideal para eventos ao ar livre.',
    categoria: 'Palcos e Tendas',
    preco_hora: 800, preco_dia: 4500, quantidade: 5,
  },
  {
    ficheiro: 'Tenda-feiras.jpg',
    nome: 'Tenda para Feiras',
    descricao: 'Tenda 3x3m para exposições, feiras e mercados ao ar livre.',
    categoria: 'Palcos e Tendas',
    preco_hora: 300, preco_dia: 1500, quantidade: 15,
  },
  {
    ficheiro: 'cadeira plastica branca.jpg',
    nome: 'Cadeira Plástica Branca',
    descricao: 'Cadeira plástica branca resistente para eventos e festas.',
    categoria: 'Decoração',
    preco_hora: 20, preco_dia: 100, quantidade: 200,
  },
  {
    ficheiro: 'pAra-casment.jpg',
    nome: 'Decoração para Casamento',
    descricao: 'Pacote completo de decoração para cerimónia e recepção de casamento.',
    categoria: 'Decoração',
    preco_hora: 2000, preco_dia: 12000, quantidade: 1,
  },
  {
    ficheiro: 'tenda-festa.jpg',
    nome: 'Tenda para Festas',
    descricao: 'Tenda elegante 6x12m com laterais para festas e celebrações.',
    categoria: 'Palcos e Tendas',
    preco_hora: 600, preco_dia: 3500, quantidade: 3,
  },
];

async function uploadImagem(ficheiro: string): Promise<string | null> {
  const caminhoCompleto = path.join(IMAGENS_DIR, ficheiro);
  if (!fs.existsSync(caminhoCompleto)) {
    console.warn(`  ⚠ Ficheiro não encontrado: ${ficheiro}`);
    return null;
  }

  const buffer = fs.readFileSync(caminhoCompleto);
  const nomeSafe = ficheiro.replace(/\s+/g, '-').toLowerCase();
  const storagePath = `recursos/${Date.now()}-${nomeSafe}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sigare/${storagePath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn(`  ⚠ Upload falhou para ${ficheiro}: ${err}`);
    return null;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/sigare/${storagePath}`;
}

async function main() {
  console.log('🚀 A iniciar seed de recursos...\n');

  // 1. Encontrar o fornecedor
  const fornecedor = await prisma.fornecedor.findFirst({
    include: { utilizador: true },
  });

  if (!fornecedor) {
    console.error('❌ Nenhum fornecedor encontrado na base de dados.');
    process.exit(1);
  }
  console.log(`✅ Fornecedor: ${fornecedor.nome} (${fornecedor.utilizador.email})\n`);

  // 2. Carregar categorias
  const categorias = await prisma.categoria.findMany();
  const catMap = Object.fromEntries(categorias.map((c) => [c.nome, c.id_categoria]));
  console.log(`✅ Categorias: ${categorias.map((c) => c.nome).join(', ')}\n`);

  // 3. Criar recursos
  let criados = 0;
  for (const r of recursos) {
    process.stdout.write(`📦 ${r.nome}...`);

    const id_categoria = catMap[r.categoria];
    if (!id_categoria) {
      console.log(` ⚠ Categoria "${r.categoria}" não encontrada, a saltar.`);
      continue;
    }

    // Upload da imagem
    const foto_url = await uploadImagem(r.ficheiro);

    // Criar recurso
    await prisma.recurso.create({
      data: {
        nome: r.nome,
        descricao: r.descricao,
        endereco: (r as any).endereco ?? null,
        preco: r.preco_hora,
        preco_hora: r.preco_hora,
        preco_dia: r.preco_dia,
        quantidade: r.quantidade,
        foto_url,
        disponibilidade: true,
        id_fornecedor: fornecedor.id_fornecedor,
        id_categoria,
      },
    });

    console.log(foto_url ? ` ✅ com foto` : ` ✅ sem foto`);
    criados++;
  }

  console.log(`\n🎉 Seed concluído! ${criados} recursos criados para "${fornecedor.nome}".`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

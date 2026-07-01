const pg = require('./node_modules/pg');

const regioes = [
  'aws-0-us-east-1',
  'aws-0-us-west-1',
  'aws-0-eu-west-1',
  'aws-0-eu-west-2',
  'aws-0-eu-central-1',
  'aws-0-ap-southeast-1',
  'aws-0-ap-northeast-1',
  'aws-0-sa-east-1',
];

const PROJETOS = [
  'vjihutfqsopearfhsggp',
  'apbkobhfnmcqqzqeeqss',
];
const PASS = 'Manhique16%40';

async function testar(project, regiao) {
  const url = `postgresql://postgres.${project}:${PASS}@${regiao}.pooler.supabase.com:6543/postgres`;
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch {
    return false;
  }
}

(async () => {
  for (const project of PROJETOS) {
    console.log(`\n--- Projeto: ${project} ---`);
    for (const r of regioes) {
      process.stdout.write(`  ${r}... `);
      const ok = await testar(project, r);
      console.log(ok ? 'OK ✓' : 'falhou');
      if (ok) {
        console.log(`\nURL CORRECTA:\npostgresql://postgres.${project}:Manhique16%40@${r}.pooler.supabase.com:6543/postgres`);
        process.exit(0);
      }
    }
  }
  console.log('\nNenhuma combinação funcionou.');
})();

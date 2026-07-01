const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  LevelFormat, TableOfContents,
} = require('docx');
const fs = require('fs');

// ─── CORES ───────────────────────────────────────────────────────────────────
const AZUL    = '0f2554';
const OURO    = 'e9b94e';
const OURO_BG = 'fef9e7';
const CINZA   = 'f1f5f9';
const BORDA   = 'cbd5e1';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const borda1 = (cor = BORDA) => ({ style: BorderStyle.SINGLE, size: 4, color: cor });
const bordas = (cor = BORDA) => ({ top: borda1(cor), bottom: borda1(cor), left: borda1(cor), right: borda1(cor) });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' });
const noBordas = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 180 },
    children: [new TextRun({ text, bold: true, size: 32, color: AZUL, font: 'Arial' })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: AZUL, font: 'Arial' })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: '334155', font: 'Arial' })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, size: 22, font: 'Arial', ...opts })],
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 22, font: 'Arial' })],
  });
}
function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'numbered', level },
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 22, font: 'Arial' })],
  });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function spacer(size = 200) {
  return new Paragraph({ spacing: { before: size } });
}
function linha() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: OURO } },
    spacing: { before: 60, after: 180 },
    children: [],
  });
}

// 1×1 transparent PNG as required fallback for SVG in docx v9
const FALLBACK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

function svgImage(svgStr, w, h) {
  return new ImageRun({
    type: 'svg',
    data: Buffer.from(svgStr),
    transformation: { width: w, height: h },
    altText: { title: 'Diagrama', description: 'Diagrama', name: 'Diagrama' },
    fallback: { type: 'png', data: FALLBACK_PNG },
  });
}

function centeredImage(svgStr, w, h) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [svgImage(svgStr, w, h)],
  });
}

// ─── TABELA GENÉRICA ─────────────────────────────────────────────────────────
function tabela(headers, rows, colWidths) {
  const totalW = colWidths.reduce((s, v) => s + v, 0);
  const headerBg = AZUL;

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        borders: bordas(AZUL),
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: headerBg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 140, right: 140 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 20, color: OURO, font: 'Arial' })],
        })],
      })
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, i) =>
        new TableCell({
          borders: bordas(BORDA),
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? 'FFFFFF' : CINZA, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [new Paragraph({
            children: [new TextRun({ text: String(cell), size: 20, font: 'Arial' })],
          })],
        })
      ),
    })
  );

  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

// ─── SVG: DIAGRAMA DE CASOS DE USO ───────────────────────────────────────────
function svgCasosDeUso() {
  return `<svg viewBox="0 0 900 700" xmlns="http://www.w3.org/2000/svg" font-family="Arial" font-size="12">
  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#64748b"/>
    </marker>
  </defs>

  <!-- Background -->
  <rect width="900" height="700" fill="#f8fafc" rx="12"/>
  <text x="450" y="34" text-anchor="middle" font-size="17" font-weight="bold" fill="#0f2554">Diagrama de Casos de Uso — SIGARE</text>

  <!-- System boundary -->
  <rect x="200" y="55" width="510" height="620" rx="8" fill="white" stroke="#0f2554" stroke-width="2" stroke-dasharray="8,4"/>
  <text x="455" y="76" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f2554">Sistema SIGARE</text>

  <!-- ACTORES -->
  <!-- Organizador -->
  <circle cx="60" cy="200" r="18" fill="none" stroke="#0f2554" stroke-width="2"/>
  <line x1="60" y1="218" x2="60" y2="260" stroke="#0f2554" stroke-width="2"/>
  <line x1="30" y1="238" x2="90" y2="238" stroke="#0f2554" stroke-width="2"/>
  <line x1="60" y1="260" x2="35" y2="285" stroke="#0f2554" stroke-width="2"/>
  <line x1="60" y1="260" x2="85" y2="285" stroke="#0f2554" stroke-width="2"/>
  <text x="60" y="302" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f2554">Organizador</text>

  <!-- Fornecedor -->
  <circle cx="60" cy="430" r="18" fill="none" stroke="#0f2554" stroke-width="2"/>
  <line x1="60" y1="448" x2="60" y2="490" stroke="#0f2554" stroke-width="2"/>
  <line x1="30" y1="468" x2="90" y2="468" stroke="#0f2554" stroke-width="2"/>
  <line x1="60" y1="490" x2="35" y2="515" stroke="#0f2554" stroke-width="2"/>
  <line x1="60" y1="490" x2="85" y2="515" stroke="#0f2554" stroke-width="2"/>
  <text x="60" y="532" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f2554">Fornecedor</text>

  <!-- Administrador -->
  <circle cx="840" cy="250" r="18" fill="none" stroke="#0f2554" stroke-width="2"/>
  <line x1="840" y1="268" x2="840" y2="310" stroke="#0f2554" stroke-width="2"/>
  <line x1="810" y1="288" x2="870" y2="288" stroke="#0f2554" stroke-width="2"/>
  <line x1="840" y1="310" x2="815" y2="335" stroke="#0f2554" stroke-width="2"/>
  <line x1="840" y1="310" x2="865" y2="335" stroke="#0f2554" stroke-width="2"/>
  <text x="840" y="352" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f2554">Administrador</text>

  <!-- Gestor Municipal -->
  <circle cx="840" cy="460" r="18" fill="none" stroke="#0f2554" stroke-width="2"/>
  <line x1="840" y1="478" x2="840" y2="520" stroke="#0f2554" stroke-width="2"/>
  <line x1="810" y1="498" x2="870" y2="498" stroke="#0f2554" stroke-width="2"/>
  <line x1="840" y1="520" x2="815" y2="545" stroke="#0f2554" stroke-width="2"/>
  <line x1="840" y1="520" x2="865" y2="545" stroke="#0f2554" stroke-width="2"/>
  <text x="840" y="562" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f2554">Gestor</text>
  <text x="840" y="576" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f2554">Municipal</text>

  <!-- CASOS DE USO col 1 -->
  ${uc(255, 110, 180, 24, 'Registar / Autenticar')}
  ${uc(255, 160, 180, 24, 'Pesquisar Recursos')}
  ${uc(255, 210, 180, 24, 'Reservar Recursos')}
  ${uc(255, 260, 180, 24, 'Seleccionar Quantidade')}
  ${uc(255, 310, 180, 24, 'Ver Recibo')}
  ${uc(255, 360, 180, 24, 'Ver Notificações')}
  ${uc(255, 410, 180, 24, 'Cancelar Reserva')}

  <!-- CASOS DE USO col 2 -->
  ${uc(495, 110, 180, 24, 'Gerir Recursos')}
  ${uc(495, 160, 180, 24, 'Aceitar / Rejeitar Pedido')}
  ${uc(495, 210, 180, 24, 'Alocar Funcionário')}
  ${uc(495, 260, 180, 24, 'Gerir Funcionários')}
  ${uc(495, 310, 180, 24, 'Avançar Estado Reserva')}
  ${uc(495, 360, 180, 24, 'Ver Recibo (Fornecedor)')}
  ${uc(495, 410, 180, 24, 'Validar Fornecedores')}
  ${uc(495, 460, 180, 24, 'Gerir Utilizadores')}
  ${uc(495, 510, 180, 24, 'Ver Relatórios')}
  ${uc(495, 560, 180, 24, 'Ver Estatísticas Cidade')}

  <!-- LINHAS Organizador -->
  ${ln(105, 200, 255, 110)}
  ${ln(105, 200, 255, 160)}
  ${ln(105, 200, 255, 210)}
  ${ln(105, 220, 255, 260)}
  ${ln(105, 240, 255, 310)}
  ${ln(105, 250, 255, 360)}
  ${ln(105, 260, 255, 410)}

  <!-- LINHAS Fornecedor -->
  ${ln(105, 430, 495, 160)}
  ${ln(105, 430, 495, 210)}
  ${ln(105, 430, 495, 260)}
  ${ln(105, 435, 495, 310)}
  ${ln(105, 440, 495, 360)}
  ${ln(105, 445, 495, 110)}

  <!-- LINHAS Administrador -->
  ${ln(715, 250, 675, 410)}
  ${ln(715, 260, 675, 460)}
  ${ln(715, 280, 675, 510)}

  <!-- LINHAS Gestor -->
  ${ln(715, 460, 675, 510)}
  ${ln(715, 465, 675, 560)}

  <!-- Legenda -->
  <ellipse cx="228" cy="650" rx="18" ry="10" fill="none" stroke="#0f2554" stroke-width="1.5"/>
  <text x="252" y="654" font-size="11" fill="#475569">Caso de Uso</text>
  <circle cx="340" cy="650" r="7" fill="none" stroke="#0f2554" stroke-width="1.5"/>
  <line x1="340" y1="657" x2="340" y2="666" stroke="#0f2554" stroke-width="1.5"/>
  <line x1="329" y1="662" x2="351" y2="662" stroke="#0f2554" stroke-width="1.5"/>
  <text x="355" y="654" font-size="11" fill="#475569">Actor</text>
  <line x1="420" y1="650" x2="460" y2="650" stroke="#64748b" stroke-width="1.5"/>
  <text x="465" y="654" font-size="11" fill="#475569">Associação</text>
</svg>`;
}

function uc(x, y, w, h, label) {
  const lines = splitLabel(label, 22);
  const textY = lines.length === 1 ? y + 4 : y;
  return `<ellipse cx="${x + w/2}" cy="${y}" rx="${w/2}" ry="${h/2}" fill="#eff6ff" stroke="#1e40af" stroke-width="1.5"/>
  ${lines.map((l, i) => `<text x="${x + w/2}" y="${textY + i * 14}" text-anchor="middle" font-size="10.5" fill="#0f2554">${l}</text>`).join('\n  ')}`;
}

function ln(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#64748b" stroke-width="1" marker-end="url(#arr)"/>`;
}

function splitLabel(label, maxLen) {
  if (label.length <= maxLen) return [label];
  const words = label.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxLen) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

// ─── SVG: DIAGRAMA ER ────────────────────────────────────────────────────────
function svgER() {
  return `<svg viewBox="0 0 950 780" xmlns="http://www.w3.org/2000/svg" font-family="Arial" font-size="11">
  <rect width="950" height="780" fill="#f8fafc" rx="10"/>
  <text x="475" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#0f2554">Diagrama Entidade-Relacionamento — SIGARE</text>

  <!-- UTILIZADOR -->
  ${entity(20, 50, 200, 'Utilizador', [
    'PK id_utilizador : UUID',
    'nome : VARCHAR(120)',
    'email : VARCHAR(160)',
    'senha_hash : VARCHAR(200)',
    'tipo : ENUM',
    'telefone : VARCHAR(30)',
    'criado_em : TIMESTAMP',
  ])}

  <!-- FORNECEDOR -->
  ${entity(270, 50, 200, 'Fornecedor', [
    'PK id_fornecedor : UUID',
    'FK id_utilizador : UUID',
    'nome : VARCHAR(120)',
    'contacto : VARCHAR(60)',
    'endereco : VARCHAR(200)',
    'validado : BOOLEAN',
  ])}

  <!-- CATEGORIA -->
  ${entity(520, 50, 200, 'Categoria', [
    'PK id_categoria : UUID',
    'nome : VARCHAR(80)',
  ])}

  <!-- RECURSO -->
  ${entity(270, 270, 200, 'Recurso', [
    'PK id_recurso : UUID',
    'FK id_fornecedor : UUID',
    'FK id_categoria : UUID',
    'nome : VARCHAR(150)',
    'descricao : TEXT',
    'endereco : VARCHAR(300)',
    'preco : DECIMAL(10,2)',
    'preco_hora : DECIMAL(10,2)',
    'preco_dia : DECIMAL(10,2)',
    'quantidade : INT',
    'foto_url : VARCHAR(500)',
    'disponibilidade : BOOLEAN',
    'criado_em : TIMESTAMP',
  ])}

  <!-- RESERVA -->
  ${entity(20, 410, 200, 'Reserva', [
    'PK id_reserva : UUID',
    'FK id_utilizador : UUID',
    'FK id_recurso : UUID',
    'data_reserva : DATE',
    'hora_inicio : TIME',
    'horas : INT',
    'qtd_solicitada : INT',
    'local_evento : VARCHAR(300)',
    'estado : ENUM',
    'criado_em : TIMESTAMP',
  ])}

  <!-- FUNCIONARIO -->
  ${entity(520, 270, 200, 'Funcionario', [
    'PK id_funcionario : UUID',
    'FK id_fornecedor : UUID',
    'nome : VARCHAR(120)',
    'contacto : VARCHAR(60)',
    'funcao : VARCHAR(80)',
    'criado_em : TIMESTAMP',
  ])}

  <!-- ALOCACAO -->
  ${entity(520, 490, 200, 'Alocacao', [
    'PK id_alocacao : UUID',
    'FK id_funcionario : UUID',
    'FK id_reserva : UUID',
    'funcao_no_evento : VARCHAR(80)',
    'criado_em : TIMESTAMP',
  ])}

  <!-- NOTIFICACAO -->
  ${entity(20, 660, 200, 'Notificacao', [
    'PK id_notificacao : UUID',
    'FK id_utilizador : UUID',
    'FK id_reserva : UUID',
    'mensagem : VARCHAR(300)',
    'tipo : VARCHAR(40)',
    'lida : BOOLEAN',
    'criado_em : TIMESTAMP',
  ])}

  <!-- RELACIONAMENTOS -->
  <!-- Utilizador 1--* Fornecedor -->
  <line x1="220" y1="100" x2="270" y2="100" stroke="#0f2554" stroke-width="1.8"/>
  <text x="224" y="95" font-size="9" fill="#475569">1</text>
  <text x="258" y="95" font-size="9" fill="#475569">1</text>

  <!-- Fornecedor 1--* Recurso -->
  <line x1="370" y1="200" x2="370" y2="270" stroke="#0f2554" stroke-width="1.8"/>
  <text x="375" y="215" font-size="9" fill="#475569">1</text>
  <text x="375" y="265" font-size="9" fill="#475569">N</text>

  <!-- Categoria 1--* Recurso -->
  <line x1="520" y1="100" x2="470" y2="300" stroke="#0f2554" stroke-width="1.8"/>
  <text x="506" y="115" font-size="9" fill="#475569">1</text>
  <text x="476" y="295" font-size="9" fill="#475569">N</text>

  <!-- Utilizador 1--* Reserva -->
  <line x1="120" y1="220" x2="120" y2="410" stroke="#0f2554" stroke-width="1.8"/>
  <text x="125" y="235" font-size="9" fill="#475569">1</text>
  <text x="125" y="405" font-size="9" fill="#475569">N</text>

  <!-- Recurso 1--* Reserva -->
  <line x1="270" y1="360" x2="220" y2="460" stroke="#0f2554" stroke-width="1.8"/>
  <text x="262" y="375" font-size="9" fill="#475569">1</text>
  <text x="225" y="455" font-size="9" fill="#475569">N</text>

  <!-- Fornecedor 1--* Funcionario -->
  <line x1="470" y1="120" x2="520" y2="300" stroke="#0f2554" stroke-width="1.8"/>
  <text x="478" y="135" font-size="9" fill="#475569">1</text>
  <text x="514" y="295" font-size="9" fill="#475569">N</text>

  <!-- Funcionario 1--* Alocacao -->
  <line x1="620" y1="430" x2="620" y2="490" stroke="#0f2554" stroke-width="1.8"/>
  <text x="625" y="445" font-size="9" fill="#475569">1</text>
  <text x="625" y="485" font-size="9" fill="#475569">N</text>

  <!-- Reserva 1--* Alocacao -->
  <line x1="220" y1="550" x2="520" y2="550" stroke="#0f2554" stroke-width="1.8"/>
  <text x="226" y="545" font-size="9" fill="#475569">1</text>
  <text x="508" y="545" font-size="9" fill="#475569">N</text>

  <!-- Reserva 1--* Notificacao -->
  <line x1="120" y1="620" x2="120" y2="660" stroke="#0f2554" stroke-width="1.8"/>
  <text x="125" y="635" font-size="9" fill="#475569">1</text>
  <text x="125" y="655" font-size="9" fill="#475569">N</text>

  <!-- Utilizador 1--* Notificacao -->
  <line x1="70" y1="620" x2="70" y2="660" stroke="#9333ea" stroke-width="1.2" stroke-dasharray="4,2"/>

  <!-- Legenda -->
  <rect x="700" y="650" width="220" height="110" rx="6" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <text x="810" y="668" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f2554">Legenda</text>
  <rect x="715" y="678" width="50" height="16" rx="2" fill="#eff6ff" stroke="#1e40af" stroke-width="1"/>
  <text x="772" y="690" font-size="10" fill="#475569">Entidade</text>
  <rect x="715" y="700" width="50" height="10" rx="1" fill="#fef3c7" stroke="#d97706" stroke-width="1"/>
  <text x="772" y="710" font-size="10" fill="#475569">Atributos (PK/FK)</text>
  <line x1="715" y1="725" x2="765" y2="725" stroke="#0f2554" stroke-width="1.8"/>
  <text x="772" y="729" font-size="10" fill="#475569">Relacionamento</text>
  <text x="715" y="750" font-size="9" fill="#475569">1 / N = cardinalidade</text>
</svg>`;
}

function entity(x, y, w, label, attrs) {
  const rowH = 16;
  const h = 22 + attrs.length * rowH;
  const midW = x + w / 2;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="22" rx="4" fill="#0f2554"/>
  <text x="${midW}" y="${y + 15}" text-anchor="middle" font-size="12" font-weight="bold" fill="#e9b94e">${label}</text>
  <rect x="${x}" y="${y + 22}" width="${w}" height="${attrs.length * rowH}" fill="#eff6ff" stroke="#1e40af" stroke-width="1"/>
  ${attrs.map((a, i) => {
    const isPK = a.startsWith('PK');
    const isFK = a.startsWith('FK');
    const col = isPK ? '#b45309' : isFK ? '#7c3aed' : '#1e3a5f';
    const bg = isPK ? '#fef3c7' : isFK ? '#f3e8ff' : 'transparent';
    return `${bg !== 'transparent' ? `<rect x="${x+1}" y="${y+22+i*rowH}" width="${w-2}" height="${rowH}" fill="${bg}"/>` : ''}
  <text x="${x + 8}" y="${y + 22 + i*rowH + 11}" font-size="9.5" fill="${col}">${a}</text>`;
  }).join('\n  ')}`;
}

// ─── SVG: CICLO DE VIDA DA RESERVA ───────────────────────────────────────────
function svgCicloVida() {
  return `<svg viewBox="0 0 780 260" xmlns="http://www.w3.org/2000/svg" font-family="Arial" font-size="11">
  <rect width="780" height="260" fill="#f8fafc" rx="10"/>
  <text x="390" y="26" text-anchor="middle" font-size="14" font-weight="bold" fill="#0f2554">Ciclo de Vida de uma Reserva</text>

  <!-- Estados -->
  ${estado(30,  110, 90, 28, 'PENDENTE',    '#fef9c3', '#854d0e')}
  ${estado(165, 110, 90, 28, 'CONFIRMADA',  '#dbeafe', '#1e40af')}
  ${estado(300, 110, 100, 28, 'EM ANDAMENTO','#ede9fe', '#5b21b6')}
  ${estado(445, 110, 90, 28, 'TERMINADA',   '#dcfce7', '#14532d')}
  ${estado(580, 110, 90, 28, 'DEVOLVIDA',   '#f1f5f9', '#475569')}

  <!-- Rejeitada -->
  ${estado(165, 195, 90, 28, 'REJEITADA',   '#fee2e2', '#7f1d1d')}

  <!-- INICIO -->
  <circle cx="15" cy="124" r="8" fill="#0f2554"/>
  <line x1="23" y1="124" x2="30" y2="124" stroke="#0f2554" stroke-width="2" marker-end="url(#a)"/>

  <!-- Transições -->
  <defs>
    <marker id="a" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
      <path d="M0,0 L0,6 L7,3 z" fill="#0f2554"/>
    </marker>
    <marker id="r" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
      <path d="M0,0 L0,6 L7,3 z" fill="#dc2626"/>
    </marker>
  </defs>

  <!-- Pendente → Confirmada -->
  <line x1="120" y1="124" x2="165" y2="124" stroke="#0f2554" stroke-width="1.8" marker-end="url(#a)"/>
  <text x="141" y="118" text-anchor="middle" font-size="9" fill="#475569">Aceitar</text>

  <!-- Pendente → Rejeitada -->
  <path d="M 75,138 C 75,185 165,185 165,195" fill="none" stroke="#dc2626" stroke-width="1.5" marker-end="url(#r)" stroke-dasharray="4,2"/>
  <text x="100" y="178" font-size="9" fill="#dc2626">Rejeitar</text>

  <!-- Confirmada → Em Andamento (automático) -->
  <line x1="255" y1="124" x2="300" y2="124" stroke="#0f2554" stroke-width="1.8" marker-end="url(#a)"/>
  <text x="277" y="116" text-anchor="middle" font-size="9" fill="#475569">Hora</text>
  <text x="277" y="128" text-anchor="middle" font-size="8" fill="#7c3aed">⏱ auto</text>

  <!-- Em Andamento → Terminada (automático) -->
  <line x1="400" y1="124" x2="445" y2="124" stroke="#0f2554" stroke-width="1.8" marker-end="url(#a)"/>
  <text x="422" y="116" text-anchor="middle" font-size="9" fill="#475569">+Horas</text>
  <text x="422" y="128" text-anchor="middle" font-size="8" fill="#7c3aed">⏱ auto</text>

  <!-- Terminada → Devolvida -->
  <line x1="535" y1="124" x2="580" y2="124" stroke="#0f2554" stroke-width="1.8" marker-end="url(#a)"/>
  <text x="557" y="118" text-anchor="middle" font-size="9" fill="#475569">Devolver</text>

  <!-- FIM -->
  <circle cx="700" cy="124" r="10" fill="none" stroke="#0f2554" stroke-width="2"/>
  <circle cx="700" cy="124" r="6" fill="#0f2554"/>
  <line x1="670" y1="124" x2="688" y2="124" stroke="#0f2554" stroke-width="2" marker-end="url(#a)"/>

  <!-- Legenda -->
  <line x1="30" y1="242" x2="70" y2="242" stroke="#0f2554" stroke-width="1.8" marker-end="url(#a)"/>
  <text x="75" y="246" font-size="10" fill="#475569">Transição manual (Fornecedor)</text>
  <line x1="300" y1="242" x2="340" y2="242" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="4,2" marker-end="url(#a)"/>
  <text x="345" y="246" font-size="10" fill="#475569">Transição automática (cron)</text>
  <line x1="530" y1="242" x2="570" y2="242" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4,2" marker-end="url(#r)"/>
  <text x="575" y="246" font-size="10" fill="#475569">Rejeição</text>
</svg>`;
}

function estado(x, y, w, h, label, fill, textCol) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${textCol}" stroke-width="1.5"/>
  <text x="${x + w/2}" y="${y + h/2 + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="${textCol}">${label}</text>`;
}

// ─── SVG: ARQUITECTURA ────────────────────────────────────────────────────────
function svgArquitectura() {
  return `<svg viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg" font-family="Arial" font-size="12">
  <rect width="700" height="400" fill="#f8fafc" rx="10"/>
  <text x="350" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="#0f2554">Arquitectura do Sistema (3 Camadas)</text>

  <!-- Camada Apresentação -->
  <rect x="40" y="50" width="620" height="90" rx="8" fill="#dbeafe" stroke="#1e40af" stroke-width="2"/>
  <text x="350" y="74" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">Camada de Apresentação (Frontend)</text>
  <text x="350" y="92" text-anchor="middle" font-size="11" fill="#1e3a5f">Next.js 16 · React 19 · Tailwind CSS · TypeScript</text>
  <!-- boxes -->
  ${camBox(60,  100, 100, 30, 'Landing Page',    '#eff6ff', '#1e40af')}
  ${camBox(175, 100, 100, 30, 'Pesquisa/Reserva', '#eff6ff', '#1e40af')}
  ${camBox(290, 100, 100, 30, 'Painel Organizador','#eff6ff', '#1e40af')}
  ${camBox(405, 100, 100, 30, 'Painel Fornecedor', '#eff6ff', '#1e40af')}
  ${camBox(520, 100, 120, 30, 'Painel Admin/Gestor','#eff6ff', '#1e40af')}

  <!-- Setas -->
  <line x1="350" y1="140" x2="350" y2="170" stroke="#64748b" stroke-width="2" marker-end="url(#ax)"/>
  <line x1="350" y1="270" x2="350" y2="300" stroke="#64748b" stroke-width="2" marker-end="url(#ax)"/>
  <text x="365" y="158" font-size="10" fill="#64748b">HTTP/REST (JSON)</text>
  <text x="365" y="290" font-size="10" fill="#64748b">SQL (Prisma ORM)</text>

  <!-- Camada Negócio -->
  <rect x="40" y="170" width="620" height="130" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
  <text x="350" y="193" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">Camada de Negócio (Backend)</text>
  <text x="350" y="210" text-anchor="middle" font-size="11" fill="#14532d">Express.js · Node.js · TypeScript · JWT · Zod · node-cron</text>
  ${camBox(60,  220, 110, 30, 'Auth Controller',   '#dcfce7', '#15803d')}
  ${camBox(185, 220, 110, 30, 'Reservas Controller','#dcfce7', '#15803d')}
  ${camBox(310, 220, 110, 30, 'Recursos Controller','#dcfce7', '#15803d')}
  ${camBox(435, 220, 110, 30, 'Relatórios Controller','#dcfce7', '#15803d')}
  ${camBox(60,  258, 110, 30, 'Funcionários Ctrl', '#dcfce7', '#15803d')}
  ${camBox(185, 258, 110, 30, 'Notificações Ctrl', '#dcfce7', '#15803d')}
  ${camBox(310, 258, 110, 30, 'Scheduler (cron)',  '#fef9c3', '#854d0e')}
  ${camBox(435, 258, 110, 30, 'Middleware JWT',    '#fee2e2', '#991b1b')}

  <!-- Camada Dados -->
  <rect x="40" y="300" width="620" height="80" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
  <text x="350" y="322" text-anchor="middle" font-size="13" font-weight="bold" fill="#92400e">Camada de Dados (Base de Dados)</text>
  <text x="350" y="340" text-anchor="middle" font-size="11" fill="#78350f">Prisma ORM v7 · PostgreSQL (Supabase) · Supabase Storage (imagens)</text>
  ${camBox(60,  348, 140, 24, 'Utilizador · Fornecedor', '#fef9c3', '#92400e')}
  ${camBox(215, 348, 120, 24, 'Recurso · Categoria',  '#fef9c3', '#92400e')}
  ${camBox(350, 348, 120, 24, 'Reserva · Alocacao',   '#fef9c3', '#92400e')}
  ${camBox(485, 348, 140, 24, 'Funcionario · Notificacao','#fef9c3', '#92400e')}

  <defs>
    <marker id="ax" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
      <path d="M0,0 L0,6 L7,3 z" fill="#64748b"/>
    </marker>
  </defs>
</svg>`;
}

function camBox(x, y, w, h, label, fill, stroke) {
  const lines = splitLabel(label, 16);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
  ${lines.map((l, i) => `<text x="${x + w/2}" y="${y + (h/2) + (lines.length > 1 ? (i - 0.5) * 11 : 4)}" text-anchor="middle" font-size="9" fill="${stroke}">${l}</text>`).join('\n  ')}`;
}

// ─── DOCUMENTO ────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 600, hanging: 300 } } },
        }],
      },
      {
        reference: 'numbered',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 600, hanging: 300 } } },
        }],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, color: AZUL, font: 'Arial' },
        paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, color: AZUL, font: 'Arial' },
        paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, color: '334155', font: 'Arial' },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [
    // ═══════════════════════════════════ CAPA ═══════════════════════════════
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        spacer(1200),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'SIGARE', bold: true, size: 72, color: AZUL, font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 80 },
          children: [new TextRun({ text: 'Sistema Integrado de Gestão e Alocação de', size: 28, color: '475569', font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 200 },
          children: [new TextRun({ text: 'Recursos para Eventos', size: 28, color: '475569', font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: OURO } },
          spacing: { before: 0, after: 300 },
          children: [],
        }),
        spacer(200),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: 'Documentação Técnica e Funcional', size: 26, bold: true, color: '334155', font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [new TextRun({ text: 'Trabalho de Licenciatura em Informática', size: 22, color: '64748b', font: 'Arial' })],
        }),
        spacer(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: 'Elton Silva Manhique', bold: true, size: 26, color: AZUL, font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: 'eltondasilvamanhique85@gmail.com', size: 20, color: '64748b', font: 'Arial' })],
        }),
        spacer(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: 'Xai-Xai, Gaza — Moçambique', size: 22, color: '334155', font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '2025', size: 22, color: '334155', font: 'Arial' })],
        }),
        pageBreak(),

        // ─── ÍNDICE ───────────────────────────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: '\xcdndice', bold: true, size: 32, color: AZUL, font: 'Arial' })],
        }),
        new TableOfContents('', { hyperlink: true, headingStyleRange: '1-3' }),
        pageBreak(),

        // ═══════════════════════ 1. DESCRIÇÃO DO SISTEMA ═══════════════════
        h1('1. Descrição do Sistema'),
        linha(),

        h2('1.1 Visão Geral'),
        p('O SIGARE (Sistema Integrado de Gestão e Alocação de Recursos para Eventos) é uma plataforma web desenvolvida especificamente para a cidade de Xai-Xai, capital da Província de Gaza, Moçambique. O sistema tem como objectivo principal digitalizar e centralizar o processo de reserva de recursos para eventos — como tendas, palcos, sistemas de som, decorações e catering — eliminando a necessidade de processos manuais e descentralizados.'),
        p('A plataforma serve como ponto de encontro entre organizadores de eventos e fornecedores de recursos, permitindo que reservas sejam feitas, confirmadas, geridas e acompanhadas de forma transparente e eficiente.'),

        h2('1.2 Objectivos'),
        bullet('Digitalizar o processo de reserva e gestão de recursos para eventos em Xai-Xai.'),
        bullet('Conectar organizadores de eventos com fornecedores locais de forma rápida e segura.'),
        bullet('Proporcionar ao gestor municipal visibilidade sobre a utilização de recursos na cidade.'),
        bullet('Garantir rastreabilidade completa de cada evento, desde o pedido até à devolução dos recursos.'),
        bullet('Reduzir conflitos de reservas e overbooking através de controlo de disponibilidade em tempo real.'),
        bullet('Facilitar a gestão de equipas (funcionários) alocadas a eventos.'),

        h2('1.3 Âmbito Geográfico'),
        p('O sistema destina-se exclusivamente à cidade de Xai-Xai e à sua área de influência na Província de Gaza. Todos os recursos registados, fornecedores cadastrados e eventos geridos têm como contexto geográfico esta região.'),

        h2('1.4 Tecnologias Utilizadas'),
        spacer(100),
        tabela(
          ['Camada', 'Tecnologia', 'Versão', 'Papel'],
          [
            ['Frontend', 'Next.js', '16.2.9', 'Framework React para SSR e App Router'],
            ['Frontend', 'React', '19.2.4', 'Biblioteca de interface de utilizador'],
            ['Frontend', 'Tailwind CSS', '3.x', 'Estilização utility-first'],
            ['Frontend', 'TypeScript', '5.x', 'Tipagem estática'],
            ['Backend', 'Node.js', '24.x', 'Runtime JavaScript no servidor'],
            ['Backend', 'Express.js', '5.x', 'Framework de API REST'],
            ['Backend', 'TypeScript', '6.x', 'Tipagem no backend'],
            ['Backend', 'Prisma ORM', '7.8.0', 'Acesso e modelação da base de dados'],
            ['Backend', 'node-cron', '4.x', 'Agendamento de tarefas automáticas'],
            ['Backend', 'Zod', '4.x', 'Validação de esquemas e dados'],
            ['Backend', 'JWT (jsonwebtoken)', '9.x', 'Autenticação stateless por token'],
            ['Base de Dados', 'PostgreSQL', '15.x', 'Base de dados relacional'],
            ['Infraestrutura', 'Supabase', 'Cloud', 'BaaS: PostgreSQL + Storage de imagens'],
          ],
          [2200, 2200, 1400, 3226]
        ),
        spacer(200),
        pageBreak(),

        // ═══════════════════════ 2. ACTORES ════════════════════════════════
        h1('2. Actores do Sistema'),
        linha(),
        p('O SIGARE define quatro tipos de utilizadores (actores), cada um com um conjunto específico de permissões e responsabilidades:'),
        spacer(100),
        tabela(
          ['Actor', 'Descrição', 'Permissões Principais'],
          [
            ['Organizador', 'Pessoa ou entidade que organiza eventos e necessita de recursos.', 'Pesquisar, reservar, acompanhar reservas, ver recibo, receber notificações.'],
            ['Fornecedor', 'Empresa ou indivíduo que disponibiliza recursos para eventos.', 'Registar recursos, aceitar/rejeitar pedidos, gerir funcionários, alocar equipa, emitir recibo.'],
            ['Administrador', 'Responsável pela gestão operacional da plataforma.', 'Validar fornecedores, gerir utilizadores, ver relatórios globais.'],
            ['Gestor Municipal', 'Representante da Câmara Municipal de Xai-Xai.', 'Monitorizar utilização de recursos na cidade, ver estatísticas e relatórios de eventos.'],
          ],
          [1800, 3600, 3626]
        ),
        spacer(200),
        pageBreak(),

        // ═══════════════════════ 3. FUNCIONALIDADES ═════════════════════════
        h1('3. Funcionalidades do Sistema'),
        linha(),

        h2('3.1 Módulo de Autenticação e Autorização'),
        bullet('Registo de utilizadores com selecção de papel (Organizador ou Fornecedor).'),
        bullet('Autenticação via email e senha com geração de token JWT (validade: 7 dias).'),
        bullet('Controlo de acesso baseado em papéis (RBAC) — cada rota da API valida o tipo de utilizador.'),
        bullet('Protecção de rotas no frontend — redirecionamento automático para login se sessão expirada.'),
        bullet('Logout com limpeza do token em localStorage.'),

        h2('3.2 Módulo de Pesquisa e Reserva de Recursos'),
        bullet('Pesquisa de recursos por nome e categoria com filtragem em tempo real.'),
        bullet('Filtro por data: mostra a quantidade disponível para o dia seleccionado (descontando reservas activas).'),
        bullet('Seleção de quantidade de unidades por recurso (excepto para locais fixos com endereço).'),
        bullet('Fluxo de reserva em 4 passos: Escolher Recursos → Dados do Evento → Revisão → Confirmação.'),
        bullet('Cálculo automático de preço: até 8 horas cobra por hora; acima de 8 horas cobra preço diário.'),
        bullet('Campo de local do evento: preenchido automaticamente se o recurso tiver endereço fixo.'),
        bullet('Validação: não permite reservas em datas/horas passadas.'),
        bullet('Reserva múltipla: permite reservar vários recursos em simultâneo para o mesmo evento.'),

        h2('3.3 Módulo de Gestão de Recursos (Fornecedor)'),
        bullet('Criação de recursos com nome, descrição, categoria, preço/hora, preço/dia, quantidade e foto.'),
        bullet('Upload de imagens para o Supabase Storage com URL pública.'),
        bullet('Edição e remoção de recursos existentes.'),
        bullet('Cada recurso pertence a uma categoria e a um fornecedor.'),
        bullet('Recursos com endereço fixo (locais) são tratados como lugar único — sem seleção de quantidade.'),

        h2('3.4 Módulo de Gestão de Reservas'),
        bullet('Fornecedor visualiza todos os pedidos recebidos com estado, data, recurso e organizador.'),
        bullet('Acção de aceitar ou rejeitar pedido com validação obrigatória de alocação de funcionário ao aceitar.'),
        bullet('Organizador acompanha o estado das suas reservas em tempo real.'),
        bullet('Fornecedor pode avançar manualmente o estado: em andamento → terminada → devolvida.'),
        bullet('Transições automáticas via cron job (executa a cada minuto): confirmada → em andamento na hora de início; em andamento → terminada após o tempo definido.'),
        bullet('Recibo de reserva acessível a organizador e fornecedor, com todos os detalhes do evento e equipa.'),

        h2('3.5 Módulo de Funcionários e Alocação'),
        bullet('Fornecedor regista os seus funcionários (nome, contacto, função).'),
        bullet('Ao aceitar um pedido, o fornecedor deve obrigatoriamente alocar pelo menos um funcionário.'),
        bullet('Validação de conflito de horário: um funcionário não pode ser alocado a dois eventos sobrepostos no mesmo dia.'),
        bullet('Alocações aparecem no recibo e são visíveis tanto ao fornecedor como ao organizador.'),

        h2('3.6 Módulo de Notificações'),
        bullet('Notificações em tempo real via bell icon no dashboard.'),
        bullet('Fornecedor recebe notificação ao chegar novo pedido de reserva.'),
        bullet('Organizador recebe notificação quando o pedido é aceite ou rejeitado.'),
        bullet('Notificações automáticas nas transições de estado (em andamento, terminada, devolvida).'),
        bullet('Marcação de notificações como lidas individualmente ou todas de uma vez.'),

        h2('3.7 Módulo de Relatórios e Estatísticas'),
        bullet('Gestor Municipal: dashboard com KPIs (total reservas, fornecedores activos, recursos, organizadores), gráfico de barras dos últimos 6 meses, reservas por estado, top recursos mais procurados.'),
        bullet('Administrador: visão global de utilizadores, recursos, reservas e fornecedores por validar; top recursos por taxa de aprovação.'),
        bullet('Endpoint público: estatísticas de fornecedores, recursos e eventos para a landing page.'),
        spacer(100),
        pageBreak(),

        // ═══════════════════════ 4. REGRAS DE NEGÓCIO ══════════════════════
        h1('4. Regras de Negócio'),
        linha(),

        h2('RN01 — Validação de Fornecedor'),
        p('Um fornecedor só pode publicar recursos após validação pelo Administrador. Contas de fornecedor criadas ficam com o estado validado=false até aprovação manual no painel de administração.'),

        h2('RN02 — Precificação por Hora e por Dia'),
        p('O sistema aplica duas modalidades de preço:'),
        bullet('Duração ≤ 8 horas: total = preco_hora × horas × quantidade.'),
        bullet('Duração > 8 horas: total = preco_dia × quantidade.'),
        p('Se o recurso não tiver preco_hora definido, aplica-se sempre o campo preco como valor fixo.'),

        h2('RN03 — Controlo de Disponibilidade por Data'),
        p('Para cada recurso numa data específica, a quantidade disponível é calculada como:'),
        p('quantidade_disponivel = quantidade_total - SUM(quantidade_solicitada) das reservas activas (estado <> rejeitada e <> devolvida)'),
        p('O sistema rejeita pedidos onde quantidade_solicitada > quantidade_disponivel com mensagem informativa do número de unidades restantes.'),

        h2('RN04 — Proibição de Reservas no Passado'),
        p('O sistema não aceita reservas para datas anteriores à data actual. Adicionalmente, se a data for o próprio dia da reserva, a hora de início deve ser obrigatoriamente futura em relação à hora actual.'),

        h2('RN05 — Alocação Obrigatória de Funcionário'),
        p('O fornecedor só pode confirmar (aceitar) um pedido de reserva se alocar pelo menos um funcionário ao evento. A interface bloqueia a confirmação até que a selecção seja efectuada.'),

        h2('RN06 — Conflito de Horário de Funcionários'),
        p('Um funcionário não pode ser alocado a dois eventos sobrepostos no mesmo dia. Dois eventos têm sobreposição quando: inicio_A < fim_B E inicio_B < fim_A. O sistema rejeita a alocação com mensagem indicando o horário em conflito.'),

        h2('RN07 — Local do Evento'),
        p('Se todos os recursos do carrinho tiverem endereço fixo (campo endereco preenchido), o local do evento é preenchido automaticamente com esse endereço e o utilizador não pode alterá-lo. Caso contrário, o campo é obrigatório e deve ser preenchido pelo organizador.'),

        h2('RN08 — Quantidade por Recurso Fixo'),
        p('Recursos com endereço fixo (locais como salões) têm seleção de quantidade desactivada — apenas 1 unidade pode ser reservada de cada vez, pois representam um espaço físico único.'),

        h2('RN09 — Ciclo de Vida da Reserva'),
        p('A reserva segue um ciclo de vida estrito com as seguintes transições permitidas:'),
        bullet('pendente → confirmada (fornecedor aceita, com alocação)'),
        bullet('pendente → rejeitada (fornecedor rejeita)'),
        bullet('confirmada → em_andamento (automático: quando hora_inicio chega)'),
        bullet('em_andamento → terminada (automático: quando hora_inicio + horas passa)'),
        bullet('terminada → devolvida (fornecedor confirma devolução)'),
        p('Transições inválidas são recusadas com erro 400.'),

        h2('RN10 — Notificações Automáticas'),
        p('O sistema gera notificações automáticas para os utilizadores afectados em cada mudança de estado relevante. Um job cron executa a cada minuto para processar transições automáticas e enviar as notificações correspondentes.'),

        h2('RN11 — Acesso ao Recibo'),
        p('O recibo de uma reserva é acessível apenas ao organizador que efectuou a reserva e ao fornecedor do recurso reservado. Qualquer outro utilizador recebe erro 403 (Sem permissão).'),
        spacer(100),
        pageBreak(),

        // ═══════════════════════ 5. DIAGRAMA DE CASOS DE USO ═══════════════
        h1('5. Diagrama de Casos de Uso'),
        linha(),
        p('O diagrama abaixo apresenta os quatro actores do sistema e os casos de uso associados a cada um, evidenciando as funcionalidades disponíveis para cada papel.'),
        spacer(200),
        centeredImage(svgCasosDeUso(), 620, 490),
        spacer(100),
        h2('5.1 Casos de Uso por Actor'),
        h3('Organizador de Eventos'),
        bullet('UC01 — Registar / Autenticar: criar conta e fazer login na plataforma.'),
        bullet('UC02 — Pesquisar Recursos: filtrar por nome, categoria e data.'),
        bullet('UC03 — Reservar Recursos: adicionar ao carrinho e submeter pedido.'),
        bullet('UC04 — Seleccionar Quantidade: escolher o número de unidades de cada recurso.'),
        bullet('UC05 — Ver Recibo: aceder ao documento com os detalhes completos do evento.'),
        bullet('UC06 — Ver Notificações: acompanhar actualizações sobre os seus pedidos.'),
        h3('Fornecedor de Recursos'),
        bullet('UC07 — Gerir Recursos: criar, editar e remover recursos disponíveis.'),
        bullet('UC08 — Aceitar / Rejeitar Pedido: decidir sobre cada pedido recebido.'),
        bullet('UC09 — Alocar Funcionário: atribuir equipa a um evento confirmado.'),
        bullet('UC10 — Gerir Funcionários: manter o registo da equipa disponível.'),
        bullet('UC11 — Avançar Estado da Reserva: marcar como terminada ou devolvida.'),
        h3('Administrador'),
        bullet('UC12 — Validar Fornecedores: aprovar contas de fornecedores pendentes.'),
        bullet('UC13 — Gerir Utilizadores: consultar e filtrar todos os utilizadores.'),
        bullet('UC14 — Ver Relatórios Globais: estatísticas de utilização da plataforma.'),
        h3('Gestor Municipal'),
        bullet('UC15 — Ver Estatísticas da Cidade: dashboard com KPIs de Xai-Xai.'),
        bullet('UC16 — Ver Relatório de Utilização: análise detalhada por recurso.'),
        spacer(100),
        pageBreak(),

        // ═══════════════════════ 6. MODELO ENTIDADE-RELACIONAMENTO ═════════
        h1('6. Modelo Entidade-Relacionamento (ER)'),
        linha(),
        p('O modelo de dados do SIGARE é composto por 8 entidades principais. O diagrama abaixo representa as entidades, os seus atributos e os relacionamentos entre elas.'),
        spacer(200),
        centeredImage(svgER(), 650, 545),
        spacer(100),
        h2('6.1 Descrição das Entidades'),
        spacer(100),
        tabela(
          ['Entidade', 'Descrição', 'Relacionamentos Principais'],
          [
            ['Utilizador', 'Representa qualquer pessoa registada no sistema. O tipo (ENUM) determina o papel.', 'Tem 0 ou 1 Fornecedor; tem N Reservas; tem N Notificações.'],
            ['Fornecedor', 'Entidade comercial que disponibiliza recursos. Ligada 1:1 a um Utilizador.', 'Tem N Recursos; tem N Funcionários.'],
            ['Categoria', 'Classificação dos recursos (ex: Som, Decoração, Palcos).', 'Tem N Recursos.'],
            ['Recurso', 'Activo que pode ser reservado (tenda, palco, cadeiras, etc.).', 'Pertence a 1 Fornecedor e 1 Categoria; tem N Reservas.'],
            ['Reserva', 'Pedido de utilização de um recurso numa data específica.', 'Feita por 1 Utilizador; para 1 Recurso; tem N Alocações; tem N Notificações.'],
            ['Funcionario', 'Membro da equipa de um fornecedor, alocado a eventos.', 'Pertence a 1 Fornecedor; participa em N Alocações.'],
            ['Alocacao', 'Registo de atribuição de um funcionário a uma reserva.', 'Liga 1 Funcionário a 1 Reserva (chave única composta).'],
            ['Notificacao', 'Mensagem gerada automaticamente para informar utilizadores de eventos do sistema.', 'Pertence a 1 Utilizador; referencia 1 Reserva (opcional).'],
          ],
          [1600, 3200, 4226]
        ),
        spacer(200),
        pageBreak(),

        // ═══════════════════════ 7. CICLO DE VIDA DA RESERVA ═══════════════
        h1('7. Ciclo de Vida de uma Reserva'),
        linha(),
        p('Uma reserva atravessa um conjunto de estados bem definidos desde a sua criação até ao encerramento. O diagrama abaixo ilustra as possíveis transições e os seus gatilhos.'),
        spacer(200),
        centeredImage(svgCicloVida(), 620, 210),
        spacer(100),
        h2('7.1 Tabela de Transições'),
        spacer(100),
        tabela(
          ['Estado Origem', 'Estado Destino', 'Gatilho', 'Responsável'],
          [
            ['pendente',     'confirmada',    'Fornecedor aceita pedido (com alocação)',           'Fornecedor (manual)'],
            ['pendente',     'rejeitada',     'Fornecedor rejeita pedido',                         'Fornecedor (manual)'],
            ['confirmada',   'em_andamento',  'hora_inicio atingida',                              'Sistema (cron automático)'],
            ['em_andamento', 'terminada',     'hora_inicio + horas atingida',                      'Sistema (cron automático)'],
            ['terminada',    'devolvida',     'Fornecedor confirma devolução dos recursos',         'Fornecedor (manual)'],
          ],
          [1800, 1800, 3200, 2226]
        ),
        spacer(200),
        h2('7.2 Scheduler Automático'),
        p('O SIGARE utiliza um job cron (node-cron) que executa a cada minuto no servidor para processar transições automáticas:'),
        bullet('Reservas com estado confirmada e hora_inicio <= agora: transitam para em_andamento.'),
        bullet('Reservas com estado em_andamento e (hora_inicio + horas) <= agora: transitam para terminada.'),
        p('Em cada transição, o sistema gera automaticamente uma notificação para o organizador informando do novo estado.'),
        spacer(100),
        pageBreak(),

        // ═══════════════════════ 8. ARQUITECTURA ════════════════════════════
        h1('8. Arquitectura do Sistema'),
        linha(),
        p('O SIGARE segue uma arquitectura em 3 camadas (Three-Tier Architecture), com separação clara entre apresentação, lógica de negócio e dados.'),
        spacer(200),
        centeredImage(svgArquitectura(), 600, 350),
        spacer(100),
        h2('8.1 Camada de Apresentação (Frontend)'),
        p('Desenvolvida com Next.js 16 utilizando o App Router com grupos de rotas para autenticação ((auth)) e dashboard ((dashboard)). A comunicação com o backend é feita através de uma instância Axios configurada com o token JWT no header Authorization.'),
        bullet('Rota / — Landing page pública com pesquisa e estatísticas.'),
        bullet('Rota /pesquisa — Motor de pesquisa e reserva com fluxo em 4 passos.'),
        bullet('Rota /painel/organizador — Dashboard do organizador.'),
        bullet('Rota /painel/fornecedor — Dashboard do fornecedor (recursos, pedidos, equipa).'),
        bullet('Rota /painel/admin — Dashboard do administrador.'),
        bullet('Rota /painel/gestor — Dashboard do gestor municipal.'),

        h2('8.2 Camada de Negócio (Backend)'),
        p('API REST desenvolvida com Express.js, organizada em controllers, routes e middleware. O token JWT é verificado pelo middleware authenticate em todas as rotas protegidas. O middleware requireRole valida se o utilizador tem o papel correcto para aceder a cada recurso.'),
        h3('Endpoints Principais'),
        spacer(100),
        tabela(
          ['Método', 'Endpoint', 'Acesso', 'Descrição'],
          [
            ['POST', '/api/auth/registar',         'Público',           'Criar conta'],
            ['POST', '/api/auth/login',             'Público',           'Autenticar e obter token'],
            ['GET',  '/api/recursos',               'Público',           'Listar recursos (com filtros e disponibilidade por data)'],
            ['POST', '/api/recursos',               'Fornecedor',        'Criar recurso'],
            ['POST', '/api/reservas',               'Organizador',       'Criar reserva'],
            ['GET',  '/api/reservas',               'Auth',              'Listar reservas do utilizador'],
            ['PATCH','/api/reservas/:id/decidir',   'Fornecedor',        'Aceitar ou rejeitar pedido'],
            ['PATCH','/api/reservas/:id/avancar',   'Fornecedor',        'Avançar estado da reserva'],
            ['GET',  '/api/reservas/:id/recibo',    'Auth (own)',        'Ver recibo completo'],
            ['POST', '/api/reservas/:id/alocacoes', 'Fornecedor',        'Alocar funcionário'],
            ['GET',  '/api/funcionarios',           'Fornecedor',        'Listar funcionários'],
            ['POST', '/api/funcionarios',           'Fornecedor',        'Criar funcionário'],
            ['GET',  '/api/notificacoes',           'Auth',              'Listar notificações'],
            ['PATCH','/api/notificacoes/:id/ler',   'Auth',              'Marcar notificação como lida'],
            ['GET',  '/api/relatorios/publico',     'Público',           'Estatísticas para landing page'],
            ['GET',  '/api/relatorios/gestor',      'Gestor/Admin',      'Dashboard completo do gestor'],
            ['PATCH','/api/fornecedores/:id/validar','Administrador',    'Validar fornecedor'],
          ],
          [800, 2700, 1500, 4026]
        ),
        spacer(100),

        h2('8.3 Camada de Dados'),
        p('A base de dados PostgreSQL é gerida através do Supabase (cloud) e acedida via Prisma ORM com adaptador PrismaPg (necessário para Prisma v7). As imagens dos recursos são armazenadas no Supabase Storage, num bucket público chamado "sigare".'),
        bullet('Prisma schema define todos os modelos, relações e tipos ENUM.'),
        bullet('Índice composto em Reserva(id_recurso, data_reserva) para optimizar queries de disponibilidade.'),
        bullet('Constraint única em Alocacao(id_funcionario, id_reserva) para evitar duplicados.'),
        spacer(100),
        pageBreak(),

        // ═══════════════════════ 9. SEGURANÇA ═══════════════════════════════
        h1('9. Segurança'),
        linha(),
        tabela(
          ['Mecanismo', 'Implementação', 'Âmbito'],
          [
            ['Autenticação JWT',          'Token assinado com segredo, validade 7 dias, armazenado em localStorage.', 'Todas as rotas protegidas'],
            ['Controlo de Acesso (RBAC)', 'Middleware requireRole valida o tipo de utilizador em cada endpoint.', 'Backend — cada rota'],
            ['Hashing de Senhas',         'bcryptjs com factor 10 (salt rounds). Senha nunca armazenada em claro.', 'Registo e autenticação'],
            ['Validação de Input',        'Zod valida todos os dados recebidos pela API antes de processar.', 'Todos os endpoints POST/PATCH'],
            ['CORS',                      'Configurado para aceitar apenas origens autorizadas.', 'Servidor Express'],
            ['Helmet',                    'Cabeçalhos HTTP de segurança (XSS, clickjacking, etc.) via Helmet.js.', 'Servidor Express'],
            ['Ownership Checks',          'Controladores verificam que o utilizador é dono do recurso antes de editar/apagar.', 'Recursos, Reservas, Recibos'],
          ],
          [2000, 4000, 3026]
        ),
        spacer(200),
        pageBreak(),

        // ═══════════════════════ 10. CREDENCIAIS DE TESTE ═══════════════════
        h1('10. Credenciais de Teste'),
        linha(),
        p('As seguintes contas estão disponíveis para teste e demonstração do sistema:'),
        spacer(100),
        tabela(
          ['Papel', 'Email', 'Senha', 'Observação'],
          [
            ['Gestor Municipal', 'gestor@xaixai.gov.mz',     'GestorXaiXai2024', 'Câmara Municipal de Xai-Xai'],
            ['Fornecedor',       'silva@manhique.co.mz',     '(definida no registo)', '17 recursos pré-carregados com imagens'],
            ['Administrador',    '(criado manualmente)',     '(definida no registo)', 'Tipo definido directamente na BD'],
          ],
          [1600, 2400, 2200, 2826]
        ),
        spacer(200),
        pageBreak(),

        // ═══════════════════════ 11. REFERÊNCIAS ════════════════════════════
        h1('11. Referências'),
        linha(),
        bullet('Next.js Documentation — https://nextjs.org/docs'),
        bullet('Prisma ORM Documentation — https://www.prisma.io/docs'),
        bullet('Supabase Documentation — https://supabase.com/docs'),
        bullet('Express.js Documentation — https://expressjs.com'),
        bullet('JWT (JSON Web Tokens) — https://jwt.io'),
        bullet('Tailwind CSS Documentation — https://tailwindcss.com/docs'),
        bullet('node-cron Documentation — https://www.npmjs.com/package/node-cron'),
        bullet('Zod Documentation — https://zod.dev'),
        spacer(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: OURO } },
          spacing: { before: 400, after: 120 },
          children: [new TextRun({ text: 'SIGARE — Sistema Integrado de Gestão e Alocação de Recursos para Eventos', size: 18, color: '64748b', font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Câmara Municipal de Xai-Xai — Gaza, Moçambique — 2025', size: 18, color: '94a3b8', font: 'Arial' })],
        }),
      ],
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: OURO } },
              spacing: { after: 0 },
              children: [
                new TextRun({ text: 'SIGARE', bold: true, size: 18, color: AZUL, font: 'Arial' }),
                new TextRun({ text: ' — Documentação Técnica e Funcional', size: 18, color: '64748b', font: 'Arial' }),
              ],
              tabStops: [{ type: 'right', position: 9026 }],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDA } },
              spacing: { before: 80 },
              children: [
                new TextRun({ text: 'Xai-Xai, Gaza — Moçambique', size: 16, color: '94a3b8', font: 'Arial' }),
                new TextRun({ text: '\t', size: 16 }),
                new TextRun({ text: 'Página ', size: 16, color: '94a3b8', font: 'Arial' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '475569', font: 'Arial' }),
              ],
              tabStops: [{ type: 'right', position: 9026 }],
            }),
          ],
        }),
      },
    },
  ],
});

const outPath = 'C:/Users/dell/Documents/Monografia/SIGARE/SIGARE_Documentacao.docx';
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log('Documento gerado: ' + outPath);
}).catch(console.error);

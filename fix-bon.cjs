const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const F = 'src/pages/BulkSalesPage.tsx';
let t = fs.readFileSync(F, 'utf8');
if (t.includes('daySearch')) stop('deja applique');
if (!t.includes('<Search ')) stop('icone Search absente de la page');
if (!/import \{[^}]*\bformat\b[^}]*\} from 'date-fns'/.test(t)) stop('format de date-fns non importe');
fs.writeFileSync('backup14-BulkSalesPage.tsx.txt', t);
function rep(de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(de, () => vers);
}

rep("const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});",
  "const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});\n  const [daySearch, setDaySearch] = useState('');", 'etat');

rep("{groupedSales.map(group => {",
  "{groupedSales.filter(g => { const q = daySearch.trim().toLowerCase(); if (!q) return true; return (format(new Date(g.sale_date), 'dd/MM/yyyy') + ' ' + g.sale_date + ' ' + g.productSummary).toLowerCase().includes(q); }).map(group => {", 'liste filtree');

const re = /(\{activeTab === 'ventes' && \(\s*<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">)/;
if (!re.test(t)) stop('debut onglet ventes introuvable');
const barre = [
"",
"            <div className='px-4 py-3 border-b border-gray-100'>",
"              <div className='flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2'>",
"                <Search size={16} className='text-gray-400' />",
"                <input type='text' value={daySearch} onChange={e => setDaySearch(e.target.value)} placeholder='Rechercher une journee de vente (ex : 12/11 ou 12/11/2026)...' className='flex-1 bg-transparent outline-none text-sm' />",
"                {daySearch && (<button type='button' onClick={() => setDaySearch('')} className='text-xs text-gray-400 hover:text-gray-600'>Effacer</button>)}",
"              </div>",
"            </div>"
].join('\n');
t = t.replace(re, (x) => x + barre);
fs.writeFileSync(F, t);

const R = fs.readFileSync('src/pages/ReportsPage.tsx', 'utf8').split('\n');
let out = '=== ReportsPage lignes 100-172 ===\n';
for (let k = 99; k < Math.min(R.length, 172); k++) out += (k + 1) + ': ' + R[k] + '\n';
fs.writeFileSync('lecture-temp.txt', out);
console.log('OK : recherche par journee ajoutee a la fenetre client ; lecture des rapports ecrite (' + out.length + ' caracteres)');
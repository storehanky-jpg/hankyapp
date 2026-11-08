const fs = require('fs');
const P = 'src/pages/BulkSalesPage.tsx';
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };

if (!fs.existsSync('src/lib/deliveryNote.ts')) stop("le fichier src/lib/deliveryNote.ts n'existe pas encore");
let t = fs.readFileSync(P, 'utf8');
if (t.includes('printBonLivraison')) stop('modification deja appliquee');
fs.writeFileSync('BulkSalesPage.backup.txt', t);

// 1. import du modele
const imp = "import * as api from '../services/api';";
if (!t.includes(imp)) stop('import api introuvable');
t = t.replace(imp, () => imp + "\nimport { buildBonLivraisonHTML, buildBonLines, nextBonNumber, readBonNumber } from '../lib/deliveryNote';");

// 2. fonction printBonLivraison
const anchor = "  const printDocument = (docType: 'bon' | 'facture') => {";
if (!t.includes(anchor)) stop('printDocument introuvable');
const fn = `  const printBonLivraison = async (group: GroupedSale) => {
    if (!selectedCustomer) return;
    const lines = group.items.filter(i => i.type !== 'magasin');
    if (lines.length === 0) {
      alert("Aucun produit à livrer ce jour-là.");
      return;
    }
    let num: number | null = null;
    for (const it of lines) {
      const stored = it.type === 'vrac'
        ? (it.raw as BulkSale).order_number
        : (it.raw as Sale).bon_livraison_number;
      const n = readBonNumber(stored);
      if (n !== null) { num = n; break; }
    }
    if (num === null) {
      num = nextBonNumber([
        ...bulkSales.map(s => s.order_number),
        ...sales.map(s => s.bon_livraison_number),
      ]);
      const numStr = String(num).padStart(3, '0');
      try {
        for (const it of lines) {
          if (it.type === 'vrac') {
            await api.bulkSalesService.update(it.id, { order_number: numStr });
          } else {
            await api.salesService.update(it.id, { bon_livraison_number: numStr });
          }
        }
        const ids = new Set(lines.map(i => i.id));
        setBulkSales(bulkSales.map(x => (ids.has(x.id) ? { ...x, order_number: numStr } : x)));
        setSales(sales.map(x => (ids.has(x.id) ? { ...x, bon_livraison_number: numStr } : x)));
      } catch (err) {
        console.error(err);
        alert("Impossible d'enregistrer le numéro du bon : " + (err instanceof Error ? err.message : 'erreur'));
        return;
      }
    }
    const html = buildBonLivraisonHTML({
      number: num,
      dateISO: group.sale_date,
      clientName: selectedCustomer.legal_name || selectedCustomer.name,
      clientCity: selectedCustomer.address || selectedCustomer.fiscal_address || '',
      lines: buildBonLines(lines.map(i => ({ type: i.type, quantity: i.quantity, unit_price: i.unit_price }))),
    });
    printHTML(html);
  };

`;
t = t.replace(anchor, () => fn + anchor);

// 3. petit bouton Bon sur chaque ligne de vente (avant la corbeille)
const key3 = 'handleDeleteGroup(group);';
const i3 = t.indexOf(key3);
if (i3 < 0) stop('bouton supprimer introuvable');
const b3 = t.lastIndexOf('<button', i3);
if (b3 < 0) stop('debut du bouton introuvable');
const lineStart = t.lastIndexOf('\n', b3) + 1;
const indent = t.slice(lineStart, b3);
const btn = [
  '<button',
  '  type="button"',
  '  onClick={(e) => {',
  '    e.stopPropagation();',
  '    printBonLivraison(group);',
  '  }}',
  '  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"',
  '  title="Bon de livraison"',
  '>',
  '  <FileText size={15} />',
  '</button>',
].map(l => indent + l).join('\n') + '\n';
t = t.slice(0, lineStart) + btn + t.slice(lineStart);

// 4. bouton Bon du haut : imprime la commande la plus recente
const old4 = "onClick={() => printDocument('bon')}";
if (!t.includes(old4)) stop('bouton Bon du haut introuvable');
t = t.replace(old4, () => "onClick={() => { if (groupedSales[0]) printBonLivraison(groupedSales[0]); else printDocument('bon'); }}");

fs.writeFileSync(P, t);
console.log('OK : 4 modifications faites. Sauvegarde : BulkSalesPage.backup.txt');
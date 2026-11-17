const fs = require('fs');
const path = require('path');
console.log('DEBUT');
let out = [];
function walk(d, depth) {
  if (depth > 4) return;
  let items = [];
  try { items = fs.readdirSync(d); } catch (e) { return; }
  items.forEach(function (n) {
    if (n === 'node_modules' || n === '.git' || n === 'dist') return;
    const p = path.join(d, n);
    let st = null;
    try { st = fs.statSync(p); } catch (e) { return; }
    if (st.isDirectory()) { out.push('[DOSSIER] ' + p); walk(p, depth + 1); }
    else if (/supabase|syncEngine|offlineDb|storage|formatters|deliveryNote/i.test(n)) out.push('[FICHIER] ' + p);
  });
}
walk('src', 0);
out.push('--- env : ' + (fs.existsSync('.env') ? '.env present' : '.env absent'));
fs.writeFileSync('lecture-temp.txt', out.join('\n'));
console.log(out.join('\n'));
console.log('FIN');
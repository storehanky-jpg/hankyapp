const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const FP = 'src/pages/RecipePage.tsx';
if (!fs.existsSync(FP)) stop('RecipePage.tsx introuvable');
let t = fs.readFileSync(FP, 'utf8');
if (t.indexOf('effYieldG') >= 0) stop('deja applique');
function count(s) { return t.split(s).length - 1; }
function swap(a, b, nom) { const n = count(a); if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1'); const i = t.indexOf(a); t = t.slice(0, i) + b + t.slice(i + a.length); }
const orig = t;
swap('const yieldKg = (chocConfig?.yield_g || 1000) / 1000;',
 'const baseIngG = chocIngredients.reduce((s, i) => s + (i.quantity_g || 0), 0);\n  const effYieldG = chocConfig && chocConfig.yield_g && chocConfig.yield_g !== 1000 ? chocConfig.yield_g : (baseIngG > 0 ? baseIngG : 1000);\n  const yieldKg = effYieldG / 1000;', 'rendement');
swap('const scaledYieldG = (chocConfig?.yield_g || 1000) * chocMultiplier;', 'const scaledYieldG = effYieldG * chocMultiplier;', 'rendement multiplie');
swap('{(chocConfig?.yield_g || 1000).toLocaleString()} g</span>', '{Math.round(effYieldG).toLocaleString()} g</span>', 'affichage');
fs.writeFileSync('backup33-RecipePage.tsx.txt', orig);
fs.writeFileSync(FP, t);
console.log('OK : rendement du chocolat calcule automatiquement');
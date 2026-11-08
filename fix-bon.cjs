const fs = require('fs');
console.log('DEBUT');
const P = 'src/pages/RecipePage.tsx';
let t = fs.readFileSync(P, 'utf8');
if (t.includes('ganacheMultiplier')) { console.log('ARRET : deja applique'); process.exit(0); }
fs.writeFileSync('RecipePage.backup.txt', t);
const liste = [
  ["const [multiplier, setMultiplier] = useState(1);", "const [multiplier, setMultiplier] = useState(1);\n  const [ganacheMultiplier, setGanacheMultiplier] = useState(1);"],
  ["const multipliedLines = useMemo(() => activeLines.map(line => {", "const multipliedLines = useMemo(() => activeLines.map(line => {\n    const mult = activeTab === 'coque' ? multiplier : ganacheMultiplier;"],
  ["multipliedQuantity: line.quantity * multiplier, effectiveCost, totalCost: (line.quantity * multiplier / 1000) * effectiveCost", "multipliedQuantity: line.quantity * mult, effectiveCost, totalCost: (line.quantity * mult / 1000) * effectiveCost"],
  ["}), [activeLines, multiplier]);", "}), [activeLines, multiplier, ganacheMultiplier, activeTab]);"],
  ["Multiplicateur de Production</h2>", "Multiplicateur Coques</h2>"]
];
for (const [a, b] of liste) {
  if (!t.includes(a)) { console.log('ARRET : introuvable : ' + a.slice(0, 60)); process.exit(1); }
  t = t.replace(a, () => b);
}
const re = /return s \+ \(l\.quantity \* multiplier \/ 1000\) \* cost;(\s*)\}, 0\), \[activeGanacheLines, multiplier\]\);/;
if (!re.test(t)) { console.log('ARRET : ganacheTotalCost introuvable'); process.exit(1); }
t = t.replace(re, (m, sp) => 'return s + (l.quantity * ganacheMultiplier / 1000) * cost;' + sp + '}, 0), [activeGanacheLines, ganacheMultiplier]);');
t = t.split('multiplicateur x{multiplier}').join("multiplicateur x{activeTab === 'coque' ? multiplier : ganacheMultiplier}");
t = t.split('Quantité x{multiplier}</th>').join("Quantité x{activeTab === 'coque' ? multiplier : ganacheMultiplier}</th>");
fs.writeFileSync(P, t);
console.log('OK A1 termine');
const fs = require('fs');
const l = fs.readFileSync('src/pages/RecipePage.tsx', 'utf8').split('\n');
const cut = (a, b) => '--- lignes ' + a + '-' + b + ' ---\n' + l.slice(a - 1, b).join('\n') + '\n';
fs.writeFileSync('lecture-temp.txt', cut(1, 135) + cut(262, 300) + cut(480, 625) + cut(650, 674));
console.log('OK', fs.statSync('lecture-temp.txt').size, 'octets');
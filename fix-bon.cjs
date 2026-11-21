const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const D = (s) => Buffer.from(s, 'base64').toString('utf8');
const STATES = D([
'CiAgY29uc3QgW3Nob3dFZGl0QmFzZSwgc2V0U2hvd0VkaXRCYXNlXSA9IHVzZVN0YXRlKGZhbHNlKTsKICBjb25zdCBbYmFzZURy',
'YWZ0LCBzZXRCYXNlRHJhZnRdID0gdXNlU3RhdGU8c3RyaW5nW10+KFtdKTsKICBjb25zdCBbYmFzZUJ1c3ksIHNldEJhc2VCdXN5',
'XSA9IHVzZVN0YXRlKGZhbHNlKTsK'
].join(''));
const FUNCS = D([
'ICBjb25zdCBvcGVuRWRpdEJhc2UgPSAoKSA9PiB7CiAgICBzZXRCYXNlRHJhZnQoYWN0aXZlTGluZXMubWFwKGwgPT4gU3RyaW5n',
'KGwucXVhbnRpdHkpKSk7CiAgICBzZXRTaG93RWRpdEJhc2UodHJ1ZSk7CiAgfTsKCiAgY29uc3Qgc2F2ZUVkaXRCYXNlID0gYXN5',
'bmMgKCkgPT4gewogICAgY29uc3QgdmFscyA9IGJhc2VEcmFmdC5tYXAodiA9PiBwYXJzZUZsb2F0KFN0cmluZyh2KS5yZXBsYWNl',
'KCcsJywgJy4nKSkpOwogICAgaWYgKHZhbHMubGVuZ3RoICE9PSBhY3RpdmVMaW5lcy5sZW5ndGggfHwgdmFscy5zb21lKHYgPT4g',
'IWlzRmluaXRlKHYpIHx8IHYgPCAwKSkgewogICAgICBhbGVydCgiQ2hhcXVlIHF1YW50aXTDqSBkb2l0IMOqdHJlIHVuIG5vbWJy',
'ZSBwb3NpdGlmIChtZXRzIDAgc2kgbCdpbmdyw6lkaWVudCBuJ2VzdCBwYXMgdXRpbGlzw6kpLiIpOwogICAgICByZXR1cm47CiAg',
'ICB9CiAgICBzZXRCYXNlQnVzeSh0cnVlKTsKICAgIHRyeSB7CiAgICAgIGlmIChpc0N1c3RvbSkgewogICAgICAgIGxldCBpdGVt',
'cyA9IFsuLi5yZWNpcGVJdGVtc107CiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhY3RpdmVMaW5lcy5sZW5ndGg7IGkrKykg',
'ewogICAgICAgICAgY29uc3QgbCA9IGFjdGl2ZUxpbmVzW2ldOwogICAgICAgICAgY29uc3QgaXRlbSA9IGFjdGl2ZUN1c3RvbUl0',
'ZW1zLmZpbmQoaXQgPT4gaXQubWF0ZXJpYWxfaWQgPT09IGwubWF0ZXJpYWxJZCk7CiAgICAgICAgICBpZiAoIWl0ZW0pIGNvbnRp',
'bnVlOwogICAgICAgICAgaWYgKE1hdGguYWJzKGl0ZW0ucXVhbnRpdHlfcGVyX2JhdGNoIC0gdmFsc1tpXSkgPCAxZS05KSBjb250',
'aW51ZTsKICAgICAgICAgIGNvbnN0IHVwZCA9IGF3YWl0IGFwaS5yZWNpcGVJdGVtc1NlcnZpY2UudXBkYXRlKGl0ZW0uaWQsIHsg',
'cXVhbnRpdHlfcGVyX2JhdGNoOiB2YWxzW2ldIH0pOwogICAgICAgICAgaXRlbXMgPSBpdGVtcy5tYXAoeCA9PiAoeC5pZCA9PT0g',
'aXRlbS5pZCA/IHsgLi4ueCwgLi4udXBkIH0gOiB4KSk7CiAgICAgICAgfQogICAgICAgIHNldFJlY2lwZUl0ZW1zKGl0ZW1zKTsK',
'ICAgICAgfSBlbHNlIHsKICAgICAgICBsZXQgbWF0cyA9IFsuLi5yYXdNYXRlcmlhbHNdOwogICAgICAgIGNvbnN0IGNyZWF0ZWQ6',
'IFJlY2lwZUl0ZW1bXSA9IFtdOwogICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWN0aXZlTGluZXMubGVuZ3RoOyBpKyspIHsK',
'ICAgICAgICAgIGNvbnN0IGwgPSBhY3RpdmVMaW5lc1tpXTsKICAgICAgICAgIGxldCBtaWQgPSBsLm1hdGVyaWFsSWQ7CiAgICAg',
'ICAgICBpZiAoIW1pZCkgewogICAgICAgICAgICBjb25zdCBubSA9IGF3YWl0IGFwaS5yYXdNYXRlcmlhbHNTZXJ2aWNlLmNyZWF0',
'ZSh7IG5hbWU6IGwubmFtZSwgdW5pdDogJ2tnJywgdW5pdF9jb3N0OiBsLmRlZmF1bHRDb3N0ID8/IDAsIHN1cHBsaWVyOiAnJyB9',
'KTsKICAgICAgICAgICAgbWF0cyA9IFsuLi5tYXRzLCBubV07CiAgICAgICAgICAgIG1pZCA9IG5tLmlkOwogICAgICAgICAgfQog',
'ICAgICAgICAgY29uc3QgaXQgPSBhd2FpdCBhcGkucmVjaXBlSXRlbXNTZXJ2aWNlLmNyZWF0ZSh7CiAgICAgICAgICAgIHJlY2lw',
'ZV9pZDogcmVjaXBlQ29uZmlnPy5pZCB8fCAnZGVmYXVsdCcsIG1hdGVyaWFsX2lkOiBtaWQsCiAgICAgICAgICAgIHF1YW50aXR5',
'X3Blcl9iYXRjaDogdmFsc1tpXSwgcmVjaXBlX3R5cGU6IGFjdGl2ZVRhYiwKICAgICAgICAgIH0gYXMgT21pdDxSZWNpcGVJdGVt',
'LCAnaWQnIHwgJ2NyZWF0ZWRfYXQnPik7CiAgICAgICAgICBjcmVhdGVkLnB1c2goaXQpOwogICAgICAgIH0KICAgICAgICBzZXRS',
'YXdNYXRlcmlhbHMobWF0cyk7CiAgICAgICAgc2V0UmVjaXBlSXRlbXMoWy4uLnJlY2lwZUl0ZW1zLCAuLi5jcmVhdGVkXSk7CiAg',
'ICAgIH0KICAgICAgc2V0U2hvd0VkaXRCYXNlKGZhbHNlKTsKICAgIH0gY2F0Y2ggKGVycikgewogICAgICBjb25zb2xlLmVycm9y',
'KGVycik7CiAgICAgIGNvbnN0IG1zZyA9IGVyciAmJiB0eXBlb2YgZXJyID09PSAnb2JqZWN0JyAmJiAnbWVzc2FnZScgaW4gZXJy',
'ID8gU3RyaW5nKChlcnIgYXMgeyBtZXNzYWdlOiB1bmtub3duIH0pLm1lc3NhZ2UpIDogJ2VycmV1cic7CiAgICAgIGFsZXJ0KCJJ',
'bXBvc3NpYmxlIGQnZW5yZWdpc3RyZXIgbGEgcmVjZXR0ZSA6ICIgKyBtc2cpOwogICAgfQogICAgc2V0QmFzZUJ1c3koZmFsc2Up',
'OwogIH07Cgo='
].join(''));
const BTN = D([
'PGJ1dHRvbiBvbkNsaWNrPXtvcGVuRWRpdEJhc2V9IGNsYXNzTmFtZT0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcHgtNCBweS0y',
'IGJnLXdoaXRlIGJvcmRlciBib3JkZXItZ3JheS0zMDAgdGV4dC1ncmF5LTgwMCByb3VuZGVkLXhsIGhvdmVyOmJnLWdyYXktNTAg',
'dHJhbnNpdGlvbi1jb2xvcnMiPgogICAgICAgICAgICAgIDxFZGl0MiBzaXplPXsxOH0gLz4gTW9kaWZpZXIgbGEgcmVjZXR0ZSBk',
'ZSBiYXNlIHthY3RpdmVUYWIgPT09ICdjb3F1ZScgPyAnZGVzIGNvcXVlcycgOiAnZGUgbGEgZ2FuYWNoZSd9CiAgICAgICAgICAg',
'IDwvYnV0dG9uPgogICAgICAgICAgICAK'
].join(''));
const MODAL = D([
'ICAgICAgey8qIE1vZGlmaWVyIGxhIHJlY2V0dGUgZGUgYmFzZSAqL30KICAgICAge3Nob3dFZGl0QmFzZSAmJiAoCiAgICAgICAg',
'PGRpdiBjbGFzc05hbWU9ImZpeGVkIGluc2V0LTAgYmctYmxhY2svNTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIg',
'ei01MCBwLTQiPgogICAgICAgICAgPGRpdiBjbGFzc05hbWU9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHctZnVsbCBtYXgtdy1tZCBz',
'aGFkb3cteGwgbWF4LWgtWzkwdmhdIG92ZXJmbG93LXktYXV0byI+CiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJmbGV4IGl0',
'ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcC00IGJvcmRlci1iIHN0aWNreSB0b3AtMCBiZy13aGl0ZSB6LTEwIj4KICAgICAg',
'ICAgICAgICA8aDIgY2xhc3NOYW1lPSJ0ZXh0LWxnIGZvbnQtc2VtaWJvbGQiPlJlY2V0dGUgZGUgYmFzZSAtIHthY3RpdmVUYWIg',
'PT09ICdjb3F1ZScgPyAnQ29xdWVzJyA6ICdHYW5hY2hlJ308L2gyPgogICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkg',
'PT4gc2V0U2hvd0VkaXRCYXNlKGZhbHNlKX0gY2xhc3NOYW1lPSJwLTEgaG92ZXI6YmctZ3JheS0xMDAgcm91bmRlZC1sZyI+PFgg',
'c2l6ZT17MjB9IC8+PC9idXR0b24+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0icC00IHNw',
'YWNlLXktMyI+CiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LXNtIHRleHQtZ3JheS01MDAiPlF1YW50aXTDqSBkZSBj',
'aGFxdWUgaW5ncsOpZGllbnQgcG91ciB1bmUgcmVjZXR0ZSBkZSBiYXNlIChtdWx0aXBsaWNhdGV1ciDDlzEpLCBlbiBncmFtbWVz',
'LjwvcD4KICAgICAgICAgICAgICB7YWN0aXZlTGluZXMubWFwKChsLCBpKSA9PiAoCiAgICAgICAgICAgICAgICA8ZGl2IGtleT17',
'aX0gY2xhc3NOYW1lPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMiPgogICAgICAgICAgICAgICAgICA8',
'c3BhbiBjbGFzc05hbWU9InRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTgwMCI+e2wubmFtZX08L3NwYW4+CiAgICAgICAg',
'ICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSI+CiAgICAgICAgICAgICAgICAgICAgPGlu',
'cHV0IHR5cGU9Im51bWJlciIgc3RlcD0iYW55IiBtaW49IjAiIHZhbHVlPXtiYXNlRHJhZnRbaV0gPz8gJyd9IG9uQ2hhbmdlPXtl',
'ID0+IHNldEJhc2VEcmFmdChiYXNlRHJhZnQubWFwKCh2LCBqKSA9PiAoaiA9PT0gaSA/IGUudGFyZ2V0LnZhbHVlIDogdikpKX0g',
'Y2xhc3NOYW1lPSJ3LTI4IHB4LTMgcHktMiBib3JkZXIgcm91bmRlZC1sZyB0ZXh0LXJpZ2h0IiAvPgogICAgICAgICAgICAgICAg',
'ICAgIDxzcGFuIGNsYXNzTmFtZT0idGV4dC1zbSB0ZXh0LWdyYXktNTAwIj5nPC9zcGFuPgogICAgICAgICAgICAgICAgICA8L2Rp',
'dj4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICkpfQogICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT0idGV4',
'dC1zbSBmb250LXNlbWlib2xkIHRleHQtZ3JheS03MDAgcHQtMSI+UG9pZHMgZGUgYmFzZSA6IHtiYXNlRHJhZnQucmVkdWNlKChz',
'LCB2KSA9PiBzICsgKHBhcnNlRmxvYXQoU3RyaW5nKHYpLnJlcGxhY2UoJywnLCAnLicpKSB8fCAwKSwgMCkudG9Mb2NhbGVTdHJp',
'bmcoKX0gZzwvcD4KICAgICAgICAgICAgICB7IWlzQ3VzdG9tICYmIDxwIGNsYXNzTmFtZT0idGV4dC14cyBiZy1hbWJlci01MCB0',
'ZXh0LWFtYmVyLTgwMCByb3VuZGVkLWxnIHAtMyI+Q2V0dGUgcmVjZXR0ZSB1dGlsaXNlIGxlcyB2YWxldXJzIHBhciBkw6lmYXV0',
'LiBFbiBlbnJlZ2lzdHJhbnQsIGVsbGUgZGV2aWVudCB2b3RyZSByZWNldHRlIHBlcnNvbm5hbGlzw6llIChsZXMgaW5ncsOpZGll',
'bnRzIGFic2VudHMgZGUgdm9zIG1hdGnDqHJlcyBwcmVtacOocmVzIHkgc29udCBham91dMOpcykuPC9wPn0KICAgICAgICAgICAg',
'ICA8ZGl2IGNsYXNzTmFtZT0iZmxleCBqdXN0aWZ5LWVuZCBnYXAtMiBwdC0yIj4KICAgICAgICAgICAgICAgIDxidXR0b24gdHlw',
'ZT0iYnV0dG9uIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93RWRpdEJhc2UoZmFsc2UpfSBjbGFzc05hbWU9InB4LTQgcHktMiB0ZXh0',
'LWdyYXktNzAwIGhvdmVyOmJnLWdyYXktMTAwIHJvdW5kZWQtbGciPkFubnVsZXI8L2J1dHRvbj4KICAgICAgICAgICAgICAgIDxi',
'dXR0b24gdHlwZT0iYnV0dG9uIiBvbkNsaWNrPXtzYXZlRWRpdEJhc2V9IGRpc2FibGVkPXtiYXNlQnVzeX0gY2xhc3NOYW1lPSJw',
'eC01IHB5LTIgYmctYW1iZXItNTAwIHRleHQtd2hpdGUgcm91bmRlZC1sZyBob3ZlcjpiZy1hbWJlci02MDAgZGlzYWJsZWQ6b3Bh',
'Y2l0eS01MCI+e2Jhc2VCdXN5ID8gJ0VucmVnaXN0cmVtZW50Li4uJyA6ICdFbnJlZ2lzdHJlcid9PC9idXR0b24+CiAgICAgICAg',
'ICAgICAgPC9kaXY+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgICl9Cgo='
].join(''));
const FP = 'src/pages/RecipePage.tsx';
if (!fs.existsSync(FP)) stop('RecipePage.tsx introuvable');
let t = fs.readFileSync(FP, 'utf8');
if (t.indexOf('saveEditBase') >= 0) stop('deja applique');
if (t.indexOf('sendToProduction') < 0) stop('la partie Recettes (multiplicateurs) n est pas installee');
function count(s) { return t.split(s).length - 1; }
function need(s, nom) { const n = count(s); if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1'); }
function swap(a, b, nom) { need(a, nom); const i = t.indexOf(a); t = t.slice(0, i) + b + t.slice(i + a.length); }

swap('const [prodBusy, setProdBusy] = useState(false);', 'const [prodBusy, setProdBusy] = useState(false);' + STATES.trimEnd(), 'etats');
swap('  const saveMult = () => {', FUNCS + '  const saveMult = () => {', 'fonctions');

const pb = '<button onClick={() => setShowAddIngredient(true)}';
need(pb, 'bouton personnaliser');
const pi = t.indexOf(pb);
const wrap = '<div className="flex justify-end">';
const wi = t.lastIndexOf(wrap, pi);
if (wi < 0 || pi - wi > 120) stop('bloc du bouton personnaliser inattendu');
t = t.slice(0, wi) + '<div className="flex justify-end gap-3">' + t.slice(wi + wrap.length);
const pi2 = t.indexOf(pb);
t = t.slice(0, pi2) + BTN.trimEnd() + '\n            ' + t.slice(pi2);

need('{/* Price modal */}', 'fenetre prix');
const mi = t.indexOf('{/* Price modal */}');
const ml = t.lastIndexOf('\n', mi) + 1;
t = t.slice(0, ml) + MODAL + t.slice(ml);

fs.writeFileSync('backup29-RecipePage.tsx.txt', fs.readFileSync(FP, 'utf8'));
fs.writeFileSync(FP, t);
console.log('OK : bouton Modifier la recette de base ajoute');
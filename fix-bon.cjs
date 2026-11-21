const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const D = (s) => Buffer.from(s, 'base64').toString('utf8');
const STATES = D([
'CiAgY29uc3QgW2Rhc2hGcm9tLCBzZXREYXNoRnJvbV0gPSB1c2VTdGF0ZShmb3JtYXQoc3RhcnRPZk1vbnRoKG5ldyBEYXRlKCkp',
'LCAneXl5eS1NTS1kZCcpKTsKICBjb25zdCBbZGFzaFRvLCBzZXREYXNoVG9dID0gdXNlU3RhdGUoZm9ybWF0KGVuZE9mTW9udGgo',
'bmV3IERhdGUoKSksICd5eXl5LU1NLWRkJykpOwo='
].join(''));
const RANGE = D([
'CiAgLy8gUGVyaW9kZSBjaG9pc2llIChhZ2VuZGEgRHUgLi4uIGF1KQogIGNvbnN0IHJhbmdlRnJvbUQgPSBuZXcgRGF0ZShkYXNo',
'RnJvbSArICdUMDA6MDA6MDAnKTsKICBjb25zdCByYW5nZVRvRCA9IG5ldyBEYXRlKGRhc2hUbyArICdUMDA6MDA6MDAnKTsKICBj',
'b25zdCByYW5nZVZhbGlkID0gIWlzTmFOKHJhbmdlRnJvbUQuZ2V0VGltZSgpKSAmJiAhaXNOYU4ocmFuZ2VUb0QuZ2V0VGltZSgp',
'KSAmJiByYW5nZUZyb21EIDw9IHJhbmdlVG9EOwogIGNvbnN0IGlzTW9udGhSYW5nZSA9IGRhc2hGcm9tID09PSBmb3JtYXQoc3Rh',
'cnRPZk1vbnRoKHRvZGF5KSwgJ3l5eXktTU0tZGQnKSAmJiBkYXNoVG8gPT09IGZvcm1hdChlbmRPZk1vbnRoKHRvZGF5KSwgJ3l5',
'eXktTU0tZGQnKTsKICBjb25zdCBkYXRlSW5SYW5nZSA9IChkOiBEYXRlKSA9PiB7CiAgICBpZiAoIXJhbmdlVmFsaWQgfHwgaXNO',
'YU4oZC5nZXRUaW1lKCkpKSByZXR1cm4gZmFsc2U7CiAgICBjb25zdCBzID0gZm9ybWF0KGQsICd5eXl5LU1NLWRkJyk7CiAgICBy',
'ZXR1cm4gcyA+PSBkYXNoRnJvbSAmJiBzIDw9IGRhc2hUbzsKICB9OwogIGxldCBkYXNoRmFjdG9yID0gMDsKICBpZiAocmFuZ2VW',
'YWxpZCkgewogICAgY29uc3QgY3VyID0gbmV3IERhdGUocmFuZ2VGcm9tRC5nZXRGdWxsWWVhcigpLCByYW5nZUZyb21ELmdldE1v',
'bnRoKCksIDEpOwogICAgd2hpbGUgKGN1ciA8PSByYW5nZVRvRCkgewogICAgICBjb25zdCBtcyA9IG5ldyBEYXRlKGN1ci5nZXRG',
'dWxsWWVhcigpLCBjdXIuZ2V0TW9udGgoKSwgMSk7CiAgICAgIGNvbnN0IG1lID0gbmV3IERhdGUoY3VyLmdldEZ1bGxZZWFyKCks',
'IGN1ci5nZXRNb250aCgpICsgMSwgMCk7CiAgICAgIGNvbnN0IGEgPSByYW5nZUZyb21EID4gbXMgPyByYW5nZUZyb21EIDogbXM7',
'CiAgICAgIGNvbnN0IGIgPSByYW5nZVRvRCA8IG1lID8gcmFuZ2VUb0QgOiBtZTsKICAgICAgZGFzaEZhY3RvciArPSAoTWF0aC5y',
'b3VuZCgoYi5nZXRUaW1lKCkgLSBhLmdldFRpbWUoKSkgLyA4NjQwMDAwMCkgKyAxKSAvIG1lLmdldERhdGUoKTsKICAgICAgY3Vy',
'LnNldE1vbnRoKGN1ci5nZXRNb250aCgpICsgMSk7CiAgICB9CiAgfQogIGNvbnN0IHJhbmdlRGF5cyA9IHJhbmdlVmFsaWQgPyBN',
'YXRoLnJvdW5kKChyYW5nZVRvRC5nZXRUaW1lKCkgLSByYW5nZUZyb21ELmdldFRpbWUoKSkgLyA4NjQwMDAwMCkgKyAxIDogMTsK',
'ICB2b2lkIGN1cnJlbnRNb250aDsKICB2b2lkIGN1cnJlbnRZZWFyOwo='
].join(''));
const LABOR = D([
'ICBjb25zdCBsYWJvck1vbnRoID0gbGFib3JDb3N0cy5yZWR1Y2UoKHN1bSwgbCkgPT4gewogICAgaWYgKCFyYW5nZVZhbGlkKSBy',
'ZXR1cm4gc3VtOwogICAgY29uc3QgbXMgPSBuZXcgRGF0ZShsLnBlcmlvZF95ZWFyLCBsLnBlcmlvZF9tb250aCAtIDEsIDEpOwog',
'ICAgY29uc3QgbWUgPSBuZXcgRGF0ZShsLnBlcmlvZF95ZWFyLCBsLnBlcmlvZF9tb250aCwgMCk7CiAgICBjb25zdCBhID0gcmFu',
'Z2VGcm9tRCA+IG1zID8gcmFuZ2VGcm9tRCA6IG1zOwogICAgY29uc3QgYiA9IHJhbmdlVG9EIDwgbWUgPyByYW5nZVRvRCA6IG1l',
'OwogICAgaWYgKGIgPCBhKSByZXR1cm4gc3VtOwogICAgY29uc3QgZnJhYyA9IChNYXRoLnJvdW5kKChiLmdldFRpbWUoKSAtIGEu',
'Z2V0VGltZSgpKSAvIDg2NDAwMDAwKSArIDEpIC8gbWUuZ2V0RGF0ZSgpOwogICAgY29uc3QgYWR2ID0gdmFyaWFibGVFeHBlbnNl',
'cy5maWx0ZXIoZSA9PiBlLm5vdGVzID09PSAnbGFib3I6JyArIGwuaWQpLnJlZHVjZSgoczIsIGUpID0+IHMyICsgZS5hbW91bnQs',
'IDApOwogICAgcmV0dXJuIHN1bSArIChsLnRvdGFsX2Nvc3QgLSBhZHYpICogZnJhYzsKICB9LCAwKTsK'
].join(''));
const UI = D([
'ICAgICAgey8qIFBlcmlvZGUgKi99CiAgICAgIDxkaXYgY2xhc3NOYW1lPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBwLTQgc2hhZG93',
'LXNtIGJvcmRlciBib3JkZXItZ3JheS0xMDAgZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0zIj4KICAgICAgICA8Q2Fs',
'ZW5kYXIgc2l6ZT17MTh9IGNsYXNzTmFtZT0idGV4dC1hbWJlci02MDAiIC8+CiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJ0ZXh0',
'LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS03MDAiPlDDqXJpb2RlIDo8L3NwYW4+CiAgICAgICAgPGJ1dHRvbiB0eXBlPSJidXR0',
'b24iIG9uQ2xpY2s9eygpID0+IHsgY29uc3QgcyA9IHN0YXJ0T2ZXZWVrKHRvZGF5LCB7IHdlZWtTdGFydHNPbjogNiB9KTsgc2V0',
'RGFzaEZyb20oZm9ybWF0KHMsICd5eXl5LU1NLWRkJykpOyBzZXREYXNoVG8oZm9ybWF0KGFkZERheXMocywgNSksICd5eXl5LU1N',
'LWRkJykpOyB9fQogICAgICAgICAgY2xhc3NOYW1lPSJweC0zIHB5LTEuNSByb3VuZGVkLWxnIHRleHQtc20gZm9udC1tZWRpdW0g',
'YmctZ3JheS0xMDAgdGV4dC1ncmF5LTcwMCBob3ZlcjpiZy1hbWJlci0xMDAiPlNlbWFpbmU8L2J1dHRvbj4KICAgICAgICA8YnV0',
'dG9uIHR5cGU9ImJ1dHRvbiIgb25DbGljaz17KCkgPT4geyBzZXREYXNoRnJvbShmb3JtYXQoc3RhcnRPZk1vbnRoKHRvZGF5KSwg',
'J3l5eXktTU0tZGQnKSk7IHNldERhc2hUbyhmb3JtYXQoZW5kT2ZNb250aCh0b2RheSksICd5eXl5LU1NLWRkJykpOyB9fQogICAg',
'ICAgICAgY2xhc3NOYW1lPXtgcHgtMyBweS0xLjUgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtbWVkaXVtICR7aXNNb250aFJhbmdl',
'ID8gJ2JnLWFtYmVyLTUwMCB0ZXh0LXdoaXRlJyA6ICdiZy1ncmF5LTEwMCB0ZXh0LWdyYXktNzAwIGhvdmVyOmJnLWFtYmVyLTEw',
'MCd9YH0+TW9pczwvYnV0dG9uPgogICAgICAgIDxidXR0b24gdHlwZT0iYnV0dG9uIiBvbkNsaWNrPXsoKSA9PiB7IHNldERhc2hG',
'cm9tKGZvcm1hdChzdGFydE9mWWVhcih0b2RheSksICd5eXl5LU1NLWRkJykpOyBzZXREYXNoVG8oZm9ybWF0KGVuZE9mWWVhcih0',
'b2RheSksICd5eXl5LU1NLWRkJykpOyB9fQogICAgICAgICAgY2xhc3NOYW1lPSJweC0zIHB5LTEuNSByb3VuZGVkLWxnIHRleHQt',
'c20gZm9udC1tZWRpdW0gYmctZ3JheS0xMDAgdGV4dC1ncmF5LTcwMCBob3ZlcjpiZy1hbWJlci0xMDAiPkFubsOpZTwvYnV0dG9u',
'PgogICAgICAgIDxkaXYgY2xhc3NOYW1lPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+CiAgICAgICAgICA8c3BhbiBjbGFzc05h',
'bWU9InRleHQtc20gdGV4dC1ncmF5LTYwMCI+RHU8L3NwYW4+CiAgICAgICAgICA8aW5wdXQgdHlwZT0iZGF0ZSIgdmFsdWU9e2Rh',
'c2hGcm9tfSBvbkNoYW5nZT17ZSA9PiBzZXREYXNoRnJvbShlLnRhcmdldC52YWx1ZSl9IGNsYXNzTmFtZT0icHgtMiBweS0xLjUg',
'Ym9yZGVyIHJvdW5kZWQtbGcgdGV4dC1zbSIgLz4KICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0idGV4dC1zbSB0ZXh0LWdyYXkt',
'NjAwIj5hdTwvc3Bhbj4KICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiB2YWx1ZT17ZGFzaFRvfSBvbkNoYW5nZT17ZSA9PiBz',
'ZXREYXNoVG8oZS50YXJnZXQudmFsdWUpfSBjbGFzc05hbWU9InB4LTIgcHktMS41IGJvcmRlciByb3VuZGVkLWxnIHRleHQtc20i',
'IC8+CiAgICAgICAgPC9kaXY+CiAgICAgICAgeyFyYW5nZVZhbGlkICYmIDxzcGFuIGNsYXNzTmFtZT0idGV4dC14cyB0ZXh0LXJl',
'ZC02MDAiPkRhdGVzIGludmFsaWRlczwvc3Bhbj59CiAgICAgIDwvZGl2PgoK'
].join(''));
const FP = 'src/pages/Dashboard.tsx';
if (!fs.existsSync(FP)) stop('Dashboard.tsx introuvable');
let t = fs.readFileSync(FP, 'utf8');
if (t.indexOf('dashFrom') >= 0) stop('deja applique');
function count(s) { return t.split(s).length - 1; }
function need(s, nom) { const n = count(s); if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1'); }
function swap(a, b, nom) { need(a, nom); const i = t.indexOf(a); t = t.slice(0, i) + b + t.slice(i + a.length); }

swap("import React, { useEffect, useRef } from 'react';", "import React, { useEffect, useRef, useState } from 'react';", 'import react');
swap("import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';", "import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, startOfYear, endOfYear, addDays } from 'date-fns';", 'import date-fns');
swap('const laborAutoBusy = useRef(false);', 'const laborAutoBusy = useRef(false);' + STATES, 'etats');
swap('const currentYear = today.getFullYear();', 'const currentYear = today.getFullYear();' + RANGE, 'periode');

const mf = 'date.getMonth() === currentMonth && date.getFullYear() === currentYear';
const nmf = count(mf);
if (nmf < 4 || nmf > 12) stop('filtres mensuels : ' + nmf + ' occurrence(s), attendu entre 4 et 12');
t = t.split(mf).join('dateInRange(date)');
swap('start.getMonth() === currentMonth && start.getFullYear() === currentYear', 'dateInRange(start)', 'filtre energie');

need('  const laborMonth = laborCosts', 'main d oeuvre');
const ls = t.indexOf('  const laborMonth = laborCosts');
const le = t.indexOf('\n\n', ls);
const seg = t.slice(ls, le);
if (seg.indexOf('period_month === currentMonth + 1') < 0) stop('bloc main d oeuvre inattendu');
t = t.slice(0, ls) + LABOR.trimEnd() + t.slice(le);

swap('const totalExpensesMonth = fixedChargesMonthly + variableExpensesMonth', 'const totalExpensesMonth = fixedChargesMonthly * dashFactor + variableExpensesMonth', 'total des charges');
swap('((totalExpensesMonth + totalPurchasesMonth) / 30)', '((totalExpensesMonth + totalPurchasesMonth) / (isMonthRange ? 30 : Math.max(1, rangeDays)))', 'benefice du jour');
swap('title: "Chiffre d\'Affaires Mensuel",', 'title: isMonthRange ? "Chiffre d\'Affaires Mensuel" : "Chiffre d\'Affaires de la Période",', 'titre CA');
swap("title: 'Production ce Mois',", "title: isMonthRange ? 'Production ce Mois' : 'Production de la Période',", 'titre production');
swap("title: 'Dépenses ce Mois',", "title: isMonthRange ? 'Dépenses ce Mois' : 'Dépenses de la Période',", 'titre depenses');
swap("} mensuel: {Math.abs(profitMonth)", "} {isMonthRange ? 'mensuel' : 'de la période'} : {Math.abs(profitMonth)", 'badge benefice');
need('{/* Stats Cards */}', 'cartes');
const si = t.indexOf('{/* Stats Cards */}');
const sl = t.lastIndexOf('\n', si) + 1;
t = t.slice(0, sl) + UI + t.slice(sl);

fs.writeFileSync('backup27-Dashboard.tsx.txt', fs.readFileSync(FP, 'utf8'));
fs.writeFileSync(FP, t);
console.log('OK : agenda Du / au ajoute au Tableau de bord (' + nmf + ' filtres mensuels remplaces)');
#!/usr/bin/env node
/**
 * Build assets/data/resultados.json from OPL-format CSV files in assets/resultados csv/
 * Output: array of { nome, data, local, categoria, resultadosMasculino, resultadosFeminino }
 * Each resultados array: [{ atleta, categoria, squat, bench, deadlift, total, pontos }] sorted by points desc.
 */

const fs = require('fs');
const path = require('path');

const CSV_DIR = path.join(__dirname, '..', 'assets', 'resultados csv');
const OUT_PATH = path.join(__dirname, '..', 'assets', 'data', 'resultados.json');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' || c === "'") {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && c === ',') {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += c;
  }
  result.push(current.trim());
  return result;
}

function titleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function parseOplCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  // OPL format: line 0-1 header, 2 = meet header, 3 = meet row, 4 = blank, 5 = column header, 6+ = data
  if (lines.length < 7) return null;

  // Meet row may have malformed quoting (e.g. '2025-12-21); use simple comma split
  const meetRow = lines[3].split(',').map((s) => s.trim());
  const dateRaw = (meetRow[1] || '').replace(/^['"]/, '');
  const date = dateRaw.split(',')[0] || dateRaw;
  const meetName = meetRow[5] || path.basename(filePath, '.opl.csv').replace(/-/g, ' ');
  const meetState = meetRow[3] || '';
  const meetTown = meetRow[4] || '';
  const local = [meetTown, meetState].filter(Boolean).join(', ').replace(/BRASILIA/i, 'Brasília');

  const colHeader = parseCSVLine(lines[5]);
  const nameIdx = colHeader.indexOf('Name');
  const placeIdx = colHeader.indexOf('Place');
  const divisionIdx = colHeader.indexOf('Division');
  const weightClassIdx = colHeader.indexOf('WeightClassKg');
  const sexIdx = colHeader.indexOf('Sex');
  const bestSquatIdx = colHeader.indexOf('Best3SquatKg');
  const bestBenchIdx = colHeader.indexOf('Best3BenchKg');
  const bestDeadliftIdx = colHeader.indexOf('Best3DeadliftKg');
  const totalIdx = colHeader.indexOf('TotalKg');
  const pointsIdx = colHeader.indexOf('Points');

  const resultadosMasculino = [];
  const resultadosFeminino = [];

  for (let i = 6; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const maxIdx = Math.max(nameIdx, totalIdx, pointsIdx);
    if (row.length <= maxIdx) continue;

    const name = (row[nameIdx] || '').trim();
    if (!name) continue;

    const sex = (row[sexIdx] || '').toUpperCase();
    const totalKgRaw = row[totalIdx];
    const totalKg = totalKgRaw !== '' && totalKgRaw != null ? parseFloat(totalKgRaw) : NaN;
    const hasValidTotal = !isNaN(totalKg) && totalKg > 0;
    const pointsRaw = row[pointsIdx];
    const pontos = pointsRaw !== '' && pointsRaw != null ? parseFloat(pointsRaw) : null;
    const hasValidPoints = pontos != null && !isNaN(pontos);

    const division = row[divisionIdx] || '';
    const weightClass = row[weightClassIdx] || '';
    const categoria = [weightClass, division].filter(Boolean).join(' ') || '-';
    const squat = parseFloat(row[bestSquatIdx]);
    const bench = parseFloat(row[bestBenchIdx]);
    const deadlift = parseFloat(row[bestDeadliftIdx]);

    const entry = {
      atleta: titleCase(name),
      categoria: categoria.trim() || '-',
      squat: !isNaN(squat) && squat > 0 ? squat : null,
      bench: !isNaN(bench) && bench > 0 ? bench : null,
      deadlift: !isNaN(deadlift) && deadlift > 0 ? deadlift : null,
      total: hasValidTotal ? totalKg : null,
      pontos: hasValidPoints ? pontos : null,
    };

    if (sex === 'F') {
      resultadosFeminino.push(entry);
    } else {
      resultadosMasculino.push(entry);
    }
  }

  // Sort each by points descending (null points at the end)
  function sortByPoints(arr) {
    arr.sort((a, b) => {
      if (a.pontos == null && b.pontos == null) return 0;
      if (a.pontos == null) return 1;
      if (b.pontos == null) return -1;
      return b.pontos - a.pontos;
    });
  }
  sortByPoints(resultadosMasculino);
  sortByPoints(resultadosFeminino);

  // Determine competition category for filter: Masculino, Feminino, Misto
  let compCategoria = 'Misto';
  if (resultadosMasculino.length > 0 && resultadosFeminino.length === 0) compCategoria = 'Masculino';
  else if (resultadosFeminino.length > 0 && resultadosMasculino.length === 0) compCategoria = 'Feminino';

  return {
    nome: meetName,
    data: date,
    local: local || 'Brasília',
    categoria: compCategoria,
    resultadosMasculino,
    resultadosFeminino,
  };
}

function main() {
  const files = fs.readdirSync(CSV_DIR).filter((f) => f.endsWith('.csv') || f.endsWith('.opl.csv'));
  const comps = [];

  for (const file of files) {
    const filePath = path.join(CSV_DIR, file);
    const comp = parseOplCsv(filePath);
    const hasResults = comp && (comp.resultadosMasculino.length > 0 || comp.resultadosFeminino.length > 0);
    if (hasResults) {
      comps.push(comp);
    }
  }

  // Sort competitions by date descending (most recent first)
  comps.sort((a, b) => {
    const dA = new Date(a.data);
    const dB = new Date(b.data);
    return dB - dA;
  });

  fs.writeFileSync(OUT_PATH, JSON.stringify(comps, null, 2), 'utf-8');
  console.log('Wrote', OUT_PATH, 'with', comps.length, 'competition(s)');
}

main();

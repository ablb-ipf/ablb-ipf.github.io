#!/usr/bin/env node
/**
 * Build assets/data/resultados.json from OPL-format CSV files in assets/resultados csv/
 * Expected JSON: array of { nome, data, local, categoria, resultados: [{ atleta, categoria, squat, bench, deadlift, total }] }
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

  const resultados = [];
  const seenNames = new Set();

  for (let i = 6; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length <= Math.max(nameIdx, totalIdx)) continue;

    const name = (row[nameIdx] || '').trim();
    if (!name) continue;

    const totalKgRaw = row[totalIdx];
    const totalKg = totalKgRaw !== '' && totalKgRaw != null ? parseFloat(totalKgRaw) : NaN;
    const hasValidTotal = !isNaN(totalKg) && totalKg > 0;

    const division = row[divisionIdx] || '';
    const weightClass = row[weightClassIdx] || '';
    const categoria = [weightClass, division].filter(Boolean).join(' ') || '-';
    const squat = parseFloat(row[bestSquatIdx]);
    const bench = parseFloat(row[bestBenchIdx]);
    const deadlift = parseFloat(row[bestDeadliftIdx]);

    resultados.push({
      atleta: titleCase(name),
      categoria: categoria.trim() || '-',
      squat: !isNaN(squat) && squat > 0 ? squat : null,
      bench: !isNaN(bench) && bench > 0 ? bench : null,
      deadlift: !isNaN(deadlift) && deadlift > 0 ? deadlift : null,
      total: hasValidTotal ? totalKg : null,
    });
  }

  // Sort by total descending (null totals at the end)
  resultados.sort((a, b) => {
    if (a.total == null && b.total == null) return 0;
    if (a.total == null) return 1;
    if (b.total == null) return -1;
    return b.total - a.total;
  });

  // Determine competition category for filter: Masculino, Feminino, Misto
  const sexes = new Set();
  for (let i = 6; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row[sexIdx]) sexes.add(row[sexIdx].toUpperCase());
  }
  let compCategoria = 'Misto';
  if (sexes.size === 1) {
    compCategoria = sexes.has('M') ? 'Masculino' : sexes.has('F') ? 'Feminino' : 'Misto';
  }

  return {
    nome: meetName,
    data: date,
    local: local || 'Brasília',
    categoria: compCategoria,
    resultados,
  };
}

function main() {
  const files = fs.readdirSync(CSV_DIR).filter((f) => f.endsWith('.csv') || f.endsWith('.opl.csv'));
  const comps = [];

  for (const file of files) {
    const filePath = path.join(CSV_DIR, file);
    const comp = parseOplCsv(filePath);
    if (comp && comp.resultados.length > 0) {
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

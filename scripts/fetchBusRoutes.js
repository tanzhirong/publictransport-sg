#!/usr/bin/env node
/**
 * Fetch all Bus Routes + Bus Stop names from LTA DataMall API.
 * Outputs a flat map keyed by "serviceNo (Destination)" per direction.
 *
 * Usage:  node scripts/fetchBusRoutes.js
 * Output: client/public/data/busRoutes.json
 *
 * Format: { "74 (Clementi Int)": ["83139", ...], "74 (Hougang Central)": [...] }
 *
 * Requires LTA_API_KEY in server/.env
 */

const fs   = require('fs');
const path = require('path');

// Manually parse server/.env (dotenv may not be in root node_modules)
const envPath = path.join(__dirname, '../server/.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const BASE_URL  = 'https://datamall2.mytransport.sg/ltaodataservice';
const PAGE_SIZE = 500;
const OUTPUT    = path.join(__dirname, '../client/public/data/busRoutes.json');

const API_KEY = process.env.LTA_API_KEY;
if (!API_KEY) {
  console.error('❌  LTA_API_KEY not found. Make sure server/.env exists with LTA_API_KEY=...');
  process.exit(1);
}

async function fetchAllPages(endpoint) {
  const rows = [];
  let skip = 0;
  while (true) {
    process.stdout.write(`  [${endpoint}] $skip=${skip}...`);
    const res = await fetch(`${BASE_URL}/${endpoint}?$skip=${skip}`, {
      headers: { AccountKey: API_KEY, accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${endpoint} at $skip=${skip}`);
    const json = await res.json();
    const page = json.value || [];
    process.stdout.write(` ${page.length} rows\n`);
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }
  return rows;
}

// Title-case a stop description: "CLEMENTI INT" → "Clementi Int"
function titleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

async function main() {
  // Step 1: Fetch all bus stop descriptions → { stopCode: "Clementi Int" }
  console.log('\n📍 Fetching bus stop names...');
  const stopRows = await fetchAllPages('BusStops');
  const stopNames = {};
  for (const s of stopRows) {
    const code = String(s.BusStopCode).padStart(5, '0');
    stopNames[code] = titleCase(s.Description);
  }
  console.log(`   → ${Object.keys(stopNames).length} stop names loaded`);

  // Step 2: Fetch all bus routes
  console.log('\n🚌 Fetching bus routes...');
  const routeRows = await fetchAllPages('BusRoutes');
  console.log(`   → ${routeRows.length} route rows loaded`);

  // Step 3: Group by serviceNo + direction, preserving stop sequence order
  const serviceRoutes = {}; // { svc: { dir: { seq: stopCode } } }
  for (const row of routeRows) {
    const svc  = row.ServiceNo;
    const dir  = row.Direction;
    const seq  = row.StopSequence;
    const code = String(row.BusStopCode).padStart(5, '0');
    if (!serviceRoutes[svc])       serviceRoutes[svc] = {};
    if (!serviceRoutes[svc][dir])  serviceRoutes[svc][dir] = {};
    serviceRoutes[svc][dir][seq] = code;
  }

  // Step 4: Build flat output keyed by "serviceNo (Destination)"
  const output = {};
  for (const [svc, dirs] of Object.entries(serviceRoutes)) {
    for (const [, seqMap] of Object.entries(dirs)) {
      // Sort stops by sequence
      const stops = Object.entries(seqMap)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, code]) => code);

      // Last stop = destination terminal
      const lastCode = stops[stops.length - 1];
      const destName = stopNames[lastCode] || lastCode;
      const key = `${svc} (${destName})`;

      output[key] = stops;
    }
  }

  // Step 5: Sort keys numerically by service number
  const sorted = Object.fromEntries(
    Object.entries(output).sort(([a], [b]) => {
      const na = parseInt(a), nb = parseInt(b);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
      return a.localeCompare(b);
    })
  );

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(sorted));

  const keyCount   = Object.keys(sorted).length;
  const stopCount  = new Set(Object.values(sorted).flat()).size;
  const fileSizeKB = Math.round(fs.statSync(OUTPUT).size / 1024);

  console.log(`\n✅  Done!`);
  console.log(`   Service-direction keys : ${keyCount}`);
  console.log(`   Unique bus stops       : ${stopCount}`);
  console.log(`   Output                 : ${OUTPUT} (${fileSizeKB} KB)`);
  console.log(`\n   Sample keys:`);
  Object.keys(sorted).slice(0, 6).forEach(k => console.log(`     ${k}`));
}

main().catch((err) => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});

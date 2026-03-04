#!/usr/bin/env node
/**
 * Scrape first/last train times from SMRT CDN (pre-rendered HTML files)
 * Source: https://connect-cdn.smrt.wwprojects.com/autoupdate/mrt-timing/{station}.html
 *
 * Usage:  node scripts/scrapeTrainTimes.js
 * Output: client/public/data/trainSchedule.json
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const stationCodeMapping = require('../server/data/stationCodeMapping');

const OUTPUT_PATH = path.join(__dirname, '..', 'client', 'public', 'data', 'trainSchedule.json');
const CDN_BASE = 'https://connect-cdn.smrt.wwprojects.com/autoupdate/mrt-timing/';
const DELAY_MS = 300; // polite delay between requests

// Build a unique station list from the mapping
function getStationList() {
  const stations = [];
  const seen = new Set();

  for (const [fullName, codes] of Object.entries(stationCodeMapping)) {
    const shortName = fullName
      .replace(/ MRT STATION$/, '')
      .replace(/ LRT STATION$/, '');

    if (seen.has(shortName)) continue;
    seen.add(shortName);

    stations.push({ fullName, shortName, codes });
  }

  return stations;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(stationName) {
  const https = require('https');
  // SMRT CDN uses lowercase station names
  const url = CDN_BASE + encodeURIComponent(stationName.toLowerCase()) + '.html';

  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        res.resume(); // drain response
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data || null));
    }).on('error', () => resolve(null));
  });
}

function parseTimings(html) {
  const $ = cheerio.load(html);
  const timings = [];

  // Each .divTimesDescContainer is one destination
  // Structure:
  //   #divTimeHeader → "First train service towards NS27 Marina Bay" or
  //                     "Last train service terminating at NS19 Toa Payoh"
  //   table → rows: header | Mon-Fri | Saturday | Sunday/PH | Eve of PH
  //   Each row: day | first train | last train

  $('.divTimesDescContainer').each((_, container) => {
    const header = $(container).find('#divTimeHeader').text().trim();
    if (!header) return;

    // Extract destination from header
    // e.g., "First train service towards NS27 Marina Bay"
    // e.g., "Last train service terminating at NS19 Toa Payoh"
    let towards = header
      .replace(/^First\/Last train service terminating at\s*/i, '')
      .replace(/^First train service towards\s*/i, '')
      .replace(/^First train service terminating at\s*/i, '')
      .replace(/^Last train service terminating at\s*/i, '')
      .replace(/^Train service towards\s*/i, '')
      .replace(/^Train service terminating at\s*/i, '')
      .replace(/^Towards\s*/i, '')
      .trim();

    const rows = $(container).find('table tr');
    if (rows.length < 2) return;

    // Parse table rows
    const timing = { towards, first: {}, last: {} };
    let foundData = false;

    rows.each((i, row) => {
      if (i === 0) return; // skip header row

      const cells = $(row).find('td');
      if (cells.length < 3) return;

      const dayLabel = $(cells[0]).text().trim().toLowerCase();
      const firstVal = $(cells[1]).text().trim() || '-';
      const lastVal = $(cells[2]).text().trim() || '-';

      // Normalize --:-- to -
      const first = firstVal === '--:--' ? '-' : firstVal;
      const last = lastVal === '--:--' ? '-' : lastVal;

      if (dayLabel.includes('monday') || dayLabel.includes('mon') || dayLabel.includes('weekday')) {
        timing.first.weekday = first;
        timing.last.weekday = last;
        foundData = true;
      } else if (dayLabel.includes('saturday') || dayLabel.includes('sat')) {
        timing.first.sat = first;
        timing.last.sat = last;
        foundData = true;
      } else if (dayLabel.includes('sunday') || dayLabel.includes('sun')) {
        timing.first.sunPH = first;
        timing.last.sunPH = last;
        foundData = true;
      }
      // "Eve of Public Holidays" — skip (optional extra info)
    });

    // Fill in missing day types with defaults
    if (foundData) {
      timing.first.weekday = timing.first.weekday || '-';
      timing.first.sat = timing.first.sat || timing.first.weekday;
      timing.first.sunPH = timing.first.sunPH || timing.first.sat;
      timing.last.weekday = timing.last.weekday || '-';
      timing.last.sat = timing.last.sat || timing.last.weekday;
      timing.last.sunPH = timing.last.sunPH || timing.last.sat;
      timings.push(timing);
    }
  });

  return timings;
}

async function main() {
  const stations = getStationList();
  console.log(`Scraping ${stations.length} stations from SMRT CDN...`);
  console.log(`Source: ${CDN_BASE}{station}.html\n`);

  const schedule = {};
  let success = 0;
  let failed = 0;
  let notFound = 0;

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];
    const pct = Math.round(((i + 1) / stations.length) * 100);
    process.stdout.write(`[${String(pct).padStart(3)}%] ${station.shortName}...`);

    const html = await fetchPage(station.shortName);

    if (html) {
      const timings = parseTimings(html);
      if (timings.length > 0) {
        for (const { code } of station.codes) {
          schedule[code] = {
            stationName: station.shortName,
            fullName: station.fullName,
            timings,
          };
        }
        console.log(` OK (${timings.length} routes)`);
        success++;
      } else {
        console.log(' (page found, no timing data)');
        notFound++;
      }
    } else {
      console.log(' not on CDN');
      failed++;
    }

    await sleep(DELAY_MS);
  }

  // Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(schedule, null, 2));
  console.log(`\nDone! ${success} OK, ${notFound} no data, ${failed} not found.`);
  console.log(`Total station codes in output: ${Object.keys(schedule).length}`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main().catch(console.error);

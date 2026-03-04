#!/usr/bin/env node
/**
 * processRailLines.js
 *
 * Pre-processes the MasterPlan2025RailLineLayer.geojson to assign each
 * rail segment to a specific MRT/LRT line based on proximity to known
 * station centroid polylines.
 *
 * Input:  Data/MasterPlan2025RailLineLayer.geojson (23.4MB, 1,397 segments, NO line identifiers)
 *         client/public/data/mrtExits.geojson (station exit coordinates for centroid calculation)
 * Output: client/public/data/railLines.geojson (segments with added `line` and `color` properties)
 *
 * Usage: node scripts/processRailLines.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// CONSTANTS: Line station order + colors (from lineStationOrder.js)
// ============================================================

const LINE_STATION_ORDER = {
  NSL: [
    "JURONG EAST MRT STATION","BUKIT BATOK MRT STATION","BUKIT GOMBAK MRT STATION",
    "CHOA CHU KANG MRT STATION","YEW TEE MRT STATION","KRANJI MRT STATION",
    "MARSILING MRT STATION","WOODLANDS MRT STATION","ADMIRALTY MRT STATION",
    "SEMBAWANG MRT STATION","CANBERRA MRT STATION","YISHUN MRT STATION",
    "KHATIB MRT STATION","YIO CHU KANG MRT STATION","ANG MO KIO MRT STATION",
    "BISHAN MRT STATION","BRADDELL MRT STATION","TOA PAYOH MRT STATION",
    "NOVENA MRT STATION","NEWTON MRT STATION","ORCHARD MRT STATION",
    "SOMERSET MRT STATION","DHOBY GHAUT MRT STATION","CITY HALL MRT STATION",
    "RAFFLES PLACE MRT STATION","MARINA BAY MRT STATION","MARINA SOUTH PIER MRT STATION",
  ],
  EWL: [
    "PASIR RIS MRT STATION","TAMPINES MRT STATION","SIMEI MRT STATION",
    "TANAH MERAH MRT STATION","BEDOK MRT STATION","KEMBANGAN MRT STATION",
    "EUNOS MRT STATION","PAYA LEBAR MRT STATION","ALJUNIED MRT STATION",
    "KALLANG MRT STATION","LAVENDER MRT STATION","BUGIS MRT STATION",
    "CITY HALL MRT STATION","RAFFLES PLACE MRT STATION","TANJONG PAGAR MRT STATION",
    "OUTRAM PARK MRT STATION","TIONG BAHRU MRT STATION","REDHILL MRT STATION",
    "QUEENSTOWN MRT STATION","COMMONWEALTH MRT STATION","BUONA VISTA MRT STATION",
    "DOVER MRT STATION","CLEMENTI MRT STATION","JURONG EAST MRT STATION",
    "CHINESE GARDEN MRT STATION","LAKESIDE MRT STATION","BOON LAY MRT STATION",
    "PIONEER MRT STATION","JOO KOON MRT STATION","GUL CIRCLE MRT STATION",
    "TUAS CRESCENT MRT STATION","TUAS WEST ROAD MRT STATION","TUAS LINK MRT STATION",
  ],
  CGL: [
    "TANAH MERAH MRT STATION","EXPO MRT STATION","CHANGI AIRPORT MRT STATION",
  ],
  NEL: [
    "HARBOURFRONT MRT STATION","OUTRAM PARK MRT STATION","CHINATOWN MRT STATION",
    "CLARKE QUAY MRT STATION","DHOBY GHAUT MRT STATION","LITTLE INDIA MRT STATION",
    "FARRER PARK MRT STATION","BOON KENG MRT STATION","POTONG PASIR MRT STATION",
    "WOODLEIGH MRT STATION","SERANGOON MRT STATION","KOVAN MRT STATION",
    "HOUGANG MRT STATION","BUANGKOK MRT STATION","SENGKANG MRT STATION",
    "PUNGGOL MRT STATION",
  ],
  CCL: [
    "DHOBY GHAUT MRT STATION","BRAS BASAH MRT STATION","ESPLANADE MRT STATION",
    "PROMENADE MRT STATION","NICOLL HIGHWAY MRT STATION","STADIUM MRT STATION",
    "MOUNTBATTEN MRT STATION","DAKOTA MRT STATION","PAYA LEBAR MRT STATION",
    "MACPHERSON MRT STATION","TAI SENG MRT STATION","BARTLEY MRT STATION",
    "SERANGOON MRT STATION","LORONG CHUAN MRT STATION","BISHAN MRT STATION",
    "MARYMOUNT MRT STATION","CALDECOTT MRT STATION","BOTANIC GARDENS MRT STATION",
    "FARRER ROAD MRT STATION","HOLLAND VILLAGE MRT STATION","BUONA VISTA MRT STATION",
    "ONE-NORTH MRT STATION","KENT RIDGE MRT STATION","HAW PAR VILLA MRT STATION",
    "PASIR PANJANG MRT STATION","LABRADOR PARK MRT STATION","TELOK BLANGAH MRT STATION",
    "HARBOURFRONT MRT STATION",
  ],
  CEL: [
    "BAYFRONT MRT STATION","MARINA BAY MRT STATION",
  ],
  DTL: [
    "BUKIT PANJANG MRT STATION","CASHEW MRT STATION","HILLVIEW MRT STATION",
    "DT4","BEAUTY WORLD MRT STATION","KING ALBERT PARK MRT STATION",
    "SIXTH AVENUE MRT STATION","TAN KAH KEE MRT STATION","BOTANIC GARDENS MRT STATION",
    "STEVENS MRT STATION","NEWTON MRT STATION","LITTLE INDIA MRT STATION",
    "ROCHOR MRT STATION","BUGIS MRT STATION","PROMENADE MRT STATION",
    "BAYFRONT MRT STATION","DOWNTOWN MRT STATION","TELOK AYER MRT STATION",
    "CHINATOWN MRT STATION","FORT CANNING MRT STATION","BENCOOLEN MRT STATION",
    "JALAN BESAR MRT STATION","BENDEMEER MRT STATION","GEYLANG BAHRU MRT STATION",
    "MATTAR MRT STATION","MACPHERSON MRT STATION","UBI MRT STATION",
    "KAKI BUKIT MRT STATION","BEDOK NORTH MRT STATION","BEDOK RESERVOIR MRT STATION",
    "TAMPINES WEST MRT STATION","TAMPINES MRT STATION","TAMPINES EAST MRT STATION",
    "UPPER CHANGI MRT STATION","EXPO MRT STATION",
  ],
  TEL: [
    "WOODLANDS NORTH MRT STATION","WOODLANDS MRT STATION","WOODLANDS SOUTH MRT STATION",
    "SPRINGLEAF MRT STATION","LENTOR MRT STATION","MAYFLOWER MRT STATION",
    "BRIGHT HILL MRT STATION","UPPER THOMSON MRT STATION","CALDECOTT MRT STATION",
    "STEVENS MRT STATION","NAPIER MRT STATION","ORCHARD BOULEVARD MRT STATION",
    "ORCHARD MRT STATION","GREAT WORLD MRT STATION","HAVELOCK MRT STATION",
    "OUTRAM PARK MRT STATION","MAXWELL MRT STATION","SHENTON WAY MRT STATION",
    "MARINA BAY MRT STATION","MARINA SOUTH MRT STATION","GARDENS BY THE BAY MRT STATION",
    "TANJONG RHU MRT STATION","KATONG PARK MRT STATION","TANJONG KATONG MRT STATION",
    "MARINE PARADE MRT STATION","MARINE TERRACE MRT STATION","SIGLAP MRT STATION",
    "BAYSHORE MRT STATION",
  ],
  BPL: [
    "CHOA CHU KANG LRT STATION","SOUTH VIEW LRT STATION","KEAT HONG LRT STATION",
    "TECK WHYE LRT STATION","PHOENIX LRT STATION","BUKIT PANJANG LRT STATION",
    "PETIR LRT STATION","PENDING LRT STATION","BANGKIT LRT STATION",
    "FAJAR LRT STATION","SEGAR LRT STATION","JELAPANG LRT STATION",
    "SENJA LRT STATION","CHOA CHU KANG LRT STATION",
  ],
  SLRT_EAST: [
    "SENGKANG MRT STATION","COMPASSVALE LRT STATION","RUMBIA LRT STATION",
    "BAKAU LRT STATION","KANGKAR LRT STATION","RANGGUNG LRT STATION",
    "SENGKANG MRT STATION",
  ],
  SLRT_WEST: [
    "SENGKANG MRT STATION","CHENG LIM LRT STATION","FARMWAY LRT STATION",
    "KUPANG LRT STATION","THANGGAM LRT STATION","FERNVALE LRT STATION",
    "LAYAR LRT STATION","TONGKANG LRT STATION","RENJONG LRT STATION",
    "SENGKANG MRT STATION",
  ],
  PLRT_EAST: [
    "PUNGGOL MRT STATION","COVE LRT STATION","MERIDIAN LRT STATION",
    "CORAL EDGE LRT STATION","RIVIERA LRT STATION","KADALOOR LRT STATION",
    "OASIS LRT STATION","DAMAI LRT STATION","PUNGGOL MRT STATION",
  ],
  PLRT_WEST: [
    "PUNGGOL MRT STATION","SAM KEE LRT STATION","TECK LEE LRT STATION",
    "PUNGGOL POINT LRT STATION","SAMUDERA LRT STATION","NIBONG LRT STATION",
    "SUMANG LRT STATION","SOO TECK LRT STATION","PUNGGOL MRT STATION",
  ],
};

const LINE_PATH_COLORS = {
  NSL: '#d42e12', EWL: '#009645', CGL: '#009645', NEL: '#9900aa',
  CCL: '#fa9e0d', CEL: '#fa9e0d', DTL: '#005ec4', TEL: '#9D5B25',
  CRL: '#97C616', JRL: '#0099aa',
  BPL: '#748477', SLRT_EAST: '#748477', SLRT_WEST: '#748477',
  PLRT_EAST: '#748477', PLRT_WEST: '#748477',
};

// MRT lines vs LRT lines for partitioning
// Note: CRL and JRL are future lines — no stations in exit data yet,
// so they won't have reference polylines. Segments can be assigned manually via the editor.
const MRT_LINES = ['NSL', 'EWL', 'CGL', 'NEL', 'CCL', 'CEL', 'DTL', 'TEL', 'CRL', 'JRL'];
const LRT_LINES = ['BPL', 'SLRT_EAST', 'SLRT_WEST', 'PLRT_EAST', 'PLRT_WEST'];

// ============================================================
// GEOMETRY UTILITIES
// ============================================================

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_M = 6371000;

/**
 * Haversine distance between two points in meters
 */
function haversine(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) *
    Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Approximate distance from a point to a line segment (in meters).
 * Uses projected coordinates for efficiency at Singapore's scale.
 * Point and segment endpoints are [lng, lat].
 */
function pointToSegmentDist(point, segA, segB) {
  // Convert to approximate meters from reference point
  const cosLat = Math.cos(point[1] * DEG_TO_RAD);
  const px = (point[0] - segA[0]) * cosLat * 111320;
  const py = (point[1] - segA[1]) * 111320;
  const ax = 0, ay = 0;
  const bx = (segB[0] - segA[0]) * cosLat * 111320;
  const by = (segB[1] - segA[1]) * 111320;

  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    // Segment is a point
    return Math.sqrt(px * px + py * py);
  }

  // Parameter t of closest point on segment
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = ax + t * dx;
  const closestY = ay + t * dy;

  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

/**
 * Minimum distance from a point [lng, lat] to a polyline (array of [lng, lat]).
 */
function pointToPolylineDist(point, polyline) {
  let minDist = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = pointToSegmentDist(point, polyline[i], polyline[i + 1]);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/**
 * Sample multiple points along a LineString for better matching accuracy.
 * Returns an array of [lng, lat] points.
 */
function samplePointsAlongLine(coords, numSamples = 5) {
  if (coords.length <= 2) return [coords[0], coords[coords.length - 1]];

  const points = [];
  const step = Math.max(1, Math.floor((coords.length - 1) / (numSamples - 1)));
  for (let i = 0; i < coords.length; i += step) {
    points.push(coords[i]);
  }
  // Always include last point
  if (points[points.length - 1] !== coords[coords.length - 1]) {
    points.push(coords[coords.length - 1]);
  }
  return points;
}

/**
 * Average distance from multiple sample points on a segment to a reference polyline.
 */
function avgDistToPolyline(samplePoints, polyline) {
  let totalDist = 0;
  for (const pt of samplePoints) {
    totalDist += pointToPolylineDist(pt, polyline);
  }
  return totalDist / samplePoints.length;
}

/**
 * Round coordinates to n decimal places.
 */
function roundCoord(val, decimals = 5) {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

/**
 * Get the endpoint of a LineString or MultiLineString for adjacency matching.
 */
function getEndpoints(geometry) {
  const endpoints = [];
  if (geometry.type === 'LineString') {
    const coords = geometry.coordinates;
    endpoints.push(coords[0], coords[coords.length - 1]);
  } else if (geometry.type === 'MultiLineString') {
    for (const line of geometry.coordinates) {
      endpoints.push(line[0], line[line.length - 1]);
    }
  }
  return endpoints;
}

/**
 * Get all coordinates from a feature for sampling.
 */
function getAllCoords(geometry) {
  if (geometry.type === 'LineString') {
    return geometry.coordinates;
  } else if (geometry.type === 'MultiLineString') {
    // Flatten or use the longest sub-line
    let longest = geometry.coordinates[0];
    for (const line of geometry.coordinates) {
      if (line.length > longest.length) longest = line;
    }
    return longest;
  }
  return [];
}

// ============================================================
// MAIN PROCESSING
// ============================================================

function main() {
  const projectRoot = path.resolve(__dirname, '..');

  // 1. Load MRT exits to compute station centroids
  console.log('[1/6] Loading MRT exits...');
  const exitsPath = path.join(projectRoot, 'client/public/data/mrtExits.geojson');
  const exitsGeo = JSON.parse(fs.readFileSync(exitsPath, 'utf-8'));

  const stationExits = {};
  for (const f of exitsGeo.features) {
    const name = f.properties.STATION_NA;
    const [lng, lat] = f.geometry.coordinates;
    if (!stationExits[name]) stationExits[name] = [];
    stationExits[name].push([lng, lat]);
  }

  const centroids = {};
  for (const [name, exits] of Object.entries(stationExits)) {
    const avgLng = exits.reduce((s, e) => s + e[0], 0) / exits.length;
    const avgLat = exits.reduce((s, e) => s + e[1], 0) / exits.length;
    centroids[name] = [avgLng, avgLat]; // [lng, lat]
  }
  console.log(`   Computed centroids for ${Object.keys(centroids).length} stations`);

  // 2. Build reference polylines per line
  console.log('[2/6] Building reference polylines...');
  const refPolylines = {};
  for (const [lineName, stations] of Object.entries(LINE_STATION_ORDER)) {
    const polyline = [];
    for (const stationName of stations) {
      const c = centroids[stationName];
      if (c) polyline.push(c);
    }
    if (polyline.length >= 2) {
      refPolylines[lineName] = polyline;
    } else {
      console.warn(`   WARNING: Line ${lineName} has < 2 centroids, skipping`);
    }
  }
  console.log(`   Built ${Object.keys(refPolylines).length} reference polylines`);

  // 3. Load raw rail line GeoJSON
  console.log('[3/6] Loading raw rail line GeoJSON...');
  const rawPath = path.join(projectRoot, 'Data/MasterPlan2025RailLineLayer.geojson');
  const rawGeo = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  console.log(`   Loaded ${rawGeo.features.length} features`);

  // 4. Assign each segment to a line
  console.log('[4/6] Assigning segments to lines...');
  const DISTANCE_THRESHOLD = 600; // meters — segments farther than this from any line → grey
  const assignments = [];

  let mrtCount = 0, lrtCount = 0, railwayCount = 0, unassignedCount = 0;

  for (const feature of rawGeo.features) {
    const railType = feature.properties.RAIL_TYPE;
    const coords = getAllCoords(feature.geometry);

    if (railType === 'RAILWAY' || coords.length === 0) {
      assignments.push({ line: 'UNASSIGNED', color: '#999999', dist: Infinity });
      railwayCount++;
      continue;
    }

    // Determine candidate lines based on rail type
    const candidateLines = railType === 'LRT' ? LRT_LINES : MRT_LINES;

    // Sample points along the segment for matching
    const samplePts = samplePointsAlongLine(coords, 5);

    let bestLine = null;
    let bestDist = Infinity;

    for (const lineName of candidateLines) {
      const refPoly = refPolylines[lineName];
      if (!refPoly) continue;

      const dist = avgDistToPolyline(samplePts, refPoly);
      if (dist < bestDist) {
        bestDist = dist;
        bestLine = lineName;
      }
    }

    if (bestDist > DISTANCE_THRESHOLD || !bestLine) {
      assignments.push({ line: 'UNASSIGNED', color: '#999999', dist: bestDist });
      unassignedCount++;
    } else {
      assignments.push({
        line: bestLine,
        color: LINE_PATH_COLORS[bestLine] || '#999999',
        dist: bestDist,
      });
      if (railType === 'LRT') lrtCount++;
      else mrtCount++;
    }
  }

  console.log(`   Assigned: MRT=${mrtCount}, LRT=${lrtCount}, Railway=${railwayCount}, Unassigned=${unassignedCount}`);

  // 5. Adjacency validation pass
  console.log('[5/6] Running adjacency validation...');
  const ADJACENCY_EPSILON = 3; // meters — endpoints within this are "adjacent"

  // Build endpoint index for adjacency
  const featureEndpoints = rawGeo.features.map((f) => getEndpoints(f.geometry));

  // For each unassigned or border-case segment, check neighbors
  let reassigned = 0;
  for (let i = 0; i < rawGeo.features.length; i++) {
    if (assignments[i].line === 'UNASSIGNED' && assignments[i].dist < 1200) {
      // Try to assign based on neighbors
      const myEndpoints = featureEndpoints[i];
      const neighborLines = {};

      for (let j = 0; j < rawGeo.features.length; j++) {
        if (i === j || assignments[j].line === 'UNASSIGNED') continue;
        const theirEndpoints = featureEndpoints[j];

        // Check if any endpoints are close
        let isAdjacent = false;
        for (const ep1 of myEndpoints) {
          for (const ep2 of theirEndpoints) {
            const d = haversine(ep1[1], ep1[0], ep2[1], ep2[0]);
            if (d < ADJACENCY_EPSILON) {
              isAdjacent = true;
              break;
            }
          }
          if (isAdjacent) break;
        }

        if (isAdjacent) {
          const nl = assignments[j].line;
          neighborLines[nl] = (neighborLines[nl] || 0) + 1;
        }
      }

      // Assign to majority neighbor line
      if (Object.keys(neighborLines).length > 0) {
        const best = Object.entries(neighborLines).sort((a, b) => b[1] - a[1])[0];
        assignments[i].line = best[0];
        assignments[i].color = LINE_PATH_COLORS[best[0]] || '#999999';
        reassigned++;
      }
    }
  }

  // Second pass: check assigned segments that disagree with all neighbors
  for (let i = 0; i < rawGeo.features.length; i++) {
    if (assignments[i].line === 'UNASSIGNED') continue;

    const myEndpoints = featureEndpoints[i];
    const neighborLines = {};

    for (let j = 0; j < rawGeo.features.length; j++) {
      if (i === j || assignments[j].line === 'UNASSIGNED') continue;
      const theirEndpoints = featureEndpoints[j];

      let isAdjacent = false;
      for (const ep1 of myEndpoints) {
        for (const ep2 of theirEndpoints) {
          const d = haversine(ep1[1], ep1[0], ep2[1], ep2[0]);
          if (d < ADJACENCY_EPSILON) {
            isAdjacent = true;
            break;
          }
        }
        if (isAdjacent) break;
      }

      if (isAdjacent) {
        const nl = assignments[j].line;
        neighborLines[nl] = (neighborLines[nl] || 0) + 1;
      }
    }

    // If this segment's line doesn't appear among any neighbor, and majority says otherwise
    const myLine = assignments[i].line;
    if (Object.keys(neighborLines).length > 0 && !neighborLines[myLine]) {
      const best = Object.entries(neighborLines).sort((a, b) => b[1] - a[1])[0];
      // Only re-assign if the best neighbor line is clearly dominant
      if (best[1] >= 2) {
        assignments[i].line = best[0];
        assignments[i].color = LINE_PATH_COLORS[best[0]] || '#999999';
        reassigned++;
      }
    }
  }

  console.log(`   Reassigned ${reassigned} segments via adjacency`);

  // Final tally
  const lineCounts = {};
  for (const a of assignments) {
    lineCounts[a.line] = (lineCounts[a.line] || 0) + 1;
  }
  console.log('   Final assignment counts:', JSON.stringify(lineCounts, null, 2));

  // 6. Build output GeoJSON with reduced coordinate precision
  console.log('[6/6] Writing processed GeoJSON...');

  const outputFeatures = rawGeo.features.map((feature, i) => {
    // Deep clone and reduce coordinate precision
    const newGeometry = JSON.parse(JSON.stringify(feature.geometry));

    function roundCoords(coords) {
      if (typeof coords[0] === 'number') {
        return [roundCoord(coords[0]), roundCoord(coords[1])];
      }
      return coords.map(roundCoords);
    }

    newGeometry.coordinates = roundCoords(newGeometry.coordinates);

    return {
      type: 'Feature',
      geometry: newGeometry,
      properties: {
        OBJECTID: feature.properties.OBJECTID,
        RAIL_TYPE: feature.properties.RAIL_TYPE,
        GRND_LEVEL: feature.properties.GRND_LEVEL,
        line: assignments[i].line,
        color: assignments[i].color,
      },
    };
  });

  const outputGeo = {
    type: 'FeatureCollection',
    features: outputFeatures,
  };

  const outputPath = path.join(projectRoot, 'client/public/data/railLines.geojson');
  const outputStr = JSON.stringify(outputGeo);
  fs.writeFileSync(outputPath, outputStr);

  const sizeMB = (Buffer.byteLength(outputStr) / 1024 / 1024).toFixed(1);
  console.log(`\nDone! Output: ${outputPath} (${sizeMB} MB, ${outputFeatures.length} features)`);
}

main();

// Maps LTA crowd levels (l/m/h) to display colors and labels

export const crowdLevelMap = {
  l: { label: 'Low', color: '#4CAF50' },       // Green
  m: { label: 'Moderate', color: '#FFC107' },   // Yellow
  h: { label: 'High', color: '#F44336' }        // Red
};

export function getCrowdInfo(level) {
  return crowdLevelMap[level] || { label: 'N/A', color: '#9E9E9E' };
}

// Returns the worst (highest) crowd level from multiple station codes
export function getWorstCrowdLevel(stationCodes, crowdByCode) {
  if (!crowdByCode) return null;
  const priority = { h: 3, m: 2, l: 1 };
  let worst = null;
  let worstPriority = 0;
  for (const code of stationCodes) {
    const data = crowdByCode[code];
    if (data && priority[data.crowdLevel] > worstPriority) {
      worstPriority = priority[data.crowdLevel];
      worst = data.crowdLevel;
    }
  }
  return worst;
}

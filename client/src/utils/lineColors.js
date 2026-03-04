// Official MRT/LRT line colors from Singapore rail color scheme

export const LINE_COLORS = {
  NSL: '#d42e12',   // North-South Line (red)
  EWL: '#009645',   // East-West Line (green)
  CGL: '#009645',   // Changi Extension (same as EWL)
  NEL: '#9900aa',   // North East Line (purple)
  CCL: '#fa9e0d',   // Circle Line (orange)
  CEL: '#fa9e0d',   // Circle Extension (same as CCL)
  DTL: '#005ec4',   // Downtown Line (blue)
  TEL: '#9D5B25',   // Thomson-East Coast Line (brown)
  CRL: '#97C616',   // Cross Island Line (lime green)
  JRL: '#0099aa',   // Jurong Region Line (teal)
  BPL: '#748477',   // Bukit Panjang LRT (grey)
  SLRT: '#748477',  // Sengkang LRT (grey)
  PLRT: '#748477',  // Punggol LRT (grey)
};

export const LINE_NAMES = {
  NSL: 'North-South',
  EWL: 'East-West',
  CGL: 'Changi Extension',
  NEL: 'North East',
  CCL: 'Circle',
  CEL: 'Circle Extension',
  DTL: 'Downtown',
  TEL: 'Thomson-East Coast',
  CRL: 'Cross Island',
  JRL: 'Jurong Region',
  BPL: 'Bukit Panjang LRT',
  SLRT: 'Sengkang LRT',
  PLRT: 'Punggol LRT',
};

// Get the primary line color for a station (uses first code's line)
export function getStationPrimaryColor(codes) {
  if (!codes || codes.length === 0) return '#9E9E9E';
  return LINE_COLORS[codes[0].line] || '#9E9E9E';
}

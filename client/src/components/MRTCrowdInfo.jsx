import React from 'react';
import { getCrowdInfo } from '../utils/crowd';
import { LINE_COLORS, LINE_NAMES } from '../utils/lineColors';

// Check if a station is currently closed based on schedule data
// Singapore timezone = UTC+8
function isStationClosed(stationCodes, trainSchedule) {
  if (!trainSchedule) return false;

  // Get current SGT time
  const now = new Date();
  const sgt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
  const hours = sgt.getHours();
  const minutes = sgt.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  // MRT generally runs ~05:15 to ~00:30
  // If current time is between ~01:00 and ~05:00, station is likely closed
  // Use actual schedule data when available
  let earliestFirst = 24 * 60; // latest possible
  let latestLast = 0;

  for (const { code } of stationCodes) {
    const sched = trainSchedule[code];
    if (!sched || !sched.timings) continue;

    const dayKey = getDayKey(sgt);

    for (const timing of sched.timings) {
      const firstStr = timing.first?.[dayKey];
      const lastStr = timing.last?.[dayKey];

      if (firstStr && firstStr !== '-') {
        const firstMin = parseTimeToMinutes(firstStr);
        if (firstMin !== null && firstMin < earliestFirst) earliestFirst = firstMin;
      }
      if (lastStr && lastStr !== '-') {
        const lastMin = parseTimeToMinutes(lastStr);
        if (lastMin !== null && lastMin > latestLast) latestLast = lastMin;
      }
    }
  }

  // If we have schedule data, check if current time is outside operating hours
  if (earliestFirst < 24 * 60 && latestLast > 0) {
    // Handle midnight crossover: last train might be after midnight (e.g., 00:25 = 25 min)
    if (latestLast < earliestFirst) {
      // Wraps past midnight — closed between latestLast and earliestFirst
      return currentMinutes > latestLast && currentMinutes < earliestFirst;
    }
    return currentMinutes < earliestFirst || currentMinutes > latestLast;
  }

  // Fallback: closed between 1:00 AM and 5:00 AM
  return currentMinutes >= 60 && currentMinutes < 300;
}

function getDayKey(sgt) {
  const day = sgt.getDay(); // 0=Sun
  if (day === 0) return 'sunPH';
  if (day === 6) return 'sat';
  return 'weekday';
}

function parseTimeToMinutes(timeStr) {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h * 60 + m;
}

export default function MRTCrowdInfo({ stationName, stationCodes, crowdData, loading, error, trainSchedule }) {
  const shortName = stationName
    .replace(/ MRT STATION$/, '')
    .replace(/ LRT STATION$/, '')
    .replace(/ \(Planned\)$/, '');

  const isPlanned = stationName.includes('(Planned)');
  const isClosed = !isPlanned && isStationClosed(stationCodes || [], trainSchedule);

  // Check if schedule data exists for any code
  const hasSchedule = stationCodes?.some(({ code }) => trainSchedule?.[code]?.timings?.length > 0);
  const dayKey = getDayKey(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' })));

  return (
    <div style={{ minWidth: 220, maxWidth: 320, fontSize: 13, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{shortName}</div>

      {isPlanned && (
        <div style={{ color: '#F57F17', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Planned Station</div>
      )}

      {isClosed && (
        <div style={{
          background: '#D32F2F', color: '#fff', fontWeight: 700, fontSize: 12,
          padding: '3px 8px', borderRadius: 3, marginBottom: 4, textAlign: 'center',
        }}>
          STATION CLOSED
        </div>
      )}

      {loading && <p style={{ color: '#888', margin: '4px 0' }}>Loading...</p>}
      {error && <p style={{ color: 'red', margin: '4px 0' }}>Error: {error}</p>}

      {/* Crowd data — hidden when closed or planned */}
      {!isClosed && !isPlanned && crowdData && (
        <div style={{ marginTop: 2 }}>
          {stationCodes.map(({ code, line }) => {
            const lineColor = LINE_COLORS[line] || '#666';
            const lineName = LINE_NAMES[line] || line;
            const data = crowdData.stations?.[code];
            const info = data ? getCrowdInfo(data.crowdLevel) : getCrowdInfo(null);

            return (
              <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ display: 'inline-block', width: 3, height: 20, borderRadius: 2, backgroundColor: lineColor, flexShrink: 0 }} />
                <div style={{ flex: 1, lineHeight: 1.2 }}>
                  <span style={{ fontWeight: 600, color: lineColor, fontSize: 12 }}>{code}</span>
                  <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>{lineName}</span>
                </div>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: info.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, minWidth: 45, textAlign: 'right' }}>{info.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* More Details toggle — shows train schedule */}
      {hasSchedule && (
        <div>
          <div
            id="mrt-details-toggle"
            style={{ color: '#1976D2', fontSize: 12, cursor: 'pointer', marginTop: 4, userSelect: 'none' }}
          >
            More Details ▼
          </div>
          <div id="mrt-details-content" style={{ display: 'none', marginTop: 4, fontSize: 11, borderTop: '1px solid #eee', paddingTop: 4 }}>
            <div style={{ fontWeight: 600, marginBottom: 2, color: '#555' }}>
              Train Schedule ({dayKey === 'sunPH' ? 'Sun/PH' : dayKey === 'sat' ? 'Saturday' : 'Weekday'})
            </div>
            {(() => {
              // Deduplicate timings across all codes — interchange stations share same CDN data
              // so NS1 and EW24 at Jurong East have identical rows. Keep unique by 'towards' key.
              const seenTowards = new Set();
              return stationCodes.map(({ code, line }) => {
                const sched = trainSchedule?.[code];
                if (!sched?.timings?.length) return null;
                const lineColor = LINE_COLORS[line] || '#666';
                // Filter out timings already shown from another code
                const uniqueTimings = sched.timings.filter((t) => {
                  if (seenTowards.has(t.towards)) return false;
                  seenTowards.add(t.towards);
                  return true;
                });
                if (uniqueTimings.length === 0) return null;
                return (
                  <div key={code} style={{ marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, color: lineColor, fontSize: 11 }}>{code}</div>
                    {uniqueTimings.map((t, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 6, fontSize: 10, color: '#555', padding: '1px 0' }}>
                        <span style={{ flex: 1 }}>{t.towards}</span>
                        <span style={{ color: '#388E3C' }}>{t.first?.[dayKey] || '-'}</span>
                        <span style={{ color: '#D32F2F' }}>{t.last?.[dayKey] || '-'}</span>
                      </div>
                    ))}
                  </div>
                );
              });
            })()}
            <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#999', marginTop: 2 }}>
              <span><span style={{ color: '#388E3C' }}>■</span> First</span>
              <span><span style={{ color: '#D32F2F' }}>■</span> Last</span>
            </div>
          </div>
        </div>
      )}

      {crowdData?.lastUpdated && !isClosed && !isPlanned && (
        <div style={{ color: '#aaa', fontSize: 10, marginTop: 3 }}>
          Updated: {new Date(crowdData.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

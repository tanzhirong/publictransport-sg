import React from 'react';

const LOAD_COLORS = {
  SEA: '#4CAF50',  // Seats available (green)
  SDA: '#FFC107',  // Standing available (yellow)
  LSD: '#F44336'   // Limited standing (red)
};

function formatArrival(estimatedArrival) {
  if (!estimatedArrival) return '--';
  const diff = Math.floor((new Date(estimatedArrival) - new Date()) / 60000);
  if (diff <= 0) return 'Arr';
  return `${diff} min`;
}

function LoadDot({ load }) {
  const color = LOAD_COLORS[load] || '#9E9E9E';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        marginLeft: 4
      }}
      title={load || 'Unknown'}
    />
  );
}

export default function BusArrivalInfo({ busStopCode, data, loading, error }) {
  return (
    <div style={{ minWidth: 240, fontSize: 13 }}>
      <strong>Bus Stop {busStopCode}</strong>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {data && data.Services && data.Services.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '2px 6px' }}>Svc</th>
              <th style={{ padding: '2px 6px' }}>Next</th>
              <th style={{ padding: '2px 6px' }}>2nd</th>
              <th style={{ padding: '2px 6px' }}>3rd</th>
            </tr>
          </thead>
          <tbody>
            {data.Services.map((svc) => (
              <tr key={svc.ServiceNo} style={{ borderBottom: '1px solid #eee' }}>
                <td
                  style={{ padding: '3px 6px', fontWeight: 600, color: '#1565C0', cursor: 'pointer' }}
                  className="bus-service-clickable"
                  data-service-no={svc.ServiceNo}
                  data-bus-stop={busStopCode}
                >
                  {svc.ServiceNo}
                </td>
                {['NextBus', 'NextBus2', 'NextBus3'].map((key) => (
                  <td key={key} style={{ padding: '3px 6px' }}>
                    {formatArrival(svc[key]?.EstimatedArrival)}
                    <LoadDot load={svc[key]?.Load} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data && data.Services && data.Services.length === 0 && (
        <p style={{ color: '#666', marginTop: 6 }}>No services available</p>
      )}
    </div>
  );
}

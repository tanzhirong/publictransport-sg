import React from 'react';

export default function FilterPanel({ activeLayer, onSetLayer, onSampleDelay }) {
  return (
    <div className="filter-panel">
      <h3>Map View</h3>
      <label style={{ cursor: 'pointer' }}>
        <input
          type="radio"
          name="layer"
          value="mrt"
          checked={activeLayer === 'mrt'}
          onChange={() => onSetLayer('mrt')}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
        MRT / LRT
      </label>
      <label style={{ cursor: 'pointer' }}>
        <input
          type="radio"
          name="layer"
          value="bus"
          checked={activeLayer === 'bus'}
          onChange={() => onSetLayer('bus')}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
        Bus Stops
      </label>

      {/* UAT testing button */}
      <div style={{ borderTop: '1px solid #eee', marginTop: 8, paddingTop: 8 }}>
        <button
          onClick={onSampleDelay}
          style={{
            width: '100%',
            padding: '6px 10px',
            fontSize: 12,
            fontWeight: 600,
            color: '#D32F2F',
            background: '#FFF3F3',
            border: '1px solid #FFCDD2',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          ⚠️ Sample Delay
        </button>
      </div>
    </div>
  );
}

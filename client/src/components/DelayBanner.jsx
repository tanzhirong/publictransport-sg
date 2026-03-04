import React from 'react';
import { LINE_COLORS, LINE_NAMES } from '../utils/lineColors';

export default function DelayBanner({ alerts, onDismiss }) {
  if (!alerts || alerts.Status !== 2) return null;

  const segments = alerts.AffectedSegments || [];
  const messages = alerts.Message || [];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10000,
      background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>
            TRAIN SERVICE ALERT
          </span>
          {segments.length > 0 && (
            <span style={{ fontSize: 12, opacity: 0.85, marginLeft: 4 }}>
              — {segments.length} line{segments.length > 1 ? 's' : ''} affected
            </span>
          )}
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 12px',
            borderRadius: 4,
          }}
        >
          Dismiss
        </button>
      </div>

      {/* Affected lines chips */}
      {segments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 16px 8px' }}>
          {segments.map((seg, i) => {
            const lineColor = LINE_COLORS[seg.Line] || '#fff';
            const lineName = LINE_NAMES[seg.Line] || seg.Line;
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 4,
                padding: '3px 10px',
                fontSize: 12,
              }}>
                <span style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: lineColor,
                  border: '1.5px solid rgba(255,255,255,0.6)',
                }} />
                <span style={{ fontWeight: 600 }}>{lineName}</span>
                <span style={{ opacity: 0.8 }}>{seg.Stations}</span>
                {seg.FreeMRTShuttle === 'Yes' && (
                  <span style={{
                    background: '#4CAF50',
                    borderRadius: 3,
                    padding: '1px 5px',
                    fontSize: 10,
                    fontWeight: 600,
                  }}>Shuttle</span>
                )}
                {seg.FreePublicBus === 'Yes' && (
                  <span style={{
                    background: '#2196F3',
                    borderRadius: 3,
                    padding: '1px 5px',
                    fontSize: 10,
                    fontWeight: 600,
                  }}>Free Bus</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div style={{ padding: '0 16px 10px', fontSize: 12, lineHeight: 1.4 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ opacity: 0.9, marginBottom: 2 }}>
              {msg.Content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

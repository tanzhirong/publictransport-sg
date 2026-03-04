import React, { useEffect, useState } from 'react';
import { LINE_COLORS, LINE_NAMES } from '../utils/lineColors';

const TOAST_DURATION = 8000; // auto-dismiss after 8 seconds

export default function DelayToast({ alerts, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (alerts && alerts.Status === 2) {
      setVisible(true);
      // Fade in
      requestAnimationFrame(() => setOpacity(1));

      // Auto-dismiss after TOAST_DURATION
      const timer = setTimeout(() => {
        setOpacity(0);
        setTimeout(() => {
          setVisible(false);
          if (onDismiss) onDismiss();
        }, 300);
      }, TOAST_DURATION);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setOpacity(0);
    }
  }, [alerts, onDismiss]);

  if (!visible || !alerts || alerts.Status !== 2) return null;

  const segments = alerts.AffectedSegments || [];
  const messages = alerts.Message || [];

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 10001,
      width: 340,
      background: '#fff',
      borderRadius: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
      opacity: opacity,
      transform: `translateY(${opacity === 1 ? 0 : 20}px)`,
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      {/* Red top accent */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, #D32F2F, #F44336)' }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 6px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#D32F2F' }}>
            Train Delay
          </span>
        </div>
        <button
          onClick={() => {
            setOpacity(0);
            setTimeout(() => {
              setVisible(false);
              if (onDismiss) onDismiss();
            }, 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 18,
            color: '#999',
            cursor: 'pointer',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Affected lines */}
      {segments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 14px 6px' }}>
          {segments.map((seg, i) => {
            const lineColor = LINE_COLORS[seg.Line] || '#666';
            const lineName = LINE_NAMES[seg.Line] || seg.Line;
            return (
              <span key={i} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#f5f5f5',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 600,
                color: lineColor,
              }}>
                <span style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: lineColor,
                }} />
                {lineName}
              </span>
            );
          })}
        </div>
      )}

      {/* First message preview */}
      {messages.length > 0 && (
        <div style={{
          padding: '0 14px 10px',
          fontSize: 12,
          color: '#555',
          lineHeight: 1.4,
          maxHeight: 60,
          overflow: 'hidden',
        }}>
          {messages[0].Content}
        </div>
      )}
    </div>
  );
}

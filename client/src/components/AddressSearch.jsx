import React, { useState, useRef, useEffect, useCallback } from 'react';

const ONEMAP_URL = 'https://www.onemap.gov.sg/api/common/elastic/search';
const DEBOUNCE_MS = 300;
const MAX_RESULTS = 6;

/**
 * Address search bar powered by OneMap Singapore API.
 * Calls onSelect(lat, lng, label) when the user picks an address.
 * Calls onSelect(null, null, null) when the user clears the input.
 *
 * Props:
 *   onSelect(lat, lng, label) — pan + pin callback (provided by App.jsx)
 *   offsetTop — true when BusRouteSearch is visible (Bus mode), shifts down
 */
export default function AddressSearch({ onSelect, offsetTop = false }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [isOpen,  setIsOpen]  = useState(false);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);
  const wrapperRef  = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const search = useCallback(async (val) => {
    if (!val || val.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const url = `${ONEMAP_URL}?searchVal=${encodeURIComponent(val.trim())}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
      const res  = await fetch(url);
      const data = await res.json();

      const items = (data.results || []).slice(0, MAX_RESULTS).map((r) => {
        const building = r.BUILDING && r.BUILDING !== 'NIL' ? r.BUILDING : null;
        const label    = building ? `${building}, ${r.ROAD_NAME}` : r.ROAD_NAME;
        return {
          label,
          address: r.ADDRESS,
          lat: parseFloat(r.LATITUDE),
          lng: parseFloat(r.LONGITUDE),
        };
      });

      setResults(items);
      setIsOpen(items.length > 0);
    } catch (err) {
      console.warn('[AddressSearch] OneMap error:', err);
      setResults([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), DEBOUNCE_MS);
  }

  function handleSelect(item) {
    setQuery(item.label);
    setIsOpen(false);
    setResults([]);
    if (onSelect) onSelect(item.lat, item.lng, item.label);
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    clearTimeout(debounceRef.current);
    if (onSelect) onSelect(null, null, null); // clears the map pin
  }

  return (
    <div
      ref={wrapperRef}
      className={`address-search${offsetTop ? ' address-search--offset' : ''}`}
    >
      <div className="address-search-input-wrap">
        {/* Pin icon */}
        <svg className="address-search-pin" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#1565C0"/>
        </svg>

        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="Search address or place…"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search address"
        />

        {loading && <span className="address-search-spinner">⟳</span>}
        {query && !loading && (
          <button className="address-search-clear" onClick={handleClear} aria-label="Clear">✕</button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="address-search-dropdown">
          {results.map((item, i) => (
            <div
              key={i}
              className="address-search-item"
              onMouseDown={() => handleSelect(item)}
            >
              <div className="address-search-item-name">{item.label}</div>
              <div className="address-search-item-addr">{item.address}</div>
            </div>
          ))}
          <div className="address-search-attribution">Powered by OneMap</div>
        </div>
      )}
    </div>
  );
}
